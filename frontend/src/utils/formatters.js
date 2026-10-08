// KuroPunk Utilities: Currency formatting in Colombian Pesos (COP) & WhatsApp Integration

export const WHATSAPP_PHONE = '573015690382';
export const WHATSAPP_PHONE_DISPLAY = '+57 301 569 0382';

/**
 * Formats a number to Colombian Pesos (COP)
 * Example: 145000 -> "$ 145.000 COP"
 * Automatically normalizes shorthand or legacy USD prices (< 1000) to thousands.
 */
export function formatCOP(amount, showCurrencySuffix = true) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }

  let num = Number(amount);
  // Auto-correct values entered in thousands shorthand (e.g. 45 -> 45000)
  if (num > 0 && num < 1000) {
    num = num * 1000;
  }

  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(num);

  return showCurrencySuffix ? `${formatted} COP` : formatted;
}

/**
 * Generates an executive, cyberpunk-artisan WhatsApp link with prefilled order details for Contraentrega
 */
export function generateWhatsAppOrderUrl(order) {
  const itemsText = (order.items || [])
    .map((item, idx) => {
      let itemPrice = Number(item.price);
      if (itemPrice > 0 && itemPrice < 1000) {
        itemPrice = itemPrice * 1000;
      }
      const unitStr = item.quantity > 1 ? ` (${formatCOP(itemPrice)} c/u)` : '';
      return `${idx + 1}. *${item.title}*\n   ▫️ Cantidad: ${item.quantity} und.${unitStr}\n   ▫️ Subtotal: ${formatCOP(itemPrice * item.quantity)}`;
    })
    .join('\n\n');

  const notesText = order.deliveryNotes
    ? `\n▪️ *Indicaciones:* ${order.deliveryNotes}`
    : '';

  const orderDate = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  let grandTotal = Number(order.total);
  if (grandTotal > 0 && grandTotal < 1000) {
    grandTotal = grandTotal * 1000;
  }

  const message = `🧶 *KUROPUNK* | *Nueva Orden Contraentrega*
━━━━━━━━━━━━━━━━━━━━━━━━━

¡Hola equipo KuroPunk! Acabo de registrar mi pedido en la tienda y quedo a la espera de la entrega personal.

📋 *DETALLES DEL PEDIDO*
• *Orden:* #${order.id}
• *Seguimiento:* ${order.trackingCode || order.id}
• *Fecha:* ${orderDate}

👤 *DESTINATARIO*
• *Nombre:* ${order.customerName}
• *Celular:* ${order.phone}
• *Dirección:* ${order.address}${notesText}
• *Barrio:* ${order.neighborhood || 'N/A'}
• *Ciudad:* ${order.city} (${order.department || 'Colombia'})

🛍️ *PIEZAS SOLICITADAS*
${itemsText}

━━━━━━━━━━━━━━━━━━━━━━━━━
💰 *TOTAL A PAGAR AL RECIBIR:* *${formatCOP(grandTotal)}*
🚚 *MÉTODO:* Pago Contraentrega en Mano (Efectivo / Nequi / Daviplata)
━━━━━━━━━━━━━━━━━━━━━━━━━

Quedo atento/a para coordinar la hora de entrega en mi dirección. ¡Muchas gracias! 🖤`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates an executive WhatsApp inquiry link for order tracking
 */
export function generateWhatsAppTrackingUrl(orderId, phone) {
  const message = `🧶 *KUROPUNK* | *Seguimiento de Pedido*
━━━━━━━━━━━━━━━━━━━━━━━━━

¡Hola equipo KuroPunk!
Quisiera consultar el estado actual de mi pedido contraentrega:

• *Nº de Orden:* #${orderId || 'PENDIENTE'}
• *Celular:* ${phone || 'N/A'}

¿Me podrían confirmar en qué fase de confección o ruta de despacho se encuentra? ¡Muchas gracias! 🖤`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
