import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { Toast } from './components/Toast';
import { ConcreteShaderCanvas } from './components/ConcreteShaderCanvas';
import { HomePage } from './pages/HomePage';
import { ShopPage } from './pages/ShopPage';
import { AdminGuard } from './guards/AdminGuard';
import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from './data/products';
import { Toaster, toast } from 'sonner';
import { subscribeToOrderById } from './services/firebase';
import { trackOrder, getProductById } from './services/api';

// Catálogo unificado para resolución directa de URLs compartidas y navegación
const ALL_CATALOG_PRODUCTS = [...PRODUCTS, ...(PUNTO_CRUZ_PRODUCTS || []), ...(PATRONES_PRODUCTS || [])];

// Helper para parsear la ruta desde el Hash del navegador (soporte total de botón Atrás/Adelante)
function parseHashRoute() {
  if (typeof window === 'undefined') return { view: 'home', productId: null };
  const rawHash = window.location.hash.replace(/^#\/?/, '').trim();
  if (!rawHash) return { view: 'home', productId: null };

  const [route, param] = rawHash.split('/');
  if ((route === 'product' || route === 'producto') && param) {
    return { view: 'product-detail', productId: decodeURIComponent(param) };
  }
  const validViews = ['home', 'shop', 'about', 'contact', 'checkout', 'my-orders', 'admin'];
  if (validViews.includes(route)) {
    return { view: route, productId: null };
  }
  return { view: 'home', productId: null };
}

// Helper para formatear vista y producto a Hash de navegación
function formatHashRoute(view, product = null) {
  if (view === 'product-detail' && product?.id) {
    return `#/product/${encodeURIComponent(product.id)}`;
  }
  if (view === 'home') return '#/';
  return `#/${view}`;
}

// Lazy-loaded heavy modules and secondary pages to minimize initial mobile bundle
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage').then(m => ({ default: m.ProductDetailPage })));
const OurStoryPage = lazy(() => import('./pages/OurStoryPage').then(m => ({ default: m.OurStoryPage })));
const ContactPage = lazy(() => import('./pages/ContactPage').then(m => ({ default: m.ContactPage })));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage').then(m => ({ default: m.CheckoutPage })));
const MyOrdersPage = lazy(() => import('./pages/MyOrdersPage').then(m => ({ default: m.MyOrdersPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));

// Lazy-loaded auxiliary modals
const CommandPalette = lazy(() => import('./components/CommandPalette').then(m => ({ default: m.CommandPalette })));
const OrderTrackingModal = lazy(() => import('./components/OrderTrackingModal').then(m => ({ default: m.OrderTrackingModal })));
const AuthModal = lazy(() => import('./components/AuthModal').then(m => ({ default: m.AuthModal })));
const WorkshopHUDModal = lazy(() => import('./components/WorkshopHUDModal').then(m => ({ default: m.WorkshopHUDModal })));
const AuthenticityModal = lazy(() => import('./components/AuthenticityModal').then(m => ({ default: m.AuthenticityModal })));

// Cyberpunk lightweight loading skeleton for smooth transitions
const PageLoadingFallback = () => (
  <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-8 h-8 border-2 border-[#e0141f] border-t-transparent animate-spin rounded-full"></div>
    <span className="text-[11px] font-mono text-neutral-400 tracking-widest uppercase">
      CARGANDO MÓDULO · KUROPUNK
    </span>
  </div>
);

export function AppContent() {
  const initialRoute = parseHashRoute();
  const [currentView, setCurrentViewState] = useState(initialRoute.view);
  const [selectedProduct, setSelectedProduct] = useState(() => {
    if (initialRoute.productId) {
      const found = ALL_CATALOG_PRODUCTS.find(p => p.id === initialRoute.productId || p.sku === initialRoute.productId);
      if (found) return found;
    }
    return PRODUCTS[0];
  });

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWorkshopHUDOpen, setIsWorkshopHUDOpen] = useState(false);
  const [isAuthenticityOpen, setIsAuthenticityOpen] = useState(false);
  const [depositNoticeBanner, setDepositNoticeBanner] = useState(null);
  const { setIsCartOpen } = useCart();
  const { currentUser, isAdmin } = useAuth();
  const currentViewRef = useRef(currentView);
  currentViewRef.current = currentView;

  // Suscripción global para avisar al cliente en tiempo real cuando el Admin acepta o rechaza su anticipo
  useEffect(() => {
    let activeUnsub = () => {};
    let currentWatchedId = null;

    const checkAndNotify = (orderData) => {
      if (!orderData?.id || currentViewRef.current === 'admin') return;
      const paySt = String(orderData.paymentStatus || '').toUpperCase();
      if (paySt !== 'ANTICIPO_VERIFICADO' && paySt !== 'RECHAZADO') return;

      const notifyKey = `${orderData.id}_${paySt}`;
      try {
        const notifiedList = JSON.parse(localStorage.getItem('kuropunk_notified_orders') || '[]');
        if (notifiedList.includes(notifyKey)) return;
        notifiedList.push(notifyKey);
        localStorage.setItem('kuropunk_notified_orders', JSON.stringify(notifiedList));
      } catch {}

      setDepositNoticeBanner({
        id: orderData.id,
        trackingCode: orderData.trackingCode || orderData.trackingNumber || orderData.id,
        status: paySt,
      });

      if (paySt === 'ANTICIPO_VERIFICADO') {
        toast.success(`¡Tu anticipo para la orden #${orderData.id} fue aceptado! Ya estás en la Cola de Producción.`);
      } else {
        toast.error(`Tu comprobante para la orden #${orderData.id} no pudo ser validado. Revisa el rastreo de tu pedido.`);
      }
    };

    const syncWatcher = async () => {
      if (currentViewRef.current === 'admin') return;
      try {
        const lastRaw = localStorage.getItem('kuropunk_last_order');
        if (!lastRaw) return;
        const lastOrder = JSON.parse(lastRaw);
        if (!lastOrder?.id) return;

        if (currentWatchedId !== lastOrder.id) {
          activeUnsub();
          currentWatchedId = lastOrder.id;
          activeUnsub = subscribeToOrderById(lastOrder.id, (live) => {
            checkAndNotify(live);
          });
        }

        if (
          (typeof document === 'undefined' || document.visibilityState === 'visible') &&
          (String(lastOrder.status || '').toUpperCase() === 'VERIFICANDO_ANTICIPO' ||
            String(lastOrder.paymentStatus || '').toUpperCase() === 'VERIFICANDO_ANTICIPO')
        ) {
          const tracked = await trackOrder(lastOrder.id).catch(() => null);
          if (tracked) checkAndNotify(tracked);
        }
      } catch {}
    };

    syncWatcher();
    const intervalId = setInterval(syncWatcher, 15000);

    return () => {
      activeUnsub();
      clearInterval(intervalId);
    };
  }, []);

  // Navegación sincronizada con el historial nativo del navegador (PushState + Hash)
  const navigateTo = useCallback((view, product = null, replace = false) => {
    const targetProduct = product || selectedProduct;
    if (product) {
      setSelectedProduct(product);
    }
    setCurrentViewState(view);

    const targetHash = formatHashRoute(view, targetProduct);
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState({ view, productId: targetProduct?.id }, '', targetHash);
      } else {
        window.history.pushState({ view, productId: targetProduct?.id }, '', targetHash);
      }
    }
  }, [selectedProduct]);

  // Navegación Atrás inteligente: Usa el botón atrás del navegador o vuelve al home/shop
  const navigateBack = useCallback(() => {
    if (window.history.length > 1 && window.location.hash !== '#/' && window.location.hash !== '') {
      window.history.back();
    } else {
      navigateTo('shop');
    }
  }, [navigateTo]);

  // Listener para soportar Botón Atrás (Back), Botón Adelante (Forward) y gestos táctiles móviles
  useEffect(() => {
    const resolveProductFromRoute = (productId) => {
      if (!productId) return;
      const found = ALL_CATALOG_PRODUCTS.find(p => p.id === productId || p.sku === productId);
      if (found) {
        setSelectedProduct(found);
      } else {
        getProductById(productId)
          .then((remoteProd) => {
            if (remoteProd && remoteProd.id) setSelectedProduct(remoteProd);
          })
          .catch(() => {});
      }
    };

    const handleLocationChange = () => {
      const { view, productId } = parseHashRoute();
      if (view === 'product-detail' && productId) {
        resolveProductFromRoute(productId);
      }
      setCurrentViewState(view);
    };

    if (initialRoute.view === 'product-detail' && initialRoute.productId) {
      resolveProductFromRoute(initialRoute.productId);
    }

    // Asegurar que la entrada inicial exista en el stack de historial
    if (!window.location.hash || window.location.hash === '#/' || window.location.hash === '#') {
      window.history.replaceState({ view: 'home' }, '', '#/');
    }

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  // RBAC Guard is handled gracefully by AdminGuard component at render time

  // Atajo global Ctrl+K / Cmd+K para abrir/cerrar buscador boveda
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Bloquear scroll de fondo cuando cualquier modal esté activo y restaurar siempre limpio al cerrar
  const anyModalOpen = isCommandOpen || isTrackingOpen || isAuthOpen || isWorkshopHUDOpen || isAuthenticityOpen;
  useEffect(() => {
    if (anyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [anyModalOpen]);

  // Scroll instantáneo al tope al cambiar de vista (sin bloqueo ni pelea con el wheel del mouse)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleSelectProduct = (product) => {
    navigateTo('product-detail', product);
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#080808] text-[#e6e1e1] selection:bg-[#FF0033] selection:text-[#fff4f3] overflow-x-hidden">
      {/* 1. Interactive Canvas Shader Grime & Spray Effect */}
      <ConcreteShaderCanvas />

      {/* 2. Global Persistent Navigation Bar */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={navigateTo} 
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWorkshopHUD={() => setIsWorkshopHUDOpen(true)}
        onOpenAuthenticity={() => setIsAuthenticityOpen(true)}
      />

      {/* 2.1 Banner Global en Tiempo Real cuando el Admin acepta o rechaza el anticipo */}
      {depositNoticeBanner && (
        <div
          className={`relative z-40 px-4 py-3 border-b-2 font-mono text-xs flex flex-wrap items-center justify-between gap-3 ${
            depositNoticeBanner.status === 'ANTICIPO_VERIFICADO'
              ? 'bg-emerald-950/95 border-[#25D366] text-emerald-100'
              : 'bg-red-950/95 border-[#e0141f] text-red-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="font-bold uppercase text-sm text-white">
              {depositNoticeBanner.status === 'ANTICIPO_VERIFICADO'
                ? `✓ ¡Pago Aceptado! Tu orden #${depositNoticeBanner.id} ya entró a la Cola Oficial de Producción.`
                : `⚠ Tu comprobante de la orden #${depositNoticeBanner.id} requiere revisión.`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsTrackingOpen(true);
                setDepositNoticeBanner(null);
              }}
              className="px-3 py-1.5 bg-[#25D366] text-black font-bold uppercase text-[11px]"
            >
              Ver Estado del Pedido
            </button>
            <button
              type="button"
              onClick={() => setDepositNoticeBanner(null)}
              className="px-2 py-1 text-neutral-300 hover:text-white border border-neutral-600 uppercase text-[10px]"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* 3. Global Command Palette (⌘K) - Lazy Loaded */}
      {isCommandOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandOpen}
            setIsOpen={setIsCommandOpen}
            onSelectProduct={handleSelectProduct}
            setCurrentView={navigateTo}
            onOpenCart={() => setIsCartOpen(true)}
          />
        </Suspense>
      )}

      {/* 3.1 Live Order Tracking Modal - Lazy Loaded */}
      {isTrackingOpen && (
        <Suspense fallback={null}>
          <OrderTrackingModal
            isOpen={isTrackingOpen}
            onClose={() => setIsTrackingOpen(false)}
          />
        </Suspense>
      )}

      {/* 3.2 Global Authentication & RBAC Modal - Lazy Loaded */}
      {isAuthOpen && (
        <Suspense fallback={null}>
          <AuthModal
            isOpen={isAuthOpen}
            onClose={() => setIsAuthOpen(false)}
          />
        </Suspense>
      )}

      {/* 3.3 HUD Modo Taller / Contador de Vueltas Global - Lazy Loaded */}
      {isWorkshopHUDOpen && (
        <Suspense fallback={null}>
          <WorkshopHUDModal
            isOpen={isWorkshopHUDOpen}
            onClose={() => setIsWorkshopHUDOpen(false)}
            currentPatternTitle={selectedProduct?.title || "Proyecto Activo en Taller"}
          />
        </Suspense>
      )}

      {/* 3.4 Verificador de Autenticidad Serializada (Bóveda COA) - Lazy Loaded */}
      {isAuthenticityOpen && (
        <Suspense fallback={null}>
          <AuthenticityModal
            isOpen={isAuthenticityOpen}
            onClose={() => setIsAuthenticityOpen(false)}
            initialSerial={selectedProduct?.sku || "RX-00-042"}
          />
        </Suspense>
      )}

      {/* 4. Slide-over Cart Drawer */}
      <CartDrawer
        onCheckout={() => navigateTo('checkout')}
        onExploreCatalog={() => navigateTo('shop')}
      />

      {/* 5. Industrial Floating Toast Alerts & Sonner Notifications */}
      <Toast />
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* 6. Main Routed Screen (respuesta instantánea sin bloqueo de AnimatePresence mode="wait") */}
      <main className="flex-grow pt-20 sm:pt-24 relative z-10">
        <Suspense fallback={<PageLoadingFallback />}>
          {currentView === 'home' && (
            <HomePage
              setCurrentView={navigateTo}
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentView === 'shop' && (
            <ShopPage
              onSelectProduct={handleSelectProduct}
            />
          )}

          {currentView === 'product-detail' && (
            <ProductDetailPage
              product={selectedProduct}
              onSelectProduct={handleSelectProduct}
              onBackToShop={navigateBack}
            />
          )}

          {currentView === 'about' && (
            <OurStoryPage
              setCurrentView={navigateTo}
            />
          )}

          {currentView === 'contact' && (
            <ContactPage />
          )}

          {currentView === 'checkout' && (
            <CheckoutPage
              onBackToShop={navigateBack}
              onOpenTracking={() => setIsTrackingOpen(true)}
            />
          )}

          {currentView === 'my-orders' && (
            <MyOrdersPage
              onBackToShop={navigateBack}
              onSelectOrderForTracking={() => setIsTrackingOpen(true)}
            />
          )}

          {currentView === 'admin' && (
            <AdminGuard onBackToShop={navigateBack}>
              <AdminPage onBackToShop={navigateBack} />
            </AdminGuard>
          )}
        </Suspense>
      </main>

      {/* 7. Global Footer */}
      <Footer setCurrentView={navigateTo} />
    </div>
  );
}

class ProductionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('[KuroPunk ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080808] text-[#e6e1e1] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md border-2 border-[#e0141f] bg-[#141313] p-8 space-y-4">
            <h1 className="font-headline-md text-3xl text-[#fff4f3] uppercase">
              INTERRUPCIÓN TEMPORAL EN PANTALLA
            </h1>
            <p className="font-mono text-xs text-neutral-300 leading-relaxed">
              Ocurrió un inconveniente inesperado al cargar esta vista. Tu carrito y sesión están protegidos.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false });
                window.location.hash = '#/';
                window.location.reload();
              }}
              className="w-full py-3 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-headline-md text-lg uppercase tracking-wider"
            >
              RECARGAR TIENDA KUROPUNK
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ProductionErrorBoundary>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </ProductionErrorBoundary>
  );
}
