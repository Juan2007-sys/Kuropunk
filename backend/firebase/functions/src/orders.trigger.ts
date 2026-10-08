import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as logger from 'firebase-functions/logger';
import axios from 'axios';

interface OrderItem {
  title: string;
  quantity: number;
  unitPrice?: number;
  price?: number;
  size?: string;
  color?: string;
}

interface OrderData {
  id: string;
  trackingNumber?: string;
  trackingCode?: string;
  customerData?: {
    name: string;
    phone: string;
    email?: string;
    shippingAddress: string;
  };
  customerName?: string;
  phone?: string;
  shippingAddress?: string;
  address?: string;
  city?: string;
  totalAmount?: number;
  total?: number;
  items?: OrderItem[];
  status?: string;
}

/**
 * Normalizes phone numbers to Colombian E.164 (+57)
 */
function normalizePhone(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (digits.startsWith('57') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length === 10) {
    return `+57${digits}`;
  }
  return `+${digits}`;
}

/**
 * Formats Colombian currency without decimals
 */
function formatCOP(amount: number): string {
  let num = Number(amount || 0);
  if (num > 0 && num < 1000) {
    num = num * 1000;
  }
  return `$ ${num.toLocaleString('es-CO')} COP`;
}

/**
 * Dispatches an automated HTTP POST notification via WhatsApp Cloud API
 */
async function sendWhatsAppMessage(recipientPhone: string, bodyText: string) {
  const metaToken = process.env.WHATSAPP_TOKEN || process.env.META_WA_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_PHONE_NUMBER_ID;

  if (!metaToken || !phoneNumberId) {
    logger.info(`[Simulación WhatsApp Cloud API] Enviar a ${recipientPhone}:\n${bodyText}`);
    return { status: 'mock_sent', recipient: recipientPhone };
  }

  const endpoint = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
  const response = await axios.post(
    endpoint,
    {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: recipientPhone.replace('+', ''),
      type: 'text',
      text: {
        preview_url: false,
        body: bodyText,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${metaToken}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      timeout: 10000,
    }
  );

  return response.data;
}

/**
 * Trigger: On Order Created in Firestore 'orders/{orderId}'
 * Dispatches confirmation notification automatically without client intervention.
 */
export const onOrderCreated = onDocumentCreated('orders/{orderId}', async (event) => {
  const snap = event.data;
  if (!snap) return;

  const order = snap.data() as OrderData;
  const orderId = order.id || event.params.orderId;
  const trackingCode = order.trackingNumber || order.trackingCode || `KP-TRK-${orderId}`;
  const customerName = order.customerData?.name || order.customerName || 'Cliente KuroPunk';
  const rawPhone = order.customerData?.phone || order.phone || '';
  const cleanPhone = normalizePhone(rawPhone);
  const destination = order.customerData?.shippingAddress || `${order.address || ''}, ${order.city || ''}`;
  const totalCOP = formatCOP(order.totalAmount || order.total || 0);

  const itemList = (order.items || [])
    .map((item, idx) => {
      let price = Number(item.unitPrice || item.price || 0);
      if (price > 0 && price < 1000) {
        price = price * 1000;
      }
      const sizeStr = item.size ? ` (Talla: ${item.size})` : '';
      return `${idx + 1}. *${item.title}*\n   ▫️ Cantidad: ${item.quantity} und.${sizeStr}\n   ▫️ Subtotal: ${formatCOP(price * item.quantity)}`;
    })
    .join('\n\n');

  const message =
    `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
    `> 📦 *NUEVA ORDEN CONTRAENTREGA*\n\n` +
    `¡Hola *${customerName}*! Tu pedido ha sido registrado con éxito en nuestro taller.\n\n` +
    `📋 *DETALLES DEL PEDIDO*\n` +
    `▪️ *Orden:* \`#${orderId}\`\n` +
    `▪️ *Seguimiento:* \`${trackingCode}\`\n` +
    `▪️ *Destino:* ${destination}\n\n` +
    `🛍️ *PIEZAS SOLICITADAS*\n` +
    `${itemList}\n\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n` +
    `💰 *TOTAL A PAGAR EN LA ENTREGA:* *${totalCOP}*\n` +
    `🚚 *MÉTODO:* Pago Contraentrega en Mano (Pagas al recibir)\n` +
    `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Iniciamos la preparación de tus piezas. Te notificaremos cuando el mensajero salga hacia tu dirección. ¡Muchas gracias por apoyar el arte textil artesanal! 🧶🖤`;

  logger.info(`[onOrderCreated Trigger] Despachando notificación para orden #${orderId} a ${cleanPhone}`);

  try {
    await sendWhatsAppMessage(cleanPhone, message);
  } catch (error: any) {
    logger.error(`[onOrderCreated Trigger Error] Error despachando WhatsApp: ${error?.message}`);
  }
});

/**
 * Trigger: On Order Updated in Firestore 'orders/{orderId}'
 * Dispatches update when order status transitions to 'shipped'.
 */
export const onOrderUpdated = onDocumentUpdated('orders/{orderId}', async (event) => {
  const before = event.data?.before.data() as OrderData | undefined;
  const after = event.data?.after.data() as OrderData | undefined;

  if (!before || !after) return;

  // Check if status changed to 'shipped'
  if (before.status !== 'shipped' && after.status === 'shipped') {
    const orderId = after.id || event.params.orderId;
    const trackingCode = after.trackingNumber || after.trackingCode || `KP-TRK-${orderId}`;
    const customerName = after.customerData?.name || after.customerName || 'Cliente KuroPunk';
    const rawPhone = after.customerData?.phone || after.phone || '';
    const cleanPhone = normalizePhone(rawPhone);
    const destination = after.customerData?.shippingAddress || `${after.address || ''}, ${after.city || ''}`;
    const totalCOP = formatCOP(after.totalAmount || after.total || 0);

    const message =
      `> 💀 *KUROPUNK* | _Taller Textil Underground_\n` +
      `> 🛵 *TU PEDIDO VA EN CAMINO*\n\n` +
      `¡Hola *${customerName}*! Tu paquete ya salió de nuestro taller y se encuentra en ruta de entrega.\n\n` +
      `📋 *DATOS DE ENTREGA*\n` +
      `▪️ *Orden:* \`#${orderId}\`\n` +
      `▪️ *Destino:* ${destination}\n` +
      `▪️ *Total a Pagar:* *${totalCOP}* (Efectivo / Nequi / Daviplata)\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔎 *Código de Rastreo:* \`${trackingCode}\`\n` +
      `🚚 *Seguimiento en línea:* https://kuropunk.com/rastreo/${trackingCode}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `El mensajero te contactará a este número antes de llegar a tu dirección. Ten a mano el valor exacto o tu app de Nequi/Daviplata. 🧶🖤`;

    logger.info(`[onOrderUpdated Trigger] Despachando estado en ruta para #${orderId} a ${cleanPhone}`);

    try {
      await sendWhatsAppMessage(cleanPhone, message);
    } catch (error: any) {
      logger.error(`[onOrderUpdated Trigger Error] Error despachando WhatsApp: ${error?.message}`);
    }
  }
});
