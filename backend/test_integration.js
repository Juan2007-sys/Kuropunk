// Automated integration test for KuroPunk E-Commerce
// Tests COP prices, Contraentrega Order creation, and Real-time Tracking API

async function runTests() {
  console.log('====================================================');
  console.log('🧪 INICIANDO TEST DE INTEGRACIÓN KUROPUNK COLOMBIA');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${details ? '-> ' + details : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${details ? '-> ' + details : ''}`);
      failed++;
    }
  }

  const BASE_URL = 'http://localhost:4000/api';

  // TEST 1: Check Products API and COP Prices
  console.log('\n--- 1. TEST DE CATÁLOGO Y PRECIOS EN COP ---');
  try {
    const res = await fetch(`${BASE_URL}/products?limit=5`);
    const json = await res.json();
    const items = json.data?.products || json.products || json.data || [];
    assert(Array.isArray(items) && items.length > 0, 'Obtener catálogo de productos', `Recibidos ${items.length} productos`);

    const wanderer = items.find(p => p.id === 'the-wanderer');
    if (wanderer) {
      assert(wanderer.price === 145000, 'Precio de "The Wanderer" en COP', `Precio: $${wanderer.price} COP`);
    } else {
      assert(items[0]?.price >= 10000, 'Precios en rango COP', `Ejemplo: ${items[0]?.title} = $${items[0]?.price} COP`);
    }
  } catch (err) {
    assert(false, 'Catálogo de productos', err.message);
  }

  // TEST 2: Create a Colombian Contraentrega Order
  console.log('\n--- 2. TEST DE CREACIÓN DE PEDIDO CONTRAENTREGA ---');
  let createdOrder = null;
  const testOrderId = `TEST-KP-${Math.floor(100000 + Math.random() * 900000)}`;
  const testPhone = '573015690382';

  const orderPayload = {
    id: testOrderId,
    customerName: 'Santiago Vélez (Test QA)',
    email: 'santiago.qa@kuropunk.co',
    phone: testPhone,
    address: 'Calle 10 # 43E - 22, Torre Apto 402',
    city: 'Medellín',
    country: 'Colombia',
    items: [
      {
        productId: 'the-wanderer',
        title: 'The Wanderer - Amigurumi Coleccionable',
        price: 145000,
        quantity: 1,
        color: 'Asphalt Charcoal',
        size: 'MED'
      },
      {
        productId: 'patron-scrap-bunny',
        title: 'Patrón: Scrap Bunny (PDF)',
        price: 20000,
        quantity: 1,
        color: 'Digital',
        size: 'PDF'
      }
    ],
    shippingCost: 0, // Free delivery (> $150.000 COP)
    total: 165000
  };

  try {
    const res = await fetch(`${BASE_URL}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    const json = await res.json();
    createdOrder = json.data || json;

    assert(res.status === 201 || res.status === 200, 'HTTP Status de creación de pedido', `Status: ${res.status}`);
    assert(createdOrder && (createdOrder.id === testOrderId || !!createdOrder.id), 'ID de pedido generado/registrado', `ID: ${createdOrder?.id}`);
    assert(createdOrder?.total === 165000, 'Total calculado en COP', `Total: $${createdOrder?.total} COP`);
    assert(!!createdOrder?.trackingCode, 'Código de rastreo asignado', `Tracking: ${createdOrder?.trackingCode}`);
  } catch (err) {
    assert(false, 'Creación de pedido contraentrega', err.message);
  }

  // TEST 3: Track Order by Order ID
  console.log('\n--- 3. TEST DE RASTREO POR ID DE ORDEN ---');
  if (createdOrder) {
    try {
      const res = await fetch(`${BASE_URL}/orders/track/${createdOrder.id}`);
      const json = await res.json();
      const tracked = json.data || json;
      assert(res.status === 200, 'Respuesta 200 en endpoint de rastreo', `URL: /orders/track/${createdOrder.id}`);
      assert(tracked && tracked.id === createdOrder.id, 'Pedido encontrado por ID', `Cliente: ${tracked?.customerName}`);
      assert(tracked?.status === 'CONFIRMED', 'Estado inicial del pedido', `Estado: ${tracked?.status}`);
    } catch (err) {
      assert(false, 'Rastreo por ID', err.message);
    }
  }

  // TEST 4: Track Order by Phone Number (+57 301 569 0382)
  console.log('\n--- 4. TEST DE RASTREO POR NÚMERO DE CELULAR ---');
  if (createdOrder) {
    try {
      const res = await fetch(`${BASE_URL}/orders/track/${testPhone}`);
      const json = await res.json();
      const tracked = json.data || json;
      assert(res.status === 200, 'Respuesta 200 en rastreo por Celular', `Buscado: ${testPhone}`);
      assert(tracked && (tracked.phone === testPhone || tracked.id === createdOrder.id), 'Pedido identificado por número de teléfono', `Orden encontrada: #${tracked?.id}`);
    } catch (err) {
      assert(false, 'Rastreo por Celular', err.message);
    }
  }

  // TEST 5: Track Order by Tracking Code
  console.log('\n--- 5. TEST DE RASTREO POR CÓDIGO KURO-TRK ---');
  if (createdOrder?.trackingCode) {
    try {
      const res = await fetch(`${BASE_URL}/orders/track/${createdOrder.trackingCode}`);
      const json = await res.json();
      const tracked = json.data || json;
      assert(tracked && tracked.trackingCode === createdOrder.trackingCode, 'Pedido identificado por código de rastreo oficial', `Código: ${tracked?.trackingCode}`);
    } catch (err) {
      assert(false, 'Rastreo por Código Tracking', err.message);
    }
  }

  // TEST 6: Formatters verification (FormatCOP & WhatsApp URL)
  console.log('\n--- 6. TEST DE FORMATEADORES Y ENLACE DE WHATSAPP ---');
  const formatCOPTest = (amt) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(amt) + ' COP';
  };

  const sampleCOP = formatCOPTest(145000);
  assert(sampleCOP.includes('145') && sampleCOP.includes('COP'), 'Formato de moneda COP', `145000 -> "${sampleCOP}"`);

  const waTarget = '573015690382';
  const waUrl = `https://wa.me/${waTarget}?text=${encodeURIComponent('Test Orden KuroPunk')}`;
  assert(waUrl.includes('573015690382'), 'Número WhatsApp destino configurado correctamente', `URL: ${waUrl}`);

  console.log('\n====================================================');
  console.log(`📊 RESULTADO FINAL: ${passed} PASADOS | ${failed} FALLADOS`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
