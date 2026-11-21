// KuroPunk Utilities: Currency formatting in Colombian Pesos (COP) & WhatsApp Integration

export const WHATSAPP_PHONE = '573238937221';
export const WHATSAPP_PHONE_DISPLAY = '+57 323 8937221';

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
 * Detects whether the current browser is running on a mobile device.
 * Mobile uses wa.me (native WhatsApp app); desktop uses web.whatsapp.com/send
 * because Windows WhatsApp Desktop's whatsapp:// handler corrupts emojis into '?'.
 */
export function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia('(pointer: coarse)').matches && window.innerWidth <= 900;
  }
  return false;
}

/**
 * Builds a cross-device WhatsApp URL preserving UTF-8 emojis on both mobile and PC.
 * @param {string} phone - Phone number with or without country code (defaults to WHATSAPP_PHONE)
 * @param {string} [message] - Prefilled UTF-8 message
 * @param {{ mode?: 'mobile' | 'desktop' }} [options] - Optional override for deterministic testing
 */
export function buildWhatsAppUrl(phone = WHATSAPP_PHONE, message = '', options = {}) {
  const cleanPhone = String(phone || WHATSAPP_PHONE).replace(/\D/g, '');
  const e164Phone = cleanPhone.startsWith('57') && cleanPhone.length >= 12 ? cleanPhone : `57${cleanPhone}`;
  const mode = options.mode || (isMobileDevice() ? 'mobile' : 'desktop');
  const encodedText = message ? encodeURIComponent(message) : '';

  if (mode === 'mobile') {
    return encodedText
      ? `https://wa.me/${e164Phone}?text=${encodedText}`
      : `https://wa.me/${e164Phone}`;
  }

  return encodedText
    ? `https://web.whatsapp.com/send?phone=${e164Phone}&text=${encodedText}`
    : `https://web.whatsapp.com/send?phone=${e164Phone}`;
}

/**
 * Builds the UTF-8 WhatsApp order summary message (safe for URL encoding and clipboard copy).
 */
export function buildWhatsAppOrderMessage(order) {
  const itemsText = (order.items || [])
    .map((item, idx) => {
      let itemPrice = Number(item.price);
      if (itemPrice > 0 && itemPrice < 1000) {
        itemPrice = itemPrice * 1000;
      }
      const cleanTitle = String(item.title || '').replace(/\s*\/\/\s*/g, ' · ');
      const unitStr = item.quantity > 1 ? ` (${formatCOP(itemPrice)} c/u)` : '';
      return `${idx + 1}. *${cleanTitle}*\n   ▪️ Cantidad: ${item.quantity} und.${unitStr}\n   ▪️ Subtotal: ${formatCOP(itemPrice * item.quantity)}`;
    })
    .join('\n\n');

  const notesText = order.deliveryNotes
    ? `\n• *Indicaciones:* ${order.deliveryNotes}`
    : '';

  const orderDate = new Date().toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  let grandTotal = Number(order.total || order.totalAmount || 0);
  if (grandTotal > 0 && grandTotal < 1000) {
    grandTotal = grandTotal * 1000;
  }

  const requiresDeposit =
    order.requiresDeposit !== undefined ? Boolean(order.requiresDeposit) : grandTotal >= 50000;
  const depositPaid = Number(
    order.depositRequiredAmount || order.depositBaseAmount || (requiresDeposit ? Math.ceil(grandTotal * 0.5) : 0),
  );
  const remainingBalance = Number(
    order.remainingBalance !== undefined ? order.remainingBalance : grandTotal - depositPaid,
  );

  const paymentSummaryBlock = requiresDeposit
    ? `💰 *TOTAL DEL PEDIDO:* ${formatCOP(grandTotal)}\n` +
      `✅ *ANTICIPO REPORTADO (50%):* *${formatCOP(depositPaid)}*${
        order.paymentReference ? ` (Ref: #${order.paymentReference})` : ''
      }\n` +
      `💵 *SALDO AL RECIBIR (50%):* *${formatCOP(remainingBalance)}*`
    : `💰 *TOTAL A PAGAR AL RECIBIR:* *${formatCOP(grandTotal)}*`;

  return `🧶 *KUROPUNK* | *${requiresDeposit ? 'Orden con Anticipo 50%' : 'Nueva Orden Contraentrega'}*
━━━━━━━━━━━━━━━━━━━━━━━━━

¡Hola equipo KuroPunk! Acabo de registrar mi pedido en la tienda${
    requiresDeposit ? ' junto con el comprobante del anticipo del 50%' : ''
  }.

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
${paymentSummaryBlock}
🚚 *MODALIDAD SALDO:* Contraentrega en Mano (Efectivo / Nequi / Daviplata)
━━━━━━━━━━━━━━━━━━━━━━━━━

Quedo atento/a a la confirmación y entrega. ¡Muchas gracias! 🖤`;
}

/**
 * Generates an executive, cyberpunk-artisan WhatsApp link with prefilled order details for Contraentrega
 */
export function generateWhatsAppOrderUrl(order, options) {
  return buildWhatsAppUrl(WHATSAPP_PHONE, buildWhatsAppOrderMessage(order), options);
}

/**
 * Generates a direct WhatsApp notification link from Admin to the Customer when Deposit is Approved or Rejected
 */
export function generateAdminDepositNoticeWhatsAppUrl(order, action = 'CONFIRM', options) {
  const rawPhone = String(order?.customerData?.phone || order?.phone || '').replace(/\D/g, '');
  if (!rawPhone) return '';
  const customerName = order?.customerData?.name || order?.customerName || 'Cliente';
  const totalVal = Number(order?.totalAmount || order?.total || 0);
  const depositVal = Number(order?.depositRequiredAmount || order?.depositBaseAmount || Math.ceil(totalVal * 0.5));
  const remainingVal = Number(order?.remainingBalance ?? Math.max(0, totalVal - depositVal));
  const trackingCode = order?.trackingCode || order?.trackingNumber || order?.id;

  const isApproved = String(action).toUpperCase() === 'CONFIRM';
  const message = isApproved
    ? `🧶 *KUROPUNK TALLER* | *¡Anticipo Aceptado!*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `¡Hola *${customerName}*! Te confirmamos que hemos verificado y *ACEPTADO* tu anticipo del 50% (*${formatCOP(depositVal)}*) para tu pedido.\n\n` +
      `✅ *Estado actual:* En Cola Oficial de Producción\n` +
      `📋 *Orden:* #${order.id}\n` +
      `🔎 *Código de rastreo:* ${trackingCode}\n` +
      `💵 *Saldo a pagar al recibir (50%):* *${formatCOP(remainingVal)}*\n\n` +
      `Ya iniciamos el agendamiento de tu pieza en el taller y te avisaremos por aquí cuando salga a entrega. ¡Muchas gracias por tu compra! 🖤`
    : `⚠️ *KUROPUNK TALLER* | *Novedad con tu Comprobante*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `Hola *${customerName}*, revisamos el soporte de la orden *#${order.id}* (Ref: ${order.paymentReference || 'N/A'}) por *${formatCOP(depositVal)}*, pero aún no nos refleja en cuenta o la captura no es legible.\n\n` +
      `Por favor envíanos la foto clara del comprobante por este chat o súbela nuevamente en la página con tu código de rastreo *${trackingCode}*. ¡Quedamos atentos!`;

  return buildWhatsAppUrl(rawPhone, message, options);
}

/**
 * Generates a direct WhatsApp link for custom commissions and contact inquiries
 */
export function generateWhatsAppContactUrl({ name, email, type, message }, options) {
  const typeLabels = {
    commission: 'Comisión 1-de-1 (Amigurumi Personalizado)',
    punto_cruz: 'Gráfico Personalizado (Punto Cruz)',
    drop_inquiry: 'Consulta de Drop / Stock',
    general: 'Mensaje General / Alianza'
  };

  const label = typeLabels[type] || 'Consulta General';
  const text = `🧶 *KUROPUNK · COMISIÓN ARTESANAL*
━━━━━━━━━━━━━━━━━━━━━━━━━
¡Hola equipo KuroPunk! Acabo de enviar una solicitud desde la página web:

👤 *NOMBRE / ALIAS:* ${name || 'Sin nombre'}
• *CORREO:* ${email || 'Sin correo'}
• *TIPO:* ${label}

💬 *DETALLES DE LA PIEZA O CONSULTA:*
"${message || 'Sin mensaje'}"

━━━━━━━━━━━━━━━━━━━━━━━━━
Quedo atento/a para cotizar y coordinar la creación de la pieza. ¡Muchas gracias! 🖤`;

  return buildWhatsAppUrl(WHATSAPP_PHONE, text, options);
}

export function generateAdminToCustomerWhatsAppUrl(commission, options) {
  const cleanPhone = String(commission.phone || '').replace(/\D/g, '');
  if (!cleanPhone) return '';

  const message = `🧶 *KUROPUNK · ATENCIÓN DE COMISIONES PERSONALIZADAS*
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

💡 *Tu idea:* "${commission.message || 'Sin mensaje adicional'}"

Quiero conocer más a fondo tu cotización y orientarte con los materiales, colores y diseño para que quede exactamente como te lo imaginas. ¿Tienes alguna foto o detalle adicional que quieras compartirme? 🖤`;

  return buildWhatsAppUrl(cleanPhone, message, options);
}

/**
 * Builds the UTF-8 WhatsApp message for customer-to-admin quote inquiries.
 */
export function buildCustomerToAdminWhatsAppMessage(commission) {
  return `🧶 *KUROPUNK · SOLICITUD DE COTIZACIÓN*
━━━━━━━━━━━━━━━━━━━━━━━━━
¡Hola equipo KuroPunk! Acabo de calcular una cotización en la tienda web:

👤 *NOMBRE:* ${commission.name || 'Cliente'}
• *MI TELÉFONO:* ${commission.phone || 'N/A'}
• *EMAIL:* ${commission.email || 'N/A'}

📋 *DETALLES COTIZADOS:*
• *Pieza:* ${commission.typeLabel || commission.type || 'Amigurumi'}
• *Escala:* ${commission.sizeLabel || commission.size || 'Estándar'}
• *Plataforma:* ${commission.hasPlatform ? 'Sí' : 'No'}
• *Complejidad:* ${commission.complexityLabel || commission.complexity || 'Estándar'}
• *Precio Estimado:* ${formatCOP(commission.estimatedPrice || 50000)}
• *Tiempo Estimado:* ${commission.estimatedDays || '4-6'} días hábiles

💡 *Mensaje:* "${commission.message || 'Sin mensaje'}"

━━━━━━━━━━━━━━━━━━━━━━━━━
Quedo a la espera de su respuesta para acordar los detalles. ¡Gracias! 🖤`;
}

export function generateCustomerToAdminWhatsAppUrl(commission, options) {
  return buildWhatsAppUrl(WHATSAPP_PHONE, buildCustomerToAdminWhatsAppMessage(commission), options);
}

export function generateWhatsAppTrackingUrl(orderId, phone, options) {
  const message = `🧶 *KUROPUNK* | *Seguimiento de Pedido*
━━━━━━━━━━━━━━━━━━━━━━━━━

¡Hola equipo KuroPunk!
Quisiera consultar el estado actual de mi pedido contraentrega:

• *Nº de Orden:* #${orderId || 'PENDIENTE'}
• *Celular:* ${phone || 'N/A'}

¿Me podrían confirmar en qué fase de confección o ruta de despacho se encuentra? ¡Muchas gracias! 🖤`;

  return buildWhatsAppUrl(WHATSAPP_PHONE, message, options);
}
