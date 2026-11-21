import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { OrderEntity } from '../../database/entities/order.entity';

export type WhatsAppOrderStatus =
  | 'placed'
  | 'confirmed'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  private readonly sentLog = new Set<string>(); // In-memory idempotency cache

  /**
   * Dispatches automated server-side WhatsApp notification based on order lifecycle events
   */
  async dispatchOrderStatusNotification(
    order: OrderEntity,
    targetStatus: WhatsAppOrderStatus,
  ): Promise<boolean> {
    const idempotencyKey = `${order.id}_${targetStatus}`;

    // 1. Idempotency Check: Prevent duplicate messages for the same order and state
    if (this.sentLog.has(idempotencyKey)) {
      this.logger.log(
        JSON.stringify({
          event: 'WA_NOTIFICATION_SKIPPED',
          reason: 'Idempotency hit: already dispatched',
          orderId: order.id,
          targetStatus,
        }),
      );
      return true;
    }

    const rawPhone = order.phone || '';
    const cleanPhone = this.normalizePhoneE164(rawPhone);
    const messageBody = this.buildMessageTemplate(order, targetStatus);

    this.logger.log(
      JSON.stringify({
        event: 'WA_DISPATCH_INITIATED',
        orderId: order.id,
        recipient: cleanPhone,
        status: targetStatus,
      }),
    );

    // 2. Dispatch with retry mechanism (Exponential Backoff)
    let dispatchSuccess = false;
    let externalMessageId = '';
    let errorMessage = '';
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.sendViaMetaCloudApi(cleanPhone, messageBody);
        dispatchSuccess = true;
        externalMessageId = response?.messages?.[0]?.id || `MOCK-${Date.now()}`;
        this.sentLog.add(idempotencyKey);
        break;
      } catch (err: any) {
        errorMessage = err.response?.data?.error?.message || err.message;
        this.logger.warn(
          `[Attempt ${attempt}/${maxRetries}] Failed to send WhatsApp message to ${cleanPhone}: ${errorMessage}`,
        );

        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    if (dispatchSuccess) {
      this.logger.log(
        JSON.stringify({
          event: 'WA_DISPATCH_SUCCESS',
          orderId: order.id,
          targetStatus,
          messageId: externalMessageId,
        }),
      );
    } else {
      this.logger.error(
        JSON.stringify({
          event: 'WA_DISPATCH_FAILED',
          orderId: order.id,
          targetStatus,
          error: errorMessage,
        }),
      );
    }

    return dispatchSuccess;
  }

  /**
   * Meta WhatsApp Business Cloud API (Graph API v20.0) Client
   */
  private async sendViaMetaCloudApi(recipientPhone: string, text: string): Promise<any> {
    const metaToken = process.env.WHATSAPP_TOKEN || process.env.META_WA_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;

    // Simulated dispatch in development mode if Meta live keys are not set
    if (!metaToken || !phoneNumberId) {
      this.logger.log(
        `[MOCK WHATSAPP DISPATCH] Meta API simulated successfully for ${recipientPhone}. Preview:\n"${text.substring(0, 100)}..."`,
      );
      return { messages: [{ id: `MOCK_WA_${Date.now()}` }] };
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'text',
      text: {
        preview_url: false,
        body: text,
      },
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    return response.data;
  }

  /**
   * Generates dynamic templates formatted for the Colombian artisan storefront
   */
  private buildMessageTemplate(order: OrderEntity, status: WhatsAppOrderStatus): string {
    const customerName = order.customerName || 'Apreciado/a Cliente';
    let cleanTotal = Number(order.total || 0);
    if (cleanTotal > 0 && cleanTotal < 1000) {
      cleanTotal = cleanTotal * 1000;
    }
    const formattedTotal = `$ ${cleanTotal.toLocaleString('es-CO')} COP`;

    const itemsSummary = (order.items || [])
      .map((item, idx) => {
        let price = Number(item.price || 0);
        if (price > 0 && price < 1000) {
          price = price * 1000;
        }
        const lineTotal = `$ ${(price * Number(item.quantity)).toLocaleString('es-CO')} COP`;
        const sizeInfo = item.size ? ` (Talla: ${item.size})` : '';
        return `${idx + 1}. *${item.title}*\n   ▫️ Cantidad: ${item.quantity} und.${sizeInfo}\n   ▫️ Subtotal: ${lineTotal}`;
      })
      .join('\n\n');

    const trackingId = order.trackingCode || order.id;

    switch (status) {
      case 'placed':
        return `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
          `> 📦 *NUEVA ORDEN RECIBIDA*\n\n` +
          `¡Hola *${customerName}*! Tu pedido ha sido registrado en nuestro taller.\n\n` +
          `📋 *DETALLES DEL PEDIDO*\n` +
          `▪️ *Orden:* \`#${order.id}\`\n` +
          `▪️ *Seguimiento:* \`${trackingId}\`\n` +
          `▪️ *Destino:* ${order.address}, ${order.city}\n\n` +
          `🛍️ *PIEZAS SOLICITADAS*\n` +
          `${itemsSummary}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `💰 *TOTAL DEL PEDIDO:* *${formattedTotal}*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `¡Muchas gracias por apoyar el arte textil artesanal! 🧶🖤`;

      case 'confirmed': {
        const depositPaid = Number(order.depositRequiredAmount || order.depositBaseAmount || 0);
        const remaining = Number(order.remainingBalance ?? Math.max(0, cleanTotal - depositPaid));
        const formattedDeposit = `$ ${depositPaid.toLocaleString('es-CO')} COP`;
        const formattedRemaining = `$ ${remaining.toLocaleString('es-CO')} COP`;
        return `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
          `> ✅ *ANTICIPO ACEPTADO · PEDIDO EN COLA OFICIAL*\n\n` +
          `¡Hola *${customerName}*! Confirmamos la recepción de tu anticipo del 50% (*${formattedDeposit}*) para la orden \`#${order.id}\`.\n\n` +
          `📋 *ESTADO DE TU ORDEN*\n` +
          `▪️ *Estado:* En Cola Oficial de Producción\n` +
          `▪️ *Seguimiento:* \`${trackingId}\`\n` +
          `▪️ *Anticipo Aprobado:* ${formattedDeposit}\n` +
          `▪️ *Saldo Restante Contraentrega (50%):* *${formattedRemaining}*\n\n` +
          `Iniciamos la confección de tu pieza y te avisaremos en cuanto salga a despacho. ¡Gracias por tu compra! 🧶🖤`;
      }

      case 'in_production':
        return `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
          `> 🛠️ *ACTUALIZACIÓN DE TALLER*\n\n` +
          `¡Hola *${customerName}*! Tu pedido \`#${order.id}\` ha ingresado a la mesa de confección.\n\n` +
          `▪️ *Destino:* ${order.address}, ${order.city}\n` +
          `▪️ *Seguimiento:* \`${trackingId}\`\n\n` +
          `Cada puntada está siendo trabajada a mano con hilado de alta torsión. Te avisaremos en cuanto esté listo para despacho. 🧶`;

      case 'shipped': {
        const storefrontUrl = (process.env.FRONTEND_URL || 'https://kuropunk.vercel.app').replace(/\/+$/, '');
        return `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
          `> 🛵 *TU PEDIDO VA EN CAMINO*\n\n` +
          `¡Hola *${customerName}*! Tu paquete ya salió de nuestro taller y se encuentra en ruta de entrega.\n\n` +
          `📋 *DATOS DE ENTREGA*\n` +
          `▪️ *Orden:* \`#${order.id}\`\n` +
          `▪️ *Destino:* ${order.address}, ${order.city}\n` +
          `▪️ *Total a Pagar:* *${formattedTotal}* (Efectivo / Nequi / Daviplata)\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🔎 *Código de Rastreo:* \`${trackingId}\`\n` +
          `🚚 *Rastreo en línea:* ${storefrontUrl}/#/ (Ingresa tu código ${trackingId})\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `El mensajero te contactará a este número antes de llegar a tu dirección. Ten a mano el valor exacto o tu app de Nequi/Daviplata. 🧶🖤`;
      }

      case 'delivered':
        return `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
          `> ✅ *PEDIDO ENTREGADO CON ÉXITO*\n\n` +
          `Estimado/a *${customerName}*,\n` +
          `Confirmamos que la orden \`#${order.id}\` ha sido entregada y verificada a satisfacción.\n\n` +
          `✨ Tu pieza incluye su *Certificado de Autenticidad Oficial KuroPunk*.\n\n` +
          `Nos honra que formes parte de nuestra comunidad de coleccionistas de arte textil underground. Esperamos que disfrutes tu pieza tanto como nosotros disfrutamos tejiéndola.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Si deseas compartirnos una foto de tu pieza o dejarnos una reseña, puedes hacerlo directamente por aquí. ¡Muchas gracias por tu compra! 🖤🧶\n\n` +
          `🌐 *KuroPunk Colombia* | +57 323 8937221`;

      case 'cancelled':
        return `⚠️ *KUROPUNK* | *Notificación de Pedido*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `🚫 *PEDIDO CANCELADO*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Hola *${customerName}*,\n` +
          `Te confirmamos que la orden *#${order.id}* ha sido dada de baja en nuestro sistema.\n\n` +
          `Si se trató de un error o deseas reactivar tu encargo o modificar la fecha de entrega, escríbenos a este mismo número y te atenderemos con gusto.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📞 *Atención al Cliente:* +57 323 8937221`;

      default:
        return `🔔 *KUROPUNK* | *Novedad en tu Pedido*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Orden: *#${order.id}*\n` +
          `Estado actual: *${String(status).toUpperCase()}*\n` +
          `Seguimiento: \`${trackingId}\`\n\n` +
          `Para cualquier duda, estamos atentos por este medio.\n` +
          `📞 +57 323 8937221`;
    }
  }

  /**
   * Sanitizes phone numbers to standard E.164 international format
   * Example: "3238937221" -> "+573238937221"
   */
  private normalizePhoneE164(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('57') && digits.length >= 12) {
      return `+${digits}`;
    }
    if (digits.length === 10) {
      return `+57${digits}`;
    }
    return `+${digits}`;
  }
}
