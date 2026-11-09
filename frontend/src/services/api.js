import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';

const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? 'https://kuropunk-backend.onrender.com/api' : 'http://localhost:4000/api')
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
    } catch (e) {}

    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[api.js submitOrder] caught error:', err);
    if (err.name === 'AbortError') {
      throw new Error('La conexión tardó demasiado tiempo. Verifica tu red móvil y reintenta.');
    }
    // Si es un error con status HTTP (400, 422, 500), propagarlo directamente
    if (err.status) {
      throw err;
    }
    // Si la API está 100% inalcanzable (Failed to fetch)
    console.warn('[KuroPunk API Offline] Servidor inalcanzable para orden:', err.message);
    const offlineId = `VS-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}`;
    const offlineResult = {
      id: offlineId,
      customerName: orderData.customerName,
      phone: orderData.phone,
      address: orderData.address,
      city: orderData.city,
      total: orderData.total,
      status: 'OFFLINE_PENDING',
      trackingCode: `KP-PEND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      items: orderData.items,
      createdAt: new Date().toISOString(),
      isOffline: true,
    };
    try {
      localStorage.setItem('kuropunk_last_order', JSON.stringify(offlineResult));
    } catch (e) {}
    return offlineResult;
  }
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
        address: 'Calle 45 # 70-12 (Barrio Laureles)',
        city: 'Medellín, Antioquia',
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
