// PDF Generation and Download Utility for KuroPunk Patterns & Punto Cruz
import { formatCOP } from './formatters';

export function downloadPatternPDF(item) {
  const isPuntoCruz = item.type === 'punto_cruz';
  const fileName = `KUROPUNK_${isPuntoCruz ? 'PUNTO_CRUZ' : 'PATRON'}_${item.id.toUpperCase()}.html`;

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>KUROPUNK // ${item.title} - ${isPuntoCruz ? 'Gráfico Punto Cruz' : 'Patrón de Crochet'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&family=Hanken+Grotesk:wght@400;700&display=swap');
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: #141313;
      color: #e6e1e1;
      font-family: 'Hanken Grotesk', sans-serif;
      padding: 30px;
      max-width: 850px;
      margin: 0 auto;
    }
    @media print {
      body {
        background-color: #ffffff;
        color: #111111;
        padding: 15px;
      }
      .no-print {
        display: none !important;
      }
      .card, .header, .section {
        border-color: #333333 !important;
        background: #fafafa !important;
        color: #111111 !important;
      }
      .tag {
        background: #000000 !important;
        color: #ffffff !important;
      }
    }
    .header {
      border-bottom: 3px solid #e0141f;
      padding-bottom: 15px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand-title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 38px;
      letter-spacing: 2px;
      color: #ffb4ab;
      line-height: 1;
    }
    .brand-sub {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: #e0141f;
      letter-spacing: 3px;
    }
    .meta-badge {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      background: #e0141f;
      color: #fff;
      padding: 4px 8px;
      text-transform: uppercase;
      font-weight: bold;
    }
    .title-banner {
      background: #211f1f;
      border: 1px solid #5e3f3c;
      padding: 20px;
      margin-bottom: 25px;
      position: relative;
    }
    .title {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 32px;
      letter-spacing: 1.5px;
      color: #fff;
    }
    .sku {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: #ffb4ab;
      margin-bottom: 6px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 25px;
    }
    .card {
      background: #1d1b1b;
      border: 1px solid #5e3f3c;
      padding: 16px;
    }
    .card h3 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      letter-spacing: 1px;
      color: #e0141f;
      border-bottom: 1px dashed #5e3f3c;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .img-preview {
      width: 100%;
      height: 260px;
      object-fit: cover;
      border: 1px solid #5e3f3c;
      margin-bottom: 10px;
    }
    ul.spec-list {
      list-style: none;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      line-height: 1.8;
      color: #c7c6c2;
    }
    ul.spec-list li {
      border-bottom: 1px dotted #363434;
      padding: 4px 0;
    }
    ul.spec-list li strong {
      color: #ffb4ab;
    }
    .instructions-box {
      background: #1a1919;
      border-left: 4px solid #e0141f;
      padding: 18px;
      font-size: 13px;
      line-height: 1.6;
      margin-bottom: 25px;
    }
    .instructions-box h4 {
      font-family: 'Bebas Neue', sans-serif;
      font-size: 20px;
      color: #ffb4ab;
      margin-bottom: 10px;
    }
    .stitch-step {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #2b2a29;
    }
    .stitch-step strong {
      color: #e0141f;
      font-family: 'JetBrains Mono', monospace;
    }
    .footer {
      border-top: 1px solid #5e3f3c;
      padding-top: 15px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 10px;
      color: #8a8a86;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-btn {
      background: #e0141f;
      color: #fff;
      border: none;
      padding: 10px 20px;
      font-family: 'Bebas Neue', sans-serif;
      font-size: 18px;
      letter-spacing: 1px;
      cursor: pointer;
      margin-bottom: 20px;
    }
    .print-btn:hover {
      background: #ffb4ab;
      color: #141313;
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
    <button class="print-btn" onclick="window.print()">🖨️ IMPRIMIR / GUARDAR COMO PDF</button>
    <span style="font-size: 12px; color: #ffb4ab; font-family: 'JetBrains Mono', monospace;">Presiona CTRL+P o 'Guardar como PDF'</span>
  </div>

  <div class="header">
    <div>
      <div class="brand-title">KUROPUNK // ARCHIVE</div>
      <div class="brand-sub">UNDERGROUND CROCHET & EMBROIDERY LAB</div>
    </div>
    <div class="meta-badge">${isPuntoCruz ? 'DISEÑO PUNTO CRUZ' : 'GUÍA DIGITAL DE PATRÓN'} // OFICIAL</div>
  </div>

  <div class="title-banner">
    <div class="sku">${item.sku || 'KP-DOC // 2024'}</div>
    <div class="title">${item.title.toUpperCase()}</div>
    <p style="font-size: 13px; color: #e7bcb8; margin-top: 5px;">${item.description || item.subtitle || ''}</p>
  </div>

  <div class="grid-2">
    <div class="card">
      <h3>VISTA PREVIA DEL MODELO</h3>
      <img src="${item.image}" alt="${item.title}" class="img-preview" />
      <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a8a86; text-align: center;">
        FIG 1.1 // PROTOTIPO FINALIZADO
      </div>
    </div>

    <div class="card">
      <h3>ESPECIFICACIONES TÉCNICAS</h3>
      <ul class="spec-list">
        <li><strong>NIVEL:</strong> ${item.difficulty || 'INTERMEDIO'}</li>
        ${isPuntoCruz ? `
          <li><strong>TELA BASE:</strong> ${item.fabric || 'Aida 14ct Negra / Denim'}</li>
          <li><strong>TAMAÑO GRÁFICO:</strong> ${item.gridSize || '120 x 140 puntos'}</li>
          <li><strong>PALETA DMC:</strong> ${item.dmcPalette || '8 Tonos DMC recomendados'}</li>
          <li><strong>TIPO DE PUNTADA:</strong> Cruz completa (2 hebras) + Pespunte</li>
        ` : `
          <li><strong>AGUJA / GAUGE:</strong> ${item.hookSize || '3.5mm Tactical Hook'}</li>
          <li><strong>LANA / HILO:</strong> ${item.yarn || '100% Acrílico Industrial de Alta Tensión'}</li>
          <li><strong>ALTURA FINAL:</strong> ${item.height || '8.0 - 9.0 Pulgadas'}</li>
          <li><strong>PUNTOS CLAVE:</strong> ${item.stitches || 'AM, PB, AUM, DISM, PE, BLO'}</li>
        `}
        <li><strong>TIEMPO ESTIMADO:</strong> ${item.estimatedTime || '8-12 Horas'}</li>
      </ul>
    </div>
  </div>

  <div class="instructions-box">
    <h4>${isPuntoCruz ? 'GUÍA DE BORDADO & MAPA DE COLOR' : 'INSTRUCCIONES PASO A PASO (RESUMEN)'}</h4>
    ${isPuntoCruz ? `
      <div class="stitch-step"><strong>PASO 01:</strong> Enmarcar tela Aida centrando las coordenadas (0,0) desde el centro del diseño.</div>
      <div class="stitch-step"><strong>PASO 02:</strong> Bordar primero los contornos negros (#310) para definir el volumen del personaje.</div>
      <div class="stitch-step"><strong>PASO 03:</strong> Rellenar sombras con gris antracita (#413) y áreas de luz en hueso (#Blanc).</div>
      <div class="stitch-step"><strong>PASO 04:</strong> Aplicar los detalles en Rojo Sangre (#666) en guitarra, cables o auriculares.</div>
    ` : `
      <div class="stitch-step"><strong>CABEZA / V1-V6:</strong> Anillo mágico de 6pb. V2: 6 aum (12pb). V3: (1pb, 1aum)*6 (18pb). V4: (2pb, 1aum)*6 (24pb). V5-V10: 24pb continuos.</div>
      <div class="stitch-step"><strong>CUERPO / V1-V12:</strong> Tejer en espiral desde la base. Incorporar relleno firme en V8. Insertar esqueleto de alambre maleable para articulación.</div>
      <div class="stitch-step"><strong>BRAZOS & PIERNAS:</strong> Tejer 4 extremidades con técnica de tensión cerrada para evitar escape de fibra. Unir con aguja lanera y rematar en punto escondido.</div>
      <div class="stitch-step"><strong>ACCESORIOS:</strong> Tejer mini guitarra / guitarra eléctrica con hilo rojo y aguja de 2.0mm. Bordar cuerdas con hilo plateado.</div>
    `}
  </div>

  <div class="footer">
    <span>© 2024 KUROPUNK UNDERGROUND // TODOS LOS DERECHOS RESERVADOS</span>
    <span>DOCUMENTO DE ACCESO LIBRE // ARCHIVO DIGITAL</span>
  </div>

  <script>
    // Auto trigger print prompt if opened in new window
    window.onload = function() {
      // ready
    }
  </script>
</body>
</html>`;

  // Create blob and trigger download
  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export function downloadReceiptPDF(order) {
  const fileName = `KUROPUNK_RECIBO_${order.id || 'ORDER'}.html`;
  const itemsHtml = (order.items || [])
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #333;">
        <strong>${item.title || item.productId}</strong><br/>
        <span style="font-size: 11px; color: #888;">Color: ${item.color || 'Asphalt'} // Talla: ${item.size || 'MED'}</span>
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">${formatCOP(item.price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #333; text-align: right;">${formatCOP(Number(item.price) * Number(item.quantity))}</td>
    </tr>
  `
    )
    .join('');

  const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>KUROPUNK // VOUCHER OFICIAL - ${order.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=JetBrains+Mono:wght@400;700&display=swap');
    body {
      background: #141313;
      color: #e6e1e1;
      font-family: 'JetBrains Mono', monospace;
      padding: 30px;
      max-width: 750px;
      margin: 0 auto;
    }
    @media print {
      body { background: #fff; color: #000; }
      .no-print { display: none !important; }
      .box { border-color: #333 !important; }
    }
    .header {
      border-bottom: 3px solid #e0141f;
      padding-bottom: 15px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand { font-family: 'Bebas Neue', sans-serif; font-size: 36px; color: #ffb4ab; line-height: 1; }
    .box { background: #1d1b1b; border: 1px solid #5e3f3c; padding: 20px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { text-align: left; padding: 8px; border-bottom: 2px solid #e0141f; color: #ffb4ab; }
    .btn { background: #e0141f; color: #fff; padding: 10px 20px; font-family: 'Bebas Neue', sans-serif; font-size: 18px; cursor: pointer; border: none; }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
    <button class="btn" onclick="window.print()">🖨️ IMPRIMIR RECIBO / GUARDAR PDF</button>
    <span style="font-size: 12px; color: #ffb4ab;">KUROPUNK ORDER DISPATCH // PAGO CONTRAENTREGA</span>
  </div>

  <div class="header">
    <div>
      <div class="brand">KUROPUNK // OFFICIAL RECEIPT</div>
      <div style="font-size: 10px; color: #e0141f; letter-spacing: 2px;">TALLER ARTESANAL DE CROCHET // COLOMBIA</div>
    </div>
    <div style="text-align: right; font-size: 11px;">
      <div>ORDEN: <strong style="color: #ffb4ab;">#${order.id}</strong></div>
      <div>FECHA: ${new Date().toLocaleDateString('es-CO')}</div>
      <div>TRACKING: <strong style="color: #4ade80;">${order.trackingCode || order.id}</strong></div>
    </div>
  </div>

  <div class="box">
    <div style="font-size: 11px; color: #888; margin-bottom: 8px;">DESTINATARIO // ENTREGA PERSONALIZADA:</div>
    <div style="font-size: 14px; font-weight: bold; color: #fff;">${order.customerName || 'Cliente KuroPunk'}</div>
    <div style="font-size: 12px; color: #ccc;">📱 Celular: ${order.phone || 'N/A'}</div>
    <div style="font-size: 12px; color: #aaa; margin-top: 4px;">📍 Dirección: ${order.address || ''}, Barrio: ${order.neighborhood || ''}, ${order.city || ''} (${order.department || 'Colombia'})</div>
    <div style="font-size: 11px; color: #e0141f; margin-top: 6px;">🚚 Entrega en mano directa por el artesano (+57 301 569 0382)</div>
  </div>

  <div class="box">
    <div style="font-size: 13px; font-weight: bold; color: #ffb4ab; border-bottom: 1px dashed #5e3f3c; padding-bottom: 5px;">
      DESGLOSE DE CARGAMENTO
    </div>
    <table>
      <thead>
        <tr>
          <th>ÍTEM / MODELO</th>
          <th style="text-align: center;">CANT</th>
          <th style="text-align: right;">PRECIO</th>
          <th style="text-align: right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #5e3f3c; text-align: right; font-size: 13px; line-height: 1.8;">
      <div>SUBTOTAL: ${formatCOP(order.subtotal || order.total)}</div>
      <div style="font-size: 18px; font-weight: bold; color: #ffb4ab;">TOTAL A PAGAR AL RECIBIR: ${formatCOP(order.total)}</div>
      <div style="font-size: 11px; color: #888; margin-top: 4px;">MODALIDAD: Pago Contraentrega (Efectivo o Transferencia Nequi / Daviplata al verificar la pieza)</div>
    </div>
  </div>

  <div style="text-align: center; font-size: 10px; color: #666; margin-top: 30px;">
    PIEZA ARTESANAL ÚNICA HECHA A MANO // CONTACTO WHATSAPP: +57 301 569 0382 // KUROPUNK COLOMBIA
  </div>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
