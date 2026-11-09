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
 * Generates a direct WhatsApp link for custom commissions and contact inquiries
 */
export function generateWhatsAppContactUrl({ name, email, type, message }) {
  const typeLabels = {
    commission: 'Comisión 1-de-1 (Amigurumi Personalizado)',
    punto_cruz: 'Gráfico Personalizado (Punto Cruz)',
    drop_inquiry: 'Consulta de Drop / Stock',
    general: 'Mensaje General / Alianza'
  };

  const label = typeLabels[type] || 'Consulta General';
  const text = `🧶 *KUROPUNK // COMISIÓN ARTESANAL*
━━━━━━━━━━━━━━━━━━━━━━━━━
¡Hola equipo KuroPunk! Acabo de enviar una solicitud desde la página web:

👤 *NOMBRE / ALIAS:* ${name || 'Sin nombre'}
📧 *CORREO:* ${email || 'Sin correo'}
📌 *TIPO:* ${label}

💬 *DETALLES DE LA PIEZA O CONSULTA:*
"${message || 'Sin mensaje'}"

━━━━━━━━━━━━━━━━━━━━━━━━━
Quedo atento/a para cotizar y coordinar la creación de la pieza. ¡Muchas gracias! 🖤`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
}
export function generateAdminToCustomerWhatsAppUrl(commission) {
  const cleanPhone = String(commission.phone || '').replace(/\D/g, '');
  const destinationPhone = cleanPhone.startsWith('57') ? cleanPhone : `57${cleanPhone}`;

  const message = `🧶 *KUROPUNK // ATENCIÓN DE COMISIONES PERSONALIZADAS*
━━━━━━━━━━━━━━━━━━━━━━━━━
¡Hola *${commission.name || 'Cliente'}*! 👋

Soy del equipo de *KuroPunk*. Estuvimos revisando la cotización que registraste en nuestra tienda para un encargo a medida:

📋 *RESUMEN DE TU SOLICITUD:*
• *Pieza:* ${commission.typeLabel || commission.type || 'Amigurumi a Medida'}
• *Tamaño / Escala:* ${commission.sizeLabel || commission.size || 'Estándar'}
• *Soporte:* ${commission.hasPlatform ? 'Con plataforma artesanal de exhibición' : 'Sin plataforma (portátil)'}
• *Detalles:* ${commission.complexityLabel || commission.complexity || 'Diseño Estándar'}
• *Precio Estimado:* ${formatCOP(commission.estimatedPrice || 50000)}
• *Tiempo Estimado de Taller:* ${commission.estimatedDays || '4 a 6'} días hábiles

💬 *Tu idea:* "${commission.message || 'Sin mensaje adicional'}"

Quiero conocer más a fondo tu cotización y orientarte con los materiales, colores y diseño para que quede exactamente como te lo imaginas. ¿Tienes alguna foto o detalle adicional que quieras compartirme? 🖤`;

  return `https://wa.me/${destinationPhone}?text=${encodeURIComponent(message)}`;
}

export function generateCustomerToAdminWhatsAppUrl(commission) {
  const message = `🧶 *KUROPUNK // SOLICITUD DE COTIZACIÓN*
━━━━━━━━━━━━━━━━━━━━━━━━━
¡Hola equipo KuroPunk! Acabo de calcular una cotización en la tienda web:

👤 *NOMBRE:* ${commission.name || 'Cliente'}
📱 *MI TELÉFONO:* ${commission.phone || 'N/A'}
📧 *EMAIL:* ${commission.email || 'N/A'}

📋 *DETALLES COTIZADOS:*
• *Pieza:* ${commission.typeLabel || commission.type || 'Amigurumi'}
• *Escala:* ${commission.sizeLabel || commission.size || 'Estándar'}
• *Plataforma:* ${commission.hasPlatform ? 'Sí' : 'No'}
• *Complejidad:* ${commission.complexityLabel || commission.complexity || 'Estándar'}
• *Precio Estimado:* ${formatCOP(commission.estimatedPrice || 50000)}
• *Tiempo Estimado:* ${commission.estimatedDays || '4-6'} días hábiles

💬 *Mensaje:* "${commission.message || 'Sin mensaje'}"

━━━━━━━━━━━━━━━━━━━━━━━━━
Quedo a la espera de su respuesta para acordar los detalles. ¡Gracias! 🖤`;

  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

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
