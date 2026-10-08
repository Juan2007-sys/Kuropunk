import React, { useState, useEffect, Suspense, lazy } from 'react';
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
import { PRODUCTS } from './data/products';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';
import { Toaster } from 'sonner';
import { Hammer } from 'lucide-react';

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
      CARGANDO MÓDULO // KUROPUNK
    </span>
  </div>
);

export function AppContent() {
  const [currentView, setCurrentView] = useState('home');
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isWorkshopHUDOpen, setIsWorkshopHUDOpen] = useState(false);
  const [isAuthenticityOpen, setIsAuthenticityOpen] = useState(false);
  const { setIsCartOpen } = useCart();
  const { currentUser, isAdmin } = useAuth();

  // Strict RBAC Guard: If user logs out and currentView is admin, force redirect to home
  useEffect(() => {
    if (!isAdmin && currentView === 'admin') {
      setCurrentView('home');
    }
  }, [isAdmin, currentView]);

  // Initialize Lenis Smooth Scrolling (solo en Desktop con puntero fino para evitar lag táctil)
  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return; // Mantiene el desplazamiento a 120Hz nativo de celulares

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9
    });

    let animationFrameId;
    function raf(time) {
      lenis.raf(time);
      animationFrameId = requestAnimationFrame(raf);
    }
    animationFrameId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(animationFrameId);
      lenis.destroy();
    };
  }, []);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
  };

  const pageVariants = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
    exit: { opacity: 0, y: -12, transition: { duration: 0.25, ease: 'easeIn' } }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#080808] text-[#e6e1e1] selection:bg-[#FF0033] selection:text-[#fff4f3] overflow-x-hidden">
      {/* 1. Interactive Canvas Shader Grime & Spray Effect */}
      <ConcreteShaderCanvas />

      {/* 2. Global Persistent Navigation Bar */}
      <Navbar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onOpenCommandPalette={() => setIsCommandOpen(true)}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenWorkshopHUD={() => setIsWorkshopHUDOpen(true)}
        onOpenAuthenticity={() => setIsAuthenticityOpen(true)}
      />

      {/* 3. Global Command Palette (⌘K) - Lazy Loaded */}
      {isCommandOpen && (
        <Suspense fallback={null}>
          <CommandPalette
            isOpen={isCommandOpen}
            setIsOpen={setIsCommandOpen}
            onSelectProduct={handleSelectProduct}
            setCurrentView={setCurrentView}
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
        onCheckout={() => setCurrentView('checkout')}
        onExploreCatalog={() => setCurrentView('shop')}
      />

      {/* 5. Industrial Floating Toast Alerts & Sonner Notifications */}
      <Toast />
      <Toaster position="bottom-right" theme="dark" richColors />

      {/* 6. Main Routed Screen with Framer Motion Page Transitions & Suspense */}
      <main className="flex-grow pt-20 sm:pt-24 relative z-10">
        <Suspense fallback={<PageLoadingFallback />}>
          <AnimatePresence mode="wait">
            {currentView === 'home' && (
              <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <HomePage
                  setCurrentView={setCurrentView}
                  onSelectProduct={handleSelectProduct}
                />
              </motion.div>
            )}

            {currentView === 'shop' && (
              <motion.div key="shop" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ShopPage
                  onSelectProduct={handleSelectProduct}
                />
              </motion.div>
            )}

            {currentView === 'product-detail' && (
              <motion.div key="product-detail" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ProductDetailPage
                  product={selectedProduct}
                  onSelectProduct={handleSelectProduct}
                  onBackToShop={() => setCurrentView('shop')}
                />
              </motion.div>
            )}

            {currentView === 'about' && (
              <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <OurStoryPage
                  setCurrentView={setCurrentView}
                />
              </motion.div>
            )}

            {currentView === 'contact' && (
              <motion.div key="contact" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <ContactPage />
              </motion.div>
            )}

            {currentView === 'checkout' && (
              <motion.div key="checkout" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <CheckoutPage
                  onBackToShop={() => setCurrentView('shop')}
                  onOpenTracking={() => setIsTrackingOpen(true)}
                />
              </motion.div>
            )}

            {currentView === 'my-orders' && (
              <motion.div key="my-orders" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <MyOrdersPage
                  onBackToShop={() => setCurrentView('shop')}
                  onSelectOrderForTracking={() => setIsTrackingOpen(true)}
                />
              </motion.div>
            )}

            {currentView === 'admin' && (
              <motion.div key="admin" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                <AdminGuard onBackToShop={() => setCurrentView('shop')}>
                  <AdminPage onBackToShop={() => setCurrentView('shop')} />
                </AdminGuard>
              </motion.div>
            )}
          </AnimatePresence>
        </Suspense>
      </main>

      {/* 7. Global Footer */}
      <Footer setCurrentView={setCurrentView} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
