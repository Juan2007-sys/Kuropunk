/**
 * Suite de Verificación de Seguridad Zero-Trust (5 Vectores) - KuroPunk // Vandal Stitch
 * Ejecución: node backend/security-audit-test.mjs
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';

async function runZeroTrustSecuritySuite() {
  console.log('=======================================================================');
  console.log('🛡️  AUDITORÍA DINÁMICA ZERO-TRUST: PRUEBA DE LOS 5 VECTORES DE ATAQUE');
  console.log('=======================================================================\n');

  // -------------------------------------------------------------------------
  // VECTOR 1: Manipulación de Precio + Mass Assignment (Inyección de "isPaid": true)
  // -------------------------------------------------------------------------
  console.log('[1/5] Probando Vector 1: Manipulación de Precio ($1 COP) + Mass Assignment ("role": "admin")...');
  const v1Res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Auditor ZeroTrust',
      email: 'audit.v1@kuropunk.co',
      phone: '3001112233',
      address: 'Calle 10 # 43E - 22',
      city: 'Medellín',
      role: 'admin', // Campo no declarado (Mass Assignment)
      status: 'DELIVERED', // Intento de forzar estado
      items: [
        {
          productId: 'dulce-princesa-plataforma',
          title: 'Dulce Princesa',
          price: 1, // Intento de pagar $1 COP
          quantity: 1,
        },
      ],
    }),
  });
  console.log(`  ➔ HTTP Status recibido: ${v1Res.status} (Esperado: 400 Bad Request por forbidNonWhitelisted)\n`);

  // -------------------------------------------------------------------------
  // VECTOR 2: Cantidad Negativa (-5 unidades) / Decimal (1.5 unidades)
  // -------------------------------------------------------------------------
  console.log('[2/5] Probando Vector 2: Cantidad Negativa (-5 unidades) para inflar stock...');
  const v2Res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Auditor Matemático',
      email: 'audit.v2@kuropunk.co',
      phone: '3001112244',
      address: 'Calle 10 # 43E - 22',
      city: 'Medellín',
      items: [
        {
          productId: 'jungkook-cooky-pequeno',
          title: 'Jungkook Mini',
          price: 12000,
          quantity: -5,
        },
      ],
    }),
  });
  const v2Body = await v2Res.json();
  console.log(`  ➔ HTTP Status recibido: ${v2Res.status} (Esperado: 400 Bad Request)`);
  console.log(`  ➔ Respuesta del validador: ${JSON.stringify(v2Body?.error?.message)}\n`);

  // -------------------------------------------------------------------------
  // VECTOR 3: Mutación de Estado / Stock sin Credencial de Admin (y con falso "admin")
  // -------------------------------------------------------------------------
  console.log('[3/5] Probando Vector 3: Cambio de estado de orden sin token Admin y con token falso "hacker_admin"...');
  const v3NoToken = await fetch(`${API_BASE}/orders/VS-TEST001/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'DELIVERED' }),
  });
  const v3FakeToken = await fetch(`${API_BASE}/admin/products/jungkook-cooky-pequeno/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': 'hacker_admin_bypass',
    },
    body: JSON.stringify({ stock: 999 }),
  });
  console.log(`  ➔ Sin token HTTP Status:       ${v3NoToken.status} (Esperado: 401 Unauthorized)`);
  console.log(`  ➔ Con token falso HTTP Status: ${v3FakeToken.status} (Esperado: 401 Unauthorized)\n`);

  // -------------------------------------------------------------------------
  // VECTOR 4: Inyección Cross-Site Scripting (XSS) en Nombre y Dirección
  // -------------------------------------------------------------------------
  console.log('[4/5] Probando Vector 4: Inyección de etiquetas XSS en customerName y address...');
  const v4Res = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: '<script>alert("XSS")</script>',
      email: 'audit.v4@kuropunk.co',
      phone: '3001112255',
      address: '<img src=x onerror=alert(1)>',
      city: 'Medellín',
      items: [
        {
          productId: 'jungkook-cooky-pequeno',
          title: 'Jungkook Mini',
          price: 12000,
          quantity: 1,
        },
      ],
    }),
  });
  const v4Body = await v4Res.json();
  console.log(`  ➔ HTTP Status recibido: ${v4Res.status} (Esperado: 400 Bad Request)`);
  console.log(`  ➔ Respuesta del validador: ${JSON.stringify(v4Body?.error?.message)}\n`);

  // -------------------------------------------------------------------------
  // VECTOR 5: Ráfaga DoS de 50 peticiones seguidas (Prueba de Rate Limiting 429)
  // -------------------------------------------------------------------------
  console.log('[5/5] Probando Vector 5: Ráfaga de 50 peticiones consecutivas (Rate Limiter)...');
  const burstStatuses = [];
  for (let i = 0; i < 50; i++) {
    const res = await fetch(`${API_BASE}/products`);
    burstStatuses.push(res.status);
  }
  const okCount = burstStatuses.filter((s) => s === 200).length;
  const rateLimitedCount = burstStatuses.filter((s) => s === 429).length;
  console.log(`  ➔ Peticiones aceptadas (200 OK):          ${okCount}`);
  console.log(`  ➔ Peticiones bloqueadas (429 Rate Limit): ${rateLimitedCount} (Esperado: > 0)\n`);
}

runZeroTrustSecuritySuite().catch(console.error);
