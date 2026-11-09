import React, { useState, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import Lenis from 'lenis';
import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';
import { Search, ShoppingBag, ArrowRight, Layers, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCOP } from '../utils/formatters';

export const CommandPalette = ({ isOpen, setIsOpen, onSelectProduct, setCurrentView, onOpenCart }) => {
  const [search, setSearch] = useState('');
  const listRef = useRef(null);
  const lenisRef = useRef(null);

  // Lock body scroll while CommandPalette is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Dedicated buttery-smooth Lenis scroll for the results list
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return; // Dispositivos móviles conservan scroll inercial nativo táctil de 120Hz

    const listEl = listRef.current;
    const modalLenis = new Lenis({
      wrapper: listEl,
      content: listEl.firstElementChild || listEl,
      duration: 0.85,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      syncTouch: false,
    });
    lenisRef.current = modalLenis;

    let rafId;
    function raf(time) {
      modalLenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      modalLenis.destroy();
      lenisRef.current = null;
    };
  }, [isOpen]);

  // Recalculate Lenis scroll dimensions when filtered search items change
  useEffect(() => {
    if (lenisRef.current) {
      requestAnimationFrame(() => {
        lenisRef.current?.resize();
      });
    }
  }, [search]);

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        data-lenis-prevent="true"
        className="fixed inset-0 z-50 flex items-start sm:items-center justify-center pt-8 sm:pt-0 p-3 sm:p-6 overflow-y-auto overscroll-contain"
      >
        {/* Backdrop (OLED black, optimized without heavy backdrop-filter blur for max 120FPS GPU performance) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/90"
        />

        {/* Command Dialog Box */}
        <motion.div
          data-lenis-prevent="true"
          initial={{ opacity: 0, scale: 0.97, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-2xl lg:max-w-3xl bg-[#0d0d0d] border border-neutral-700/80 shadow-[0_0_50px_rgba(0,0,0,0.95)] overflow-hidden z-10 flex flex-col max-h-[85dvh] sm:max-h-[82vh] my-auto"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#121212] text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 text-[#FF0033] font-bold">
              <span className="w-2 h-2 rounded-full bg-[#FF0033] animate-pulse"></span>
              KUROPUNK // TERMINAL BÓVEDA
            </span>
            <div className="flex items-center gap-1">
              <span className="text-neutral-500 hidden sm:inline text-[10px] mr-2">ESC PARA SALIR</span>
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center text-neutral-400 hover:text-white sm:hidden focus:outline-none"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <Command
            disablePointerSelection
            className="w-full bg-transparent text-neutral-200 flex flex-col flex-1 min-h-0"
            filter={(value, search) => {
              if (value.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
          >
            {/* Search Input Bar (text-base in mobile to prevent iOS auto-zoom) */}
            <div className="flex items-center px-4 py-2 sm:py-3.5 border-b border-neutral-800 bg-[#0a0a0a]">
              <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF0033] shrink-0 mr-3" />
              <Command.Input
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder="Buscar amigurumis, gráficos de punto cruz, patrones..."
                className="w-full bg-transparent text-base sm:text-sm font-mono text-neutral-100 placeholder:text-neutral-600 outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-white focus:outline-none shrink-0"
                  title="Borrar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Results List with dedicated smooth Lenis physics & GPU acceleration */}
            <Command.List 
              ref={listRef}
              data-lenis-prevent="true"
              className="flex-1 max-h-[55vh] sm:max-h-[500px] overflow-y-auto overscroll-contain p-2 sm:p-3 custom-scrollbar [transform:translateZ(0)]"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <Command.Empty className="py-12 text-center text-xs font-mono text-neutral-500">
                NO SE ENCONTRARON RESULTADOS PARA "{search}"
              </Command.Empty>

              {/* Navigation Quick Links */}
              <Command.Group heading="NAVEGACIÓN RÁPIDA" className="text-[10px] font-mono text-neutral-500 px-2 py-1.5 uppercase tracking-wider font-semibold">
                <Command.Item
                  onSelect={() => {
                    setCurrentView('shop');
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono group"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5 text-[#FF0033]" />
                    <span>Ver Catálogo Completo (Amigurumis, Punto Cruz & Patrones)</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onOpenCart();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2.5 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF0033]" />
                    <span>Abrir Carrito / Loadout de Compra</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
                </Command.Item>
              </Command.Group>

              {/* Amigurumis Plush Group (Active items only) */}
              {PRODUCTS.filter(p => p.isActive !== false).length > 0 && (
                <Command.Group heading={`AMIGURUMIS ARTEFACTOS (${PRODUCTS.filter(p => p.isActive !== false).length})`} className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                  {PRODUCTS.filter(p => p.isActive !== false).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`${p.title} ${p.sku} ${p.category} ${p.series} amigurumi`}
                      onSelect={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-9 h-9 object-cover rounded bg-neutral-900 shrink-0 border border-neutral-800" 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-neutral-200 group-hover:text-white font-medium truncate">{p.title}</span>
                          <span className="text-[10px] text-neutral-500 truncate">{p.sku} • {p.series || p.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#FF0033] font-bold font-mono">{formatCOP(p.price)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Punto Cruz Group */}
              {PUNTO_CRUZ_PRODUCTS.filter(p => p.isActive !== false).length > 0 && (
                <Command.Group heading={`PUNTO CRUZ & GRÁFICOS (${PUNTO_CRUZ_PRODUCTS.filter(p => p.isActive !== false).length})`} className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                  {PUNTO_CRUZ_PRODUCTS.filter(p => p.isActive !== false).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`${p.title} ${p.sku} punto cruz dmc grafico`}
                      onSelect={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-9 h-9 object-cover rounded bg-neutral-900 shrink-0 border border-neutral-800" 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-neutral-200 group-hover:text-white font-medium truncate">{p.title}</span>
                          <span className="text-[10px] text-neutral-500 truncate">{p.sku} • {p.gridSize}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#ffb4ab] font-bold font-mono">{formatCOP(p.price)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              {/* Patrones PDF Group */}
              {PATRONES_PRODUCTS.filter(p => p.isActive !== false).length > 0 && (
                <Command.Group heading={`PATRONES & GUÍAS PDF (${PATRONES_PRODUCTS.filter(p => p.isActive !== false).length})`} className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                  {PATRONES_PRODUCTS.filter(p => p.isActive !== false).map((p) => (
                    <Command.Item
                      key={p.id}
                      value={`${p.title} ${p.sku} patron guia pdf descarga`}
                      onSelect={() => {
                        onSelectProduct(p);
                        setIsOpen(false);
                      }}
                      className="flex items-center justify-between p-2.5 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <img 
                          src={p.image} 
                          alt={p.title} 
                          loading="lazy"
                          decoding="async"
                          className="w-9 h-9 object-cover rounded bg-neutral-900 shrink-0 border border-neutral-800" 
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-neutral-200 group-hover:text-white font-medium truncate">{p.title}</span>
                          <span className="text-[10px] text-neutral-500 truncate">{p.sku} • {p.difficulty}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[#ffb4ab] font-bold font-mono">{formatCOP(p.price)}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-neutral-600 group-hover:text-white" />
                      </div>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer Help */}
            <div className="hidden sm:flex px-4 py-2.5 bg-[#090909] border-t border-neutral-800 items-center justify-between text-[10px] font-mono text-neutral-500">
              <span className="flex items-center gap-1.5">
                Navega con <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">↑</kbd> <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">↓</kbd>
              </span>
              <span className="flex items-center gap-1.5">
                Selecciona con <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded font-mono">Enter</kbd>
              </span>
            </div>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
