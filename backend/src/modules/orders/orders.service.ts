import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { randomUUID } from 'crypto';
import { OrderEntity } from '../../database/entities/order.entity';
import { OrderItemEntity } from '../../database/entities/order-item.entity';
import { ProductEntity } from '../../database/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ReportPaymentDto, VerifyDepositDto } from './dto/report-payment.dto';
import { WhatsAppService, WhatsAppOrderStatus } from './whatsapp.service';

const ALLOWED_STATUSES = [
  'ESPERANDO_PAGO',
  'VERIFICANDO_ANTICIPO',
  'EN_COLA',
  'PLACED',
  'PENDING',
  'CONFIRMED',
  'IN_PRODUCTION',
  'DISPATCHED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
] as const;

const DEPOSIT_THRESHOLD_COP = 50000;

@Injectable()
export class OrdersService {
  // Mapa en memoria para idempotencia de compras (evita doble clic en ventana de 15s)
  private readonly recentOrderFingerprints = new Map<string, number>();

  // Cola de serialización de transacciones para evitar colisiones SQLITE_BUSY / nested transactions en ráfagas concurrentes
  private txMutex: Promise<unknown> = Promise.resolve();

  private runAtomicTransaction<T>(work: (manager: EntityManager) => Promise<T>): Promise<T> {
    const next = this.txMutex.then(() => this.dataSource.transaction(work));
    this.txMutex = next.catch(() => {});
    return next;
  }

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(OrderItemEntity)
    private readonly orderItemRepo: Repository<OrderItemEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepo: Repository<ProductEntity>,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async create(createOrderDto: CreateOrderDto): Promise<OrderEntity> {
    if (!createOrderDto.items || createOrderDto.items.length === 0) {
      throw new BadRequestException('El pedido debe contener al menos un producto.');
    }

    // 1. Protección anti-doble clic (Idempotencia por huella de comprador + carrito en ventana de 15s)
    const itemsSignature = createOrderDto.items
      .map((i) => `${i.productId}:${i.quantity}`)
      .sort()
      .join('|');
    const fingerprint = `${(createOrderDto.phone || createOrderDto.email).trim().toLowerCase()}__${itemsSignature}`;
    const now = Date.now();
    const lastAttempt = this.recentOrderFingerprints.get(fingerprint);

    if (lastAttempt && now - lastAttempt < 15000) {
      throw new ConflictException(
        'Ya estamos procesando un pedido idéntico tuyo. Espera unos segundos para evitar cobros duplicados.',
      );
    }
    this.recentOrderFingerprints.set(fingerprint, now);

    // Limpieza periódica de huellas expiradas
    if (this.recentOrderFingerprints.size > 500) {
      for (const [k, ts] of this.recentOrderFingerprints.entries()) {
        if (now - ts >= 15000) this.recentOrderFingerprints.delete(k);
      }
    }

    try {
      // 2. Transacción Atómica: Si falla 1 solo ítem, se hace ROLLBACK de todo el stock descontado
      const savedOrder = await this.runAtomicTransaction(async (manager) => {
        const orderId = `VS-${randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase()}`;
        let subtotal = 0;
        const itemsToSave: OrderItemEntity[] = [];

        for (const itemDto of createOrderDto.items) {
          // Prohibido confiar en productos que no existan en la base de datos (Anti-Price Tampering)
          const product = await manager.findOne(ProductEntity, {
            where: { id: itemDto.productId },
          });

          if (!product) {
            throw new NotFoundException(
              `El producto "${itemDto.productId}" no existe en el catálogo oficial.`,
            );
          }

          // Solo se vende el coleccionable físico al precio oficial de la BD (ignora itemDto.price y tier)
          const officialUnitPrice = Number(product.price);
          if (officialUnitPrice <= 0) {
            throw new BadRequestException(`Precio inválido en catálogo para "${product.title}".`);
          }

          // Descuento atómico condicional dentro de la misma transacción
          const qty = Number(itemDto.quantity);
          const updateResult = await manager
            .createQueryBuilder()
            .update(ProductEntity)
            .set({
              stock: () => `stock - ${qty}`,
              badge: () =>
                `CASE WHEN stock - ${qty} <= 0 THEN 'SOLD OUT' ELSE badge END`,
              badgeType: () =>
                `CASE WHEN stock - ${qty} <= 0 THEN 'sold-out' ELSE badgeType END`,
            })
            .where('id = :id AND stock >= :qty', {
              id: product.id,
              qty,
            })
            .execute();

          if (updateResult.affected === 0) {
            throw new BadRequestException(
              `La pieza "${product.title}" no cuenta con unidades suficientes en taller (${product.stock} disponible${product.stock === 1 ? '' : 's'}).`,
            );
          }

          const lineTotal = officialUnitPrice * qty;
          subtotal += lineTotal;

          const itemEntity = manager.create(OrderItemEntity, {
            orderId,
            productId: product.id,
            title: product.title,
            price: officialUnitPrice,
            quantity: qty,
            color: itemDto.color || 'Asphalt',
            size: product.size || itemDto.size || 'MED',
            image: product.image,
          });

          itemsToSave.push(itemEntity);
        }

        const shippingCost = 0; // Entrega personal acordada en Bogotá / Nacional
        const total = subtotal + shippingCost;
        const trackingCode = `KURO-TRK-${randomUUID().replace(/-/g, '').substring(0, 7).toUpperCase()}`;

        // REGLA BLINDADA DE LOS $50.000 COP (Calculada estrictamente en el servidor)
        const requiresDeposit = total >= DEPOSIT_THRESHOLD_COP;
        let depositBaseAmount = 0;
        let depositRequiredAmount = 0;
        let remainingBalance = total;
        let paymentStatus = 'NO_REQUIERE';
        let orderStatus = 'EN_COLA';
        let queuedAt: Date | null = new Date();

        if (requiresDeposit) {
          depositBaseAmount = Math.ceil(total * 0.20);
          remainingBalance = total - depositBaseAmount;
          paymentStatus = 'PENDIENTE_ANTICIPO';
          orderStatus = 'ESPERANDO_PAGO';
          queuedAt = null; // No entra a la cola hasta verificar el anticipo

          // Candado Anti-Fraude de Monto Único (1 a 99 pesos colombianos no usados en los últimos 30 min)
          const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
          const recentPending = await manager
            .createQueryBuilder(OrderEntity, 'o')
            .select(['o.depositRequiredAmount'])
            .where('o.status = :st AND o.createdAt >= :since', {
              st: 'ESPERANDO_PAGO',
              since: thirtyMinsAgo,
            })
            .getMany();

          const usedAmounts = new Set(
            recentPending.map((o) => Math.round(Number(o.depositRequiredAmount))),
          );

          const availableOffsets: number[] = [];
          for (let offset = 1; offset <= 99; offset++) {
            if (!usedAmounts.has(depositBaseAmount + offset)) {
              availableOffsets.push(offset);
            }
          }

          const uniquePesos =
            availableOffsets.length > 0
              ? availableOffsets[Math.floor(Math.random() * availableOffsets.length)]
              : Math.floor(Math.random() * 99) + 1;

          depositRequiredAmount = depositBaseAmount + uniquePesos;
        }

        const addressSegments = [
          createOrderDto.address,
          createOrderDto.neighborhood ? `Barrio: ${createOrderDto.neighborhood}` : null,
          createOrderDto.deliveryNotes ? `Indicaciones: ${createOrderDto.deliveryNotes}` : null,
          createOrderDto.paymentMethod ? `Método: ${createOrderDto.paymentMethod}` : null,
        ].filter(Boolean);

        const fullCity = createOrderDto.department
          ? `${createOrderDto.city}, ${createOrderDto.department}`
          : createOrderDto.city;

        const order = manager.create(OrderEntity, {
          id: orderId,
          customerName: createOrderDto.customerName,
          email: createOrderDto.email,
          phone: createOrderDto.phone,
          address: addressSegments.join(' | '),
          city: fullCity,
          country: createOrderDto.country || 'Colombia',
          subtotal,
          shippingCost,
          total,
          requiresDeposit,
          depositBaseAmount,
          depositRequiredAmount,
          remainingBalance,
          paymentStatus,
          queuedAt,
          status: orderStatus,
          trackingCode,
          items: itemsToSave,
        });

        return await manager.save(OrderEntity, order);
      });

      this.whatsappService
        .dispatchOrderStatusNotification(savedOrder, 'placed')
        .catch(() => {});

      return savedOrder;
    } catch (error) {
      // Si la transacción falló (ej. sin stock), liberar la huella para que el usuario pueda ajustar su carrito
      this.recentOrderFingerprints.delete(fingerprint);
      throw error;
    }
  }

  /**
   * Cliente reporta el número de comprobante / referencia de transferencia del anticipo del 20%
   */
  async reportPayment(orderId: string, dto: ReportPaymentDto): Promise<OrderEntity> {
    const cleanRef = (dto.paymentReference || '').trim().toUpperCase();
    if (!cleanRef || cleanRef.length < 4) {
      throw new BadRequestException('Debes ingresar un número de comprobante o referencia válido.');
    }

    return await this.runAtomicTransaction(async (manager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException(`Orden #${orderId} no encontrada.`);
      }

      // Candado Anti-Fraude: Verificar que esta referencia de pago NUNCA haya sido usada en otro pedido
      const duplicateRefOrder = await manager
        .createQueryBuilder(OrderEntity, 'o')
        .where('UPPER(o.paymentReference) = :ref AND o.id != :id', {
          ref: cleanRef,
          id: orderId,
        })
        .getOne();

      if (duplicateRefOrder) {
        throw new ConflictException(
          `El comprobante o referencia "${cleanRef}" ya fue registrado anteriormente en otro pedido. Verifica el número de tu transferencia.`,
        );
      }

      order.paymentReference = cleanRef;
      if (dto.paymentProofUrl) {
        order.paymentProofUrl = dto.paymentProofUrl.trim();
      }
      order.paymentReportedAt = new Date();
      order.paymentStatus = 'VERIFICANDO_ANTICIPO';
      order.status = 'VERIFICANDO_ANTICIPO';

      return await manager.save(OrderEntity, order);
    });
  }

  /**
   * Admin aprueba o rechaza el anticipo y asigna puesto oficial en la cola (queuedAt)
   */
  async verifyDeposit(orderId: string, dto: VerifyDepositDto): Promise<OrderEntity> {
    const action = (dto.action || '').toUpperCase();

    return await this.runAtomicTransaction(async (manager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException(`Orden #${orderId} no encontrada.`);
      }

      if (action === 'CONFIRM') {
        order.paymentStatus = 'ANTICIPO_VERIFICADO';
        order.status = 'EN_COLA';
        order.queuedAt = new Date();
      } else if (action === 'REJECT') {
        order.paymentStatus = 'RECHAZADO';
        order.status = 'ESPERANDO_PAGO';
      } else {
        throw new BadRequestException('Acción de verificación inválida.');
      }

      return await manager.save(OrderEntity, order);
    });
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Orden #${id} no encontrada`);
    }

    return order;
  }

  async findAll(limit = 20, page = 1): Promise<{ orders: OrderEntity[]; total: number }> {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 20), 100);
    const safePage = Math.max(1, Number(page) || 1);

    const [orders, total] = await this.orderRepo.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: safeLimit,
      skip: (safePage - 1) * safeLimit,
    });

    return { orders, total };
  }

  async trackOrder(query: string): Promise<OrderEntity> {
    const clean = (query || '').trim();
    if (!clean || clean.length < 5) {
      throw new BadRequestException('Ingresa un código de orden (#VS-...) o código de rastreo válido.');
    }

    // Seguridad Anti-IDOR: Solo permitir búsqueda por ID de Orden o Tracking Code (NO por teléfono suelto)
    let order = await this.orderRepo.findOne({
      where: { id: clean },
      relations: ['items'],
    });

    if (!order) {
      order = await this.orderRepo.findOne({
        where: { trackingCode: clean },
        relations: ['items'],
      });
    }

    if (!order) {
      throw new NotFoundException(`No encontramos ninguna orden con el código "${clean}".`);
    }

    const nameParts = (order.customerName || 'Cliente').trim().split(/\s+/);
    const maskedName = nameParts
      .map((part) => (part.length <= 2 ? `${part[0]}*` : `${part.slice(0, 2)}****`))
      .join(' ');

    const maskedPhone = order.phone
      ? order.phone.replace(/(\d{3})\d+(\d{2})/, '$1******$2')
      : '***';

    const safeAddress = order.city
      ? `Zona de Despacho: ${order.city} (Entrega en mano contraentrega)`
      : 'Dirección protegida contraentrega';

    return {
      ...order,
      email: '***@***',
      customerName: maskedName,
      phone: maskedPhone,
      address: safeAddress,
    };
  }

  async updateStatus(id: string, status: string): Promise<OrderEntity> {
    const normalizedStatus = (status || '').trim().toUpperCase();
    const isCancelTarget =
      normalizedStatus === 'CANCELLED' ||
      normalizedStatus === 'CANCELADO' ||
      normalizedStatus === 'CANCEL';

    const finalStatus = isCancelTarget ? 'CANCELLED' : normalizedStatus;

    if (!ALLOWED_STATUSES.includes(finalStatus as any)) {
      throw new BadRequestException(`Estado de orden no válido: "${status}".`);
    }

    const updatedOrder = await this.runAtomicTransaction(async (manager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException(`Orden #${id} no encontrada.`);
      }

      const prevUpper = (order.status || '').toUpperCase();

      // Bloquear transiciones ilegales desde una orden ya cancelada (evita inflación infinita de stock)
      if (prevUpper === 'CANCELLED' && finalStatus !== 'CANCELLED') {
        throw new BadRequestException(
          `La orden #${id} ya fue cancelada y su stock fue restituido; no puede reabrirse.`,
        );
      }

      if (prevUpper === finalStatus) {
        return order;
      }

      // Cambio de estado atómico condicional: garantiza que solo 1 petición concurrente gane la transición
      const statusUpdate = await manager
        .createQueryBuilder()
        .update(OrderEntity)
        .set({ status: finalStatus })
        .where('id = :id AND status = :prevStatus', {
          id,
          prevStatus: order.status,
        })
        .execute();

      if (statusUpdate.affected === 0) {
        throw new ConflictException(
          `El estado de la orden #${id} fue modificado simultáneamente por otra operación.`,
        );
      }

      // Si pasa a CANCELLED por primera vez, restituir el stock de forma atómica dentro de la transacción
      if (finalStatus === 'CANCELLED' && order.items?.length > 0) {
        for (const item of order.items) {
          if (item.productId) {
            await manager
              .createQueryBuilder()
              .update(ProductEntity)
              .set({
                stock: () => `stock + ${Number(item.quantity)}`,
                badge: () =>
                  `CASE WHEN badge = 'SOLD OUT' THEN 'EDICIÓN LIMITADA' ELSE badge END`,
                badgeType: () =>
                  `CASE WHEN badgeType = 'sold-out' THEN 'primary' ELSE badgeType END`,
              })
              .where('id = :id', { id: item.productId })
              .execute();
          }
        }
      }

      order.status = finalStatus;
      return order;
    });

    this.whatsappService
      .dispatchOrderStatusNotification(updatedOrder, finalStatus.toLowerCase() as WhatsAppOrderStatus)
      .catch(() => {});

    return updatedOrder;
  }

  async remove(id: string): Promise<{ success: boolean; id: string }> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!order) {
      return { success: true, id };
    }
    await this.orderItemRepo.delete({ order: { id } });
    await this.orderRepo.delete({ id });
    return { success: true, id };
  }

  async clearAll(): Promise<{ success: boolean; count: number }> {
    await this.orderItemRepo.delete({});
    const res = await this.orderRepo.delete({});
    return { success: true, count: res.affected || 0 };
  }
}
