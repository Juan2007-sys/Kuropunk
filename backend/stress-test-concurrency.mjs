/**
 * Script de Prueba de Estrés y Concurrencia Real - KuroPunk // Vandal Stitch
 * Ejecución: node backend/stress-test-concurrency.mjs
 */

const API_BASE = process.env.API_URL || 'http://localhost:4000/api';
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'kuropunk_admin_secret_2026';
const TARGET_PRODUCT_ID = 'jungkook-cooky-plataforma';
const INITIAL_STOCK = 2;
const CONCURRENT_USERS = 20;

async function runConcurrencyAudit() {
  console.log('================================================================');
  console.log('⚡ INICIANDO AUDITORÍA DINÁMICA DE CONCURRENCIA (20 COMPRADORES)');
  console.log('================================================================\n');

  // 1. Fijar el stock inicial del producto en exactamente 2 unidades
  console.log(`[1/4] Reseteando stock de "${TARGET_PRODUCT_ID}" a ${INITIAL_STOCK} unidades...`);
  const resetRes = await fetch(`${API_BASE}/admin/products/${TARGET_PRODUCT_ID}/stock`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-key': ADMIN_KEY,
    },
    body: JSON.stringify({ stock: INITIAL_STOCK }),
  });

  if (!resetRes.ok) {
    console.error('Error al resetear stock:', await resetRes.text());
    process.exit(1);
  }

  // 2. Preparar 20 payloads idénticos a los que envía CheckoutPage.jsx (Líneas 103-126)
  console.log(`[2/4] Disparando ${CONCURRENT_USERS} peticiones POST /api/orders en el mismo milisegundo...`);
  const startTime = Date.now();

  const requests = Array.from({ length: CONCURRENT_USERS }, (_, idx) => {
    const userNum = idx + 1;
    const orderPayload = {
      customerName: `Auditor Concurrencia #${userNum}`,
      email: `stress.user.${userNum}@cliente.kuropunk.com`,
      phone: `300555${String(userNum).padStart(4, '0')}`,
      address: `Calle ${userNum} # 43E-20 Apto ${userNum}`,
      neighborhood: 'El Poblado',
      city: 'Medellín',
      department: 'Antioquia',
      deliveryNotes: 'Prueba de estrés concurrente',
      paymentMethod: 'EFECTIVO_CONTRAENTREGA',
      country: 'Colombia',
      items: [
        {
          productId: TARGET_PRODUCT_ID,
          title: 'Jungkook con Pijama de Cooky (14cm Plataforma)',
          price: 50000,
          quantity: 1,
          color: 'Asphalt',
          size: 'MED',
          image: '/img/jungkook-cooky-plataforma-1.jpeg',
          tier: 'finished',
        },
      ],
      shippingCost: 15000,
      total: 65000,
    };

    return fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload),
    }).then(async (res) => ({
      userNum,
      status: res.status,
      body: await res.json().catch(() => null),
    }));
  });

  const results = await Promise.all(requests);
  const elapsedMs = Date.now() - startTime;

  // 3. Verificar estado final del inventario en la base de datos
  const prodRes = await fetch(`${API_BASE}/products/${TARGET_PRODUCT_ID}`);
  const prodData = await prodRes.json();
  const finalStock = prodData?.data?.stock;

  const created201 = results.filter((r) => r.status === 201);
  const rejected400 = results.filter((r) => r.status === 400);
  const serverErrors = results.filter((r) => r.status >= 500);

  console.log(`\n[3/4] Resultados de la ráfaga (${elapsedMs} ms):`);
  console.log(`  ✅ Órdenes creadas (HTTP 201):     ${created201.length} (Esperado: ${INITIAL_STOCK})`);
  console.log(`  🛡️  Órdenes rechazadas (HTTP 400):  ${rejected400.length} (Esperado: ${CONCURRENT_USERS - INITIAL_STOCK})`);
  console.log(`  💥 Errores de servidor (HTTP 500): ${serverErrors.length} (Esperado: 0)`);
  console.log(`  📦 Stock final en Base de Datos:   ${finalStock} (Esperado: 0)`);

  // 4. Prueba de Rollback en Carrito Multi-Ítem (Item 1 con stock, Item 2 agotado)
  console.log('\n[4/4] Probando Atomicidad de Transacción (Carrito con 1 ítem disponible + 1 ítem agotado)...');
  await fetch(`${API_BASE}/admin/products/dulce-princesa-plataforma/stock`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': ADMIN_KEY },
    body: JSON.stringify({ stock: 2 }),
  });

  // dulce-princesa-plataforma tiene stock = 2, jungkook-cooky-plataforma tiene stock = 0
  const multiItemRes = await fetch(`${API_BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: 'Auditor Transacción Fallida',
      email: 'rollback@cliente.kuropunk.com',
      phone: '3009990000',
      address: 'Cra 70 # 10-20',
      city: 'Medellín',
      items: [
        {
          productId: 'dulce-princesa-plataforma',
          title: 'Dulce Princesa de Hora de Aventura',
          price: 50000,
          quantity: 1,
          tier: 'finished',
        },
        {
          productId: TARGET_PRODUCT_ID, // Agotado (stock 0)
          title: 'Jungkook con Pijama de Cooky (14cm Plataforma)',
          price: 50000,
          quantity: 1,
          tier: 'finished',
        },
      ],
    }),
  });

  const dpCheck = await (await fetch(`${API_BASE}/products/dulce-princesa-plataforma`)).json();
  const dpStockAfter = dpCheck?.data?.stock;

  console.log(`  🔹 HTTP Status de orden mixta: ${multiItemRes.status} (Esperado: 400)`);
  console.log(`  🔹 Stock de "dulce-princesa-plataforma" antes: 2 | después del fallo: ${dpStockAfter}`);
  if (dpStockAfter !== 2) {
    console.error('  ❌ FALLO CRÍTICO DETECTADO: El stock del primer ítem se descontó aunque la orden completa falló (Falta ROLLBACK transaccional).');
  } else {
    console.log('  ✅ TRANSACCIÓN ATÓMICA VERIFICADA: El stock se mantuvo intacto tras el rollback.');
  }
}

runConcurrencyAudit().catch(console.error);
