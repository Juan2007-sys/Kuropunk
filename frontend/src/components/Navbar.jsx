import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingCart, User, Search, Menu, X, Heart, Package, Shield, LogOut, FileText, Hammer, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logoNegro from '../assets/logo_negro.jpeg';

export const Navbar = ({ 
  currentView, 
  setCurrentView, 
  onOpenCommandPalette, 
  onOpenTracking, 
  onOpenAuth,
  onOpenWorkshopHUD,
  onOpenAuthenticity
}) => {
  const { totalItems, setIsCartOpen, wishlist } = useCart();
  const { currentUser, isAdmin, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Native Spanish navigation labels (Eliminada ruta duplicada "Colecciones")
  const navItems = [
    { id: 'home', label: 'Inicio' },
    { id: 'shop', label: 'Catálogo' },
    { id: 'about', label: 'Acerca de' },
    { id: 'contact', label: 'Contacto' }
  ];

  const handleNavClick = (id) => {
    setIsMobileMenuOpen(false);
    setCurrentView(id);
  };

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
    setCurrentView('home');
  };

  return (
    <header className="fixed top-0 w-full z-40 transition-all duration-500 concrete-texture brutalist-border border-t-0 border-x-0 overflow-hidden backdrop-blur-md bg-[#141313]/95 shadow-xl">
      {/* Dynamic light glows */}
      <div className="absolute top-[-50px] left-[15%] w-[250px] h-[250px] bg-[#ffb4ab] rounded-full blur-[100px] opacity-15 pointer-events-none"></div>
      <div className="absolute top-[-20px] right-[25%] w-[350px] h-[150px] bg-[#e0141f] rounded-full blur-[120px] opacity-15 pointer-events-none"></div>

      <div className="h-16 sm:h-20 lg:h-24 w-full px-2.5 sm:px-6 lg:px-8 flex items-center justify-between relative max-w-7xl mx-auto gap-1 sm:gap-2">
        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center p-2 text-neutral-300 hover:text-white border border-[#5e3f3c] bg-[#1d1b1b] focus:outline-none focus:ring-1 focus:ring-[#e0141f] shrink-0"
          aria-label="Abrir menú de navegación"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* Brand Logo with translate="no" to protect from browser auto-translate */}
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 sm:gap-3 group text-left focus:outline-none shrink min-w-0"
          aria-label="Ir a la página de inicio de KuroPunk"
        >
          <img
            alt="KuroPunk Logo"
            className="h-9 w-9 sm:h-12 sm:w-12 lg:h-14 lg:w-14 rounded-full object-cover border-2 border-[#5e3f3c] group-hover:border-[#e0141f] transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-2deg] shadow-[0_0_15px_rgba(224,20,31,0.35)] shrink-0"
            src={logoNegro}
          />
          <div className="flex flex-col min-w-0">
            <span
              translate="no"
              className="font-headline-md text-base sm:text-2xl lg:text-3xl text-[#e6e1e1] tracking-tight group-hover:text-[#ffb4ab] transition-colors leading-none truncate"
            >
              KUROPUNK
            </span>
            <span
              translate="no"
              className="text-[6.5px] sm:text-[9px] tracking-[0.2em] sm:tracking-[0.25em] text-[#e0141f] font-mono mt-0.5 uppercase font-semibold whitespace-nowrap hidden xs:inline"
            >
              UNDERGROUND CROCHET
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`font-label-caps text-xs uppercase tracking-widest transition-all py-1 relative whitespace-nowrap ${
                  isActive
                    ? 'text-[#ffb4ab] underline decoration-2 underline-offset-8 font-bold'
                    : 'text-[#e7bcb8]/70 hover:text-[#ffb4ab]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#e0141f] animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Actions (Search, Wishlist, Cart & Single Admin/User Action) */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0">
          {/* Accessible Interactive Global Search Trigger Bar */}
          <button
            onClick={onOpenCommandPalette}
            type="button"
            className="min-h-[44px] min-w-[44px] px-2 sm:px-3 flex items-center justify-center gap-2 bg-[#1c1a1a] hover:bg-[#252222] border border-[#5e3f3c] hover:border-[#ffb4ab] text-neutral-300 text-xs font-mono transition-all group shadow-sm focus:outline-none focus:ring-1 focus:ring-[#e0141f] whitespace-nowrap"
            aria-label="Buscar piezas, SKUs o coleccionables (Ctrl+K)"
            title="Abrir buscador interactivo (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 text-[#e0141f] group-hover:scale-110 transition-transform shrink-0" aria-hidden="true" />
            <span className="hidden xl:inline text-[11px] text-neutral-400 group-hover:text-neutral-200">
              Buscar piezas, SKUs...
            </span>
            <span className="hidden sm:inline xl:hidden text-[11px] text-neutral-400 group-hover:text-neutral-200">
              Buscar...
            </span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[9px] bg-neutral-900 text-neutral-400 border border-neutral-700 rounded font-mono shrink-0">
              ⌘K
            </kbd>
          </button>

          {/* Order Tracking Trigger */}
          <button
            onClick={onOpenTracking}
            type="button"
            className="min-h-[44px] min-w-[44px] px-2 sm:px-2.5 flex items-center justify-center gap-1 bg-[#171515] hover:bg-[#221f1f] border border-[#5e3f3c] hover:border-[#25D366] text-neutral-300 text-xs font-mono transition-all group shadow-sm focus:outline-none focus:ring-1 focus:ring-[#25D366] whitespace-nowrap"
            aria-label="Rastrear pedido contraentrega"
            title="Rastrear Pedido Contraentrega"
          >
            <Package className="w-3.5 h-3.5 text-[#25D366] group-hover:scale-110 transition-transform shrink-0" aria-hidden="true" />
            <span className="hidden md:inline text-[11px] text-neutral-300 group-hover:text-emerald-400 font-bold">
              RASTREO
            </span>
          </button>

          {/* Botones Privilegiados de Administración y Taller: Solo visibles si el usuario está autenticado y tiene rol Admin */}
          {currentUser && isAdmin && (
            <>
              {/* Botón Verificador de Autenticidad (COA Bóveda) */}
              <button
                onClick={onOpenAuthenticity}
                type="button"
                className="hidden lg:flex min-h-[44px] items-center gap-1.5 px-2.5 py-1.5 bg-[#171515] hover:bg-[#221f1f] border border-[#5e3f3c] hover:border-[#e0141f] text-neutral-300 text-xs font-mono transition-all group shadow-sm focus:outline-none focus:ring-1 focus:ring-[#e0141f] whitespace-nowrap"
                aria-label="Verificar autenticidad de pieza en bóveda"
                title="Verificar Autenticidad (Certificado COA)"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#e0141f] group-hover:scale-110 transition-transform shrink-0" aria-hidden="true" />
                <span className="text-[11px] text-neutral-300 group-hover:text-white font-bold">
                  BÓVEDA COA
                </span>
              </button>
            </>
          )}

          {/* Wishlist Indicator */}
          {wishlist && wishlist.length > 0 && (
            <button
              onClick={() => setCurrentView('shop')}
              title={`${wishlist.length} favoritos en tu arsenal`}
              aria-label={`Ver ${wishlist.length} favoritos`}
              className="relative min-h-[44px] min-w-[44px] p-2 text-neutral-300 hover:text-[#ffb4ab] transition-colors hidden sm:flex items-center justify-center focus:outline-none"
            >
              <Heart className="w-4 h-4 text-[#e0141f] fill-[#e0141f]/30" aria-hidden="true" />
              <span className="absolute top-1 right-1 bg-[#5e3f3c] text-[#ffb4ab] text-[9px] font-mono px-1 rounded-full">
                {wishlist.length}
              </span>
            </button>
          )}

          {/* Cart Trigger with Spring Bounce */}
          <button
            data-cart-target="true"
            onClick={() => setIsCartOpen(true)}
            className="relative min-h-[44px] min-w-[44px] flex items-center justify-center p-2 rounded hover:bg-neutral-800 text-neutral-200 hover:text-white transition-colors group focus:outline-none focus:ring-1 focus:ring-[#e0141f]"
            aria-label={`Abrir carrito de compras con ${totalItems} productos`}
          >
            <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" aria-hidden="true" />
            <AnimatePresence>
              {totalItems > 0 && (
                <motion.span
                  key={totalItems}
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{ scale: [1.3, 0.9, 1], opacity: 1 }}
                  exit={{ scale: 0.2, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="absolute top-0 right-0 bg-[#FF0033] text-white text-[10px] min-w-4 h-4 px-1 flex items-center justify-center font-mono font-bold shadow-[0_0_8px_rgba(255,0,51,0.6)]"
                >
                  {totalItems}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* 
            UNIFICACIÓN DE BOTÓN DE USUARIO / ADMINISTRACIÓN:
          */}
          {isAdmin ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setCurrentView('admin')}
                type="button"
                className={`min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border text-xs font-mono font-bold transition-all shadow-sm focus:outline-none whitespace-nowrap ${
                  currentView === 'admin'
                    ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_12px_rgba(224,20,31,0.5)]'
                    : 'bg-red-950/40 border-red-700/80 text-red-300 hover:bg-[#e0141f] hover:text-white'
                }`}
                title="Panel de Administración (Taller KuroPunk)"
                aria-label="Panel de administración"
              >
                <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden xs:inline">ADMINISTRACIÓN</span>
                <span className="xs:hidden">ADMIN</span>
              </button>

              <button
                onClick={handleLogout}
                type="button"
                title="Cerrar Sesión"
                aria-label="Cerrar sesión"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#5e3f3c] hover:border-red-600 text-neutral-400 hover:text-red-400 bg-[#1c1a1a] transition-colors focus:outline-none"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          ) : currentUser ? (
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                onClick={() => setCurrentView('my-orders')}
                type="button"
                className={`min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 border text-xs font-mono transition-all focus:outline-none whitespace-nowrap ${
                  currentView === 'my-orders'
                    ? 'bg-[#e0141f] border-[#e0141f] text-white'
                    : 'bg-[#1c1a1a] border-[#5e3f3c] text-neutral-300 hover:text-white'
                }`}
                title="Mis Pedidos y Seguimiento"
                aria-label="Consultar mis pedidos"
              >
                <FileText className="w-3.5 h-3.5 text-[#ffb4ab] shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline text-[11px] font-bold">
                  {currentUser.displayName?.split(' ')[0] || 'MIS PEDIDOS'}
                </span>
              </button>

              <button
                onClick={handleLogout}
                type="button"
                title="Cerrar Sesión"
                aria-label="Cerrar sesión"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-[#5e3f3c] hover:border-red-600 text-neutral-400 hover:text-red-400 bg-[#1c1a1a] transition-colors focus:outline-none"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              type="button"
              className="min-h-[44px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-[#e0141f] hover:bg-[#ff1f2d] text-white text-xs font-mono font-bold uppercase transition-all shadow-sm focus:outline-none focus:ring-1 focus:ring-white whitespace-nowrap"
              title="Iniciar Sesión / Registro"
              aria-label="Iniciar sesión o registrarse"
            >
              <User className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline text-[11px]">INGRESAR</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Slide-Down Menu with dynamic viewport height containment */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="lg:hidden bg-[#141313] border-t border-[#5e3f3c] px-5 py-4 flex flex-col gap-2 max-h-[calc(100dvh-4.5rem)] overflow-y-auto overscroll-contain shadow-2xl"
          >
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] flex items-center border-b border-[#211f1f] ${
                  currentView === item.id ? 'text-[#ffb4ab] font-bold' : 'text-neutral-400'
                }`}
              >
                {item.label}
              </button>
            ))}

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCommandPalette();
              }}
              className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-neutral-300 font-bold flex items-center gap-2"
            >
              <Search className="w-4 h-4 text-[#e0141f]" />
              <span>Buscar piezas, SKUs...</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenTracking();
              }}
              className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-[#25D366] font-bold flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>Rastrear Pedido Contraentrega</span>
            </button>

            {/* Accesos de taller exclusivos para administradores autenticados */}
            {currentUser && isAdmin && (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenAuthenticity();
                  }}
                  className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-[#ffb4ab] font-bold flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-[#e0141f]" />
                  <span>Verificar Autenticidad (Bóveda COA)</span>
                </button>
              </>
            )}

            {/* Menú móvil condicional según rol */}
            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('admin');
                  }}
                  className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-red-400 font-bold flex items-center gap-2"
                >
                  <Shield className="w-4 h-4" />
                  <span>Panel de Administración (Taller)</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-left font-label-caps text-xs uppercase tracking-wider py-3 min-h-[44px] text-neutral-400 hover:text-white flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : currentUser ? (
              <>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setCurrentView('my-orders');
                  }}
                  className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-[#ffb4ab] font-bold flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Mis Pedidos ({currentUser.displayName})</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="text-left font-label-caps text-xs uppercase tracking-wider py-3 min-h-[44px] text-neutral-400 hover:text-white flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onOpenAuth();
                }}
                className="text-left font-label-caps text-sm uppercase tracking-wider py-3 min-h-[44px] border-b border-[#211f1f] text-[#e0141f] font-bold flex items-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Iniciar Sesión / Registrarme</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
