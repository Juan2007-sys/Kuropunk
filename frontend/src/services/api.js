import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';
import { getAdminAuthHeaders } from './firebase';

const isLocalHost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const rawApiUrl = (
  isLocalHost
    ? 'http://localhost:4000/api'
    : import.meta.env.VITE_API_URL || 'https://kuropunk-backend.onrender.com/api'
).replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

const ALL_LOCAL_PRODUCTS = [...PRODUCTS, ...PUNTO_CRUZ_PRODUCTS, ...PATRONES_PRODUCTS];

/**
 * Helper to fetch with timeout and fallback
 */
async function fetchWithFallback(url, options = {}, fallbackFn) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    // Graceful fallback when backend is offline or unreachable
    console.warn(`[KuroPunk API Offline] Falling back locally for ${url}:`, err.message);
    return fallbackFn();
  }
}

/**
 * Products Service
 */
export async function getProducts(params = {}) {
  return fetchWithFallback(
    `/products?${new URLSearchParams(params).toString()}`,
    { method: 'GET' },
    () => {
      let filtered = [...ALL_LOCAL_PRODUCTS];

      if (params.type) {
        filtered = filtered.filter(p => p.type === params.type || (params.type === 'amigurumi' && !p.type));
      }

      if (params.category && params.category !== 'all') {
        filtered = filtered.filter(p => p.category === params.category);
      }

      if (params.series && params.series !== 'ALL') {
        filtered = filtered.filter(p => p.series === params.series);
      }

      if (params.size && params.size !== 'ALL') {
        filtered = filtered.filter(p => p.size === params.size);
      }

      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
        );
      }

      return {
        products: filtered,
        total: filtered.length,
      };
    }
  );
}

export async function getProductById(id) {
  return fetchWithFallback(
    `/products/${id}`,
    { method: 'GET' },
    () => {
      const found = ALL_LOCAL_PRODUCTS.find(p => p.id === id || p.sku === id);
      return found || ALL_LOCAL_PRODUCTS[0];
    }
  );
}

/**
 * Orders Service con propagación de errores de NestJS y timeout móvil adecuado (12s)
 */
export async function submitOrder(orderData) {
  const targetUrl = `${API_BASE_URL}/orders`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      // Extraer mensaje emitido por los ValidationPipes o filtros de NestJS
      const rawMsg = json?.error?.message || json?.message || json?.error || `Error en el servidor (${res.status})`;
      const formattedMsg = typeof rawMsg === 'string'
        ? rawMsg
        : Array.isArray(rawMsg)
          ? rawMsg.join('. ')
          : (rawMsg?.message || JSON.stringify(rawMsg));
      const error = new Error(formattedMsg);
      error.status = res.status;
      error.details = json;
      throw error;
    }

    const result = json?.data !== undefined ? json.data : json;

    try {
      localStorage.setItem('kuropunk_last_order', JSON.stringify(result));
      const existingOrders = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
      const filtered = existingOrders.filter((o) => o.id !== result.id);
      filtered.unshift(result);
      localStorage.setItem('kuropunk_local_orders', JSON.stringify(filtered));
    } catch (e) {}

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    // Si es un error con status HTTP explícito del servidor (400, 409, 422, 500), propagarlo directamente
    if (err.status) {
      throw err;
    }
    // En producción, si el usuario tiene internet pero el servidor rechazó o agotó el tiempo, no simular éxito silencioso
    if (import.meta.env.PROD && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
      throw new Error(
        'No pudimos conectar con el servidor de pedidos en este momento. Por favor intenta de nuevo en unos segundos.',
      );
    }
    // Si la API está inalcanzable, calcular de forma determinista la regla de los $50.000 COP (>= 50k pide 20%)
    const officialSubtotal = (orderData.items || []).reduce((acc, it) => {
      const prod = ALL_LOCAL_PRODUCTS.find((p) => String(p.id) === String(it.productId));
      const unitPrice = prod ? Number(prod.price) : Number(it.price || 0);
      return acc + unitPrice * Number(it.quantity || 1);
    }, 0);
    const total = officialSubtotal;
    const requiresDeposit = total >= 50000;
    const depositBaseAmount = requiresDeposit ? Math.ceil(total * 0.20) : 0;
    const depositRequiredAmount = depositBaseAmount;
    const remainingBalance = total - depositBaseAmount;
    const cleanPhone = String(orderData.phone || '').replace(/\D/g, '').replace(/^57(?=\d{10}$)/, '');
    if (cleanPhone.length !== 10) {
      throw new Error('El número de celular debe tener exactamente 10 dígitos.');
    }
    const cleanRef = orderData.paymentReference ? String(orderData.paymentReference).trim().toUpperCase() : null;
    const cleanProof = orderData.paymentProofUrl ? String(orderData.paymentProofUrl).trim() : '';

    if (requiresDeposit) {
      if (!cleanRef || cleanRef.length < 4) {
        throw new Error('Debes ingresar el número de comprobante o referencia (mínimo 4 caracteres).');
      }
      if (!cleanProof || cleanProof.startsWith('blob:')) {
        throw new Error('Debes adjuntar obligatoriamente la foto del comprobante para agendar el pedido.');
      }
    }
    const hasReportedRef = requiresDeposit && cleanRef && cleanRef.length >= 4;

    const offlineId = `VS-${Math.floor(100000 + Math.random() * 900000)}`;
    const offlineResult = {
      id: offlineId,
      customerName: orderData.customerName,
      email: orderData.email,
      phone: cleanPhone,
      address: orderData.address,
      city: orderData.city,
      subtotal: officialSubtotal,
      shippingCost: 0,
      total,
      requiresDeposit,
      depositBaseAmount,
      depositRequiredAmount,
      remainingBalance,
      paymentStatus: !requiresDeposit ? 'NO_REQUIERE' : 'VERIFICANDO_ANTICIPO',
      paymentReference: cleanRef,
      paymentProofUrl: cleanProof || null,
      paymentReportedAt: hasReportedRef ? new Date().toISOString() : null,
      status: !requiresDeposit ? 'EN_COLA' : 'VERIFICANDO_ANTICIPO',
      queuedAt: requiresDeposit ? null : new Date().toISOString(),
      trackingCode: `KURO-TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      items: orderData.items,
      createdAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem('kuropunk_last_order', JSON.stringify(offlineResult));
      const existingOrders = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
      existingOrders.unshift(offlineResult);
      localStorage.setItem('kuropunk_local_orders', JSON.stringify(existingOrders));
    } catch (e) {}
    return offlineResult;
  }
}

/**
 * Reporta el número de comprobante / referencia del anticipo del 20%
 */
export async function reportOrderPayment(orderId, { paymentReference, paymentProofUrl = '' }) {
  const cleanRef = String(paymentReference || '').trim().toUpperCase();
  if (!cleanRef || cleanRef.length < 4) {
    throw new Error('Debes ingresar un número de comprobante o referencia válido (mínimo 4 caracteres).');
  }
  const cleanProof = String(paymentProofUrl || '').trim();
  if (!cleanProof || cleanProof.startsWith('blob:')) {
    throw new Error('Debes adjuntar obligatoriamente la foto o captura del comprobante de pago.');
  }

  // Validación rápida local de unicidad (Candado Anti-Fraude)
  try {
    const localOrders = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
    const duplicate = localOrders.find(
      (o) => o.id !== orderId && String(o.paymentReference || '').toUpperCase() === cleanRef,
    );
    if (duplicate) {
      throw new Error(`El comprobante "${cleanRef}" ya fue utilizado en otro pedido. Verifica tu referencia bancaria.`);
    }
  } catch (dupErr) {
    if (dupErr.message?.includes('ya fue utilizado')) throw dupErr;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/report-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentReference: cleanRef, paymentProofUrl }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = Array.isArray(errBody.message) ? errBody.message.join(', ') : errBody.message;
      throw new Error(msg || `Error al reportar comprobante (HTTP ${res.status})`);
    }

    const json = await res.json();
    const updated = json.data !== undefined ? json.data : json;
    syncOrderToLocalCache(updated);
    return updated;
  } catch (err) {
    if (err.message?.includes('ya fue') || err.message?.includes('comprobante')) {
      throw err;
    }
    // Fallback local
    const updatedLocal = updateLocalOrderFields(orderId, {
      paymentReference: cleanRef,
      paymentProofUrl,
      paymentReportedAt: new Date().toISOString(),
      paymentStatus: 'VERIFICANDO_ANTICIPO',
      status: 'VERIFICANDO_ANTICIPO',
    });
    return updatedLocal;
  }
}

/**
 * Admin verifica o rechaza el anticipo del 20% y asigna puesto en cola (queuedAt)
 */
export async function verifyOrderDeposit(orderId, { action, notes = '' }) {
  const act = String(action || '').toUpperCase();
  const authHeaders = await getAdminAuthHeaders();
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/verify-deposit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify({ action: act, notes }),
    });
    if (res.ok) {
      const json = await res.json();
      const updated = json.data !== undefined ? json.data : json;
      syncOrderToLocalCache(updated);
      return updated;
    }
  } catch {}

  const fields =
    act === 'CONFIRM'
      ? {
          paymentStatus: 'ANTICIPO_VERIFICADO',
          status: 'EN_COLA',
          queuedAt: new Date().toISOString(),
        }
      : {
          paymentStatus: 'RECHAZADO',
          status: 'ESPERANDO_PAGO',
        };

  return updateLocalOrderFields(orderId, fields);
}

/**
 * Admin sincroniza el cambio de estado de una orden con el backend
 */
export async function updateOrderStatusApi(orderId, status) {
  const authHeaders = await getAdminAuthHeaders();
  const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
    },
    body: JSON.stringify({ status: String(status || '').toUpperCase() }),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || errBody?.message || `Error HTTP ${res.status}`);
  }
  const json = await res.json().catch(() => ({}));
  const updated = json.data !== undefined ? json.data : json;
  syncOrderToLocalCache(updated);
  return updated;
}

/**
 * Obtiene todas las órdenes desde el backend (Admin) o caché local
 */
export async function getAllOrders() {
  const authHeaders = await getAdminAuthHeaders();
  const result = await fetchWithFallback(
    `/orders?limit=100`,
    {
      method: 'GET',
      headers: authHeaders,
    },
    () => {
      try {
        return JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
      } catch {
        return [];
      }
    }
  );
  return Array.isArray(result) ? result : (result?.orders || []);
}

export async function deleteOrderApi(orderId) {
  const authHeaders = await getAdminAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Error HTTP ${response.status} al eliminar orden`);
  }
  return response.json().catch(() => ({ success: true, id: orderId }));
}

export async function clearAllOrdersApi() {
  const authHeaders = await getAdminAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: 'DELETE',
    headers: authHeaders,
  });
  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    throw new Error(errBody.message || `Error HTTP ${response.status} al vaciar órdenes`);
  }
  return response.json().catch(() => ({ success: true }));
}

export async function syncProductToBackendApi(productData) {
  if (!productData || !productData.id) return null;
  const authHeaders = await getAdminAuthHeaders();
  const updatePayload = {
    title: productData.title,
    type: productData.technique || productData.type || 'amigurumi',
    price: Number(productData.price) || 0,
    stock: Number(productData.stock) || 0,
    description: productData.description || '',
    image: productData.imageUrl || productData.image || '',
  };

  try {
    const patchRes = await fetch(`${API_BASE_URL}/products/${encodeURIComponent(productData.id)}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders,
      },
      body: JSON.stringify(updatePayload),
    });

    if (patchRes.ok) {
      return await patchRes.json().catch(() => null);
    }

    if (patchRes.status === 404) {
      const createRes = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          ...updatePayload,
          id: productData.id,
          sku: String(productData.sku || productData.slug || productData.id).toUpperCase(),
          category: productData.category || 'Amigurumis',
        }),
      });
      if (createRes.ok) {
        return await createRes.json().catch(() => null);
      }
    }
  } catch (e) {
    console.warn('[API syncProductToBackend warning]', e);
  }
  return null;
}

function syncOrderToLocalCache(updatedOrder) {
  if (!updatedOrder || !updatedOrder.id) return;
  try {
    const last = JSON.parse(localStorage.getItem('kuropunk_last_order') || 'null');
    if (last && last.id === updatedOrder.id) {
      localStorage.setItem('kuropunk_last_order', JSON.stringify({ ...last, ...updatedOrder }));
    }
    const list = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
    const idx = list.findIndex((o) => o.id === updatedOrder.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updatedOrder };
    } else {
      list.unshift(updatedOrder);
    }
    localStorage.setItem('kuropunk_local_orders', JSON.stringify(list));
  } catch {}
}

function updateLocalOrderFields(orderId, fields) {
  let result = { id: orderId, ...fields };
  try {
    const last = JSON.parse(localStorage.getItem('kuropunk_last_order') || 'null');
    if (last && last.id === orderId) {
      const merged = { ...last, ...fields };
      localStorage.setItem('kuropunk_last_order', JSON.stringify(merged));
      result = merged;
    }
    const list = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
    const idx = list.findIndex((o) => o.id === orderId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...fields };
      result = list[idx];
      localStorage.setItem('kuropunk_local_orders', JSON.stringify(list));
    }
  } catch {}
  return result;
}

/**
 * Order Tracking Service
 */
export async function trackOrder(query) {
  const clean = (query || '').trim();
  if (!clean || clean.length < 4) {
    throw new Error('Ingresa un código de orden (#VS-...) o código de rastreo (KURO-TRK-...) válido.');
  }

  return fetchWithFallback(
    `/orders/track/${encodeURIComponent(clean)}`,
    { method: 'GET' },
    () => {
      try {
        const localOrders = JSON.parse(localStorage.getItem('kuropunk_local_orders') || '[]');
        const found = localOrders.find(
          (o) =>
            o.id?.toLowerCase() === clean.toLowerCase() ||
            o.trackingCode?.toLowerCase() === clean.toLowerCase() ||
            o.trackingNumber?.toLowerCase() === clean.toLowerCase(),
        );
        if (found) return found;

        const saved = localStorage.getItem('kuropunk_last_order');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (
            parsed.id?.toLowerCase() === clean.toLowerCase() ||
            parsed.trackingCode?.toLowerCase() === clean.toLowerCase()
          ) {
            return parsed;
          }
        }
      } catch (e) {}

      throw new Error(`No encontramos ninguna orden con el código "${clean}". Verifica tu código de pedido.`);
    }
  );
}

/**
 * Reviews Service
 */
export async function getProductReviews(productId) {
  return fetchWithFallback(
    `/reviews/product/${productId}`,
    { method: 'GET' },
    () => {
      return [
        {
          id: 1,
          productId,
          author: "Operative_X",
          rating: 5,
          comment: "Acabado impecable, detalles hiperrealistas y confección densa.",
          verifiedBuyer: true,
          createdAt: new Date().toISOString(),
        }
      ];
    }
  );
}

export async function submitReview(reviewData) {
  return fetchWithFallback(
    `/reviews`,
    {
      method: 'POST',
      body: JSON.stringify(reviewData),
    },
    () => {
      return {
        id: Date.now(),
        ...reviewData,
        createdAt: new Date().toISOString(),
      };
    }
  );
}

/**
 * Contact Service
 */
export async function submitContactMessage(contactData) {
  return fetchWithFallback(
    `/contact`,
    {
      method: 'POST',
      body: JSON.stringify(contactData),
    },
    () => {
      return {
        id: Date.now(),
        ...contactData,
        status: 'NEW',
        createdAt: new Date().toISOString(),
      };
    }
  );
}

export async function getContactMessages() {
  const authHeaders = await getAdminAuthHeaders();
  return fetchWithFallback(
    `/contact`,
    {
      method: 'GET',
      headers: authHeaders,
    },
    () => {
      try {
        const stored = localStorage.getItem('kuropunk_contact_messages');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
  );
}
