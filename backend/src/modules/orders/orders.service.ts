import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from '../../database/entities/order.entity';
import { OrderItemEntity } from '../../database/entities/order-item.entity';
import { ProductEntity } from '../../database/entities/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { WhatsAppService, WhatsAppOrderStatus } from './whatsapp.service';

@Injectable()
export class OrdersService {
  constructor(
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

    const orderId =
      createOrderDto.id || `VS-${Math.floor(100000 + Math.random() * 900000)}`;

    let subtotal = 0;
    const itemsToSave: OrderItemEntity[] = [];

    for (const itemDto of createOrderDto.items) {
      // 1. Buscar producto en base de datos para verificar catálogo y calcular precio real
      const product = await this.productRepo.findOne({
        where: { id: itemDto.productId },
      });

      let calculatedPrice = Number(itemDto.price || 0);

      if (product) {
        const basePrice = Number(product.price);
        if (itemDto.tier === 'digital') {
          calculatedPrice = basePrice < 50000 ? basePrice : 25000;
        } else if (itemDto.tier === 'kit') {
          calculatedPrice = product.kitPrice ? Number(product.kitPrice) : Math.round(basePrice * 0.65);
        } else {
          calculatedPrice = basePrice;
        }
      }

      const lineTotal = calculatedPrice * itemDto.quantity;
      subtotal += lineTotal;

      const titleWithTier = itemDto.tier && itemDto.tier !== 'finished'
        ? `${product ? product.title : itemDto.title} [${itemDto.tier.toUpperCase()}]`
        : (product ? product.title : itemDto.title);

      const itemEntity = this.orderItemRepo.create({
        orderId,
        productId: itemDto.productId,
        title: titleWithTier,
        price: calculatedPrice,
        quantity: itemDto.quantity,
        color: itemDto.color,
        size: itemDto.size,
        image: product ? product.image : itemDto.image,
      });

      itemsToSave.push(itemEntity);

      // Decrementar stock únicamente para piezas físicas terminadas o kits
      if (product && product.type === 'amigurumi' && itemDto.tier !== 'digital') {
        const newStock = Math.max(0, product.stock - itemDto.quantity);
        product.stock = newStock;
        if (newStock === 0) {
          product.badge = 'SOLD OUT';
          product.badgeType = 'sold-out';
        }
        await this.productRepo.save(product);
      }
    }

    // Flete unificado: gratis para compras >= $150.000 COP, sino $15.000 COP
    const shippingCost = subtotal >= 150000 ? 0 : 15000;
    const total = subtotal + shippingCost;
    const trackingCode = `KURO-TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    // Construcción enriquecida de dirección para el despacho contraentrega
    const addressSegments = [
      createOrderDto.address,
      createOrderDto.neighborhood ? `Barrio: ${createOrderDto.neighborhood}` : null,
      createOrderDto.deliveryNotes ? `Indicaciones: ${createOrderDto.deliveryNotes}` : null,
      createOrderDto.paymentMethod ? `Método: ${createOrderDto.paymentMethod}` : null,
    ].filter(Boolean);

    const fullAddress = addressSegments.join(' | ');

    const fullCity = createOrderDto.department
      ? `${createOrderDto.city}, ${createOrderDto.department}`
      : createOrderDto.city;

    const order = this.orderRepo.create({
      id: orderId,
      customerName: createOrderDto.customerName,
      email: createOrderDto.email,
      phone: createOrderDto.phone,
      address: fullAddress,
      city: fullCity,
      country: createOrderDto.country || 'Colombia',
      subtotal,
      shippingCost,
      total,
      status: 'CONFIRMED',
      trackingCode,
      items: itemsToSave,
    });

    const savedOrder = await this.orderRepo.save(order);

    // Trigger automated WhatsApp notification for order placed in background
    this.whatsappService
      .dispatchOrderStatusNotification(savedOrder, 'placed')
      .catch((err) => {
        // Non-blocking error handling
      });

    return savedOrder;
  }

  async findOne(id: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }

    return order;
  }

  async findAll(limit = 20, page = 1): Promise<{ orders: OrderEntity[]; total: number }> {
    const [orders, total] = await this.orderRepo.findAndCount({
      relations: ['items'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { orders, total };
  }

  async trackOrder(query: string): Promise<OrderEntity> {
    const clean = query.trim();

    // 1. Search by Order ID
    let order = await this.orderRepo.findOne({
      where: { id: clean },
      relations: ['items'],
    });

    // 2. Search by Tracking Code
    if (!order) {
      order = await this.orderRepo.findOne({
        where: { trackingCode: clean },
        relations: ['items'],
      });
    }

    // 3. Search by Phone number
    if (!order) {
      order = await this.orderRepo.findOne({
        where: { phone: clean },
        relations: ['items'],
        order: { createdAt: 'DESC' },
      });
    }

    if (!order) {
      throw new NotFoundException(`No encontramos ninguna orden con el identificador "${clean}".`);
    }

    // PRIVACY & PII SANITIZATION (Ley 1581 / Habeas Data):
    // Mask sensitive residential details on public tracker to prevent dox/identity leaks
    const maskedName = order.customerName
      ? order.customerName.replace(/^(..)(.*)(..)$/, (_, start, mid, end) => `${start}${'*'.repeat(Math.min(mid.length, 6))}${end}`)
      : 'Cliente KuroPunk';

    const maskedPhone = order.phone
      ? order.phone.replace(/(\d{3})\d+(\d{2})/, '$1******$2')
      : '***';

    const safeAddress = order.city
      ? `Zona de Despacho: ${order.city} (Entrega en mano contraentrega)`
      : 'Dirección protegida contraentrega';

    return {
      ...order,
      customerName: maskedName,
      phone: maskedPhone,
      address: safeAddress,
    };
  }

  async updateStatus(id: string, status: string): Promise<OrderEntity> {
    const order = await this.findOne(id);
    const previousStatus = order.status;
    order.status = status;
    const updated = await this.orderRepo.save(order);

    // Trigger automated WhatsApp notification in background on order lifecycle change
    if (previousStatus !== status) {
      this.whatsappService
        .dispatchOrderStatusNotification(
          updated,
          status as WhatsAppOrderStatus,
        )
        .catch(() => {});
    }

    return updated;
  }
}
