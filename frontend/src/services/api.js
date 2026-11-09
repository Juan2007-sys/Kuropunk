import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';

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
  const timeoutId = setTimeout(() => controller.abort(), 12000);

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
    // Si es un error con status HTTP explícito del servidor (400, 409, 422), propagarlo directamente
    if (err.status && err.status < 500) {
      throw err;
    }
    // Si la API está inalcanzable, calcular de forma determinista la regla de los $50.000 COP
    const officialSubtotal = (orderData.items || []).reduce((acc, it) => {
      const prod = ALL_LOCAL_PRODUCTS.find((p) => String(p.id) === String(it.productId));
      const unitPrice = prod ? Number(prod.price) : Number(it.price || 0);
      return acc + unitPrice * Number(it.quantity || 1);
    }, 0);
    const total = officialSubtotal;
    const requiresDeposit = total > 50000;
    const depositBaseAmount = requiresDeposit ? Math.ceil(total * 0.20) : 0;
    const randomPesos = requiresDeposit ? Math.floor(Math.random() * 99) + 1 : 0;
    const depositRequiredAmount = requiresDeposit ? depositBaseAmount + randomPesos : 0;
    const remainingBalance = total - depositBaseAmount;

    const offlineId = `VS-${Math.floor(100000 + Math.random() * 900000)}`;
    const offlineResult = {
      id: offlineId,
      customerName: orderData.customerName,
      email: orderData.email,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      subtotal: officialSubtotal,
      shippingCost: 0,
      total,
      requiresDeposit,
      depositBaseAmount,
      depositRequiredAmount,
      remainingBalance,
      paymentStatus: requiresDeposit ? 'PENDIENTE_ANTICIPO' : 'NO_REQUIERE',
      status: requiresDeposit ? 'ESPERANDO_PAGO' : 'EN_COLA',
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
  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'kuropunk_admin_secret_2026';
  try {
    const res = await fetch(`${API_BASE_URL}/orders/${encodeURIComponent(orderId)}/verify-deposit`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': adminKey,
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
 * Obtiene todas las órdenes desde el backend (Admin) o caché local
 */
export async function getAllOrders() {
  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'kuropunk_admin_secret_2026';
  const result = await fetchWithFallback(
    `/orders?limit=100`,
    {
      method: 'GET',
      headers: { 'x-admin-key': adminKey },
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
  const clean = query.trim();
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
            parsed.id?.toLowerCase().includes(clean.toLowerCase()) ||
            parsed.trackingCode?.toLowerCase().includes(clean.toLowerCase()) ||
            parsed.phone?.includes(clean)
          ) {
            return parsed;
          }
        }
      } catch (e) {}

      // Fallback demo for quick test
      return {
        id: clean.startsWith('VS-') ? clean : 'VS-592812',
        trackingCode: clean.startsWith('KP-') ? clean : 'KP-COP-9482',
        customerName: 'Cliente KuroPunk',
        phone: clean.match(/^\d+$/) ? clean : '3015690382',
        address: 'Carrera 7 # 72 - 41 (Chapinero)',
        city: 'Bogotá D.C.',
        subtotal: 145000,
        shippingCost: 0,
        total: 145000,
        status: 'CONFIRMED',
        createdAt: new Date().toISOString(),
        items: [
          {
            title: 'The Wanderer Amigurumi // Flagship',
            price: 145000,
            quantity: 1,
            color: 'Asphalt',
            size: 'MED',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd'
          }
        ]
      };
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
  const adminKey = import.meta.env.VITE_ADMIN_KEY || 'kuropunk_admin_secret_2026';
  return fetchWithFallback(
    `/contact`,
    {
      method: 'GET',
      headers: { 'x-admin-key': adminKey },
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
