import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';
import { Search, ShoppingBag, Download, ArrowRight, Sparkles, FileText, Layers, Grid as GridIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CommandPalette = ({ isOpen, setIsOpen, onSelectProduct, setCurrentView, onOpenCart }) => {
  const [search, setSearch] = useState('');

  // Toggle on Ctrl+K / Cmd+K
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [setIsOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Command Dialog Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-[#0d0d0d] border border-neutral-700/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden z-10"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 bg-[#121212] text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1.5 text-[#FF0033]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF0033] animate-pulse"></span>
              KUROPUNK // TERMINAL BÓVEDA
            </span>
            <span className="text-neutral-500">ESC PARA SALIR</span>
          </div>

          <Command
            className="w-full bg-transparent text-neutral-200"
            filter={(value, search) => {
              if (value.toLowerCase().includes(search.toLowerCase())) return 1;
              return 0;
            }}
          >
            {/* Input */}
            <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-[#0a0a0a]">
              <Search className="w-4 h-4 text-[#FF0033] shrink-0 mr-3" />
              <Command.Input
                autoFocus
                value={search}
                onValueChange={setSearch}
                placeholder="Buscar amigurumis, gráficos de punto cruz, patrones PDF o comandos..."
                className="w-full bg-transparent text-sm font-mono text-neutral-100 placeholder:text-neutral-600 outline-none"
              />
            </div>

            {/* Results List */}
            <Command.List className="max-h-[380px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-neutral-800">
              <Command.Empty className="py-8 text-center text-xs font-mono text-neutral-500">
                NO SE ENCONTRARON RESULTADOS PARA "{search}"
              </Command.Empty>

              {/* Navigation Group */}
              <Command.Group heading="NAVEGACIÓN RÁPIDA" className="text-[10px] font-mono text-neutral-500 px-2 py-1.5 uppercase tracking-wider font-semibold">
                <Command.Item
                  onSelect={() => {
                    setCurrentView('shop');
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-3.5 h-3.5 text-[#FF0033]" />
                    <span>Ver Catálogo Completo (Amigurumis, Punto Cruz & Patrones)</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-white transition-colors" />
                </Command.Item>

                <Command.Item
                  onSelect={() => {
                    onOpenCart();
                    setIsOpen(false);
                  }}
                  className="flex items-center justify-between p-2 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[#FF0033]" />
                    <span>Abrir Carrito / Loadout de Compra</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-white transition-colors" />
                </Command.Item>
              </Command.Group>

              {/* Amigurumis Plush Group */}
              <Command.Group heading="AMIGURUMIS ARTEFACTOS" className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                {PRODUCTS.slice(0, 5).map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.title} ${p.sku} ${p.category} ${p.series}`}
                    onSelect={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.title} className="w-8 h-8 object-cover rounded bg-neutral-900 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-neutral-200 group-hover:text-white font-medium">{p.title}</span>
                        <span className="text-[10px] text-neutral-500">{p.sku} • {p.series || p.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#FF0033] font-bold">${p.price.toFixed(2)}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-white" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Punto Cruz Group */}
              <Command.Group heading="PUNTO CRUZ & GRÁFICOS" className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                {PUNTO_CRUZ_PRODUCTS.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.title} ${p.sku} punto cruz dmc`}
                    onSelect={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.title} className="w-8 h-8 object-cover rounded bg-neutral-900 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-neutral-200 group-hover:text-white font-medium">{p.title}</span>
                        <span className="text-[10px] text-neutral-500">{p.sku} • {p.gridSize}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-bold">${p.price.toFixed(2)}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-white" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>

              {/* Patrones PDF Group */}
              <Command.Group heading="PATRONES & GUÍAS PDF" className="text-[10px] font-mono text-neutral-500 px-2 pt-3 pb-1.5 uppercase tracking-wider font-semibold">
                {PATRONES_PRODUCTS.map((p) => (
                  <Command.Item
                    key={p.id}
                    value={`${p.title} ${p.sku} patron guia pdf`}
                    onSelect={() => {
                      onSelectProduct(p);
                      setIsOpen(false);
                    }}
                    className="flex items-center justify-between p-2 rounded hover:bg-[#161616] hover:text-white cursor-pointer text-xs font-mono transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <img src={p.image} alt={p.title} className="w-8 h-8 object-cover rounded bg-neutral-900 shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-neutral-200 group-hover:text-white font-medium">{p.title}</span>
                        <span className="text-[10px] text-neutral-500">{p.sku} • {p.difficulty}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-bold">${p.price.toFixed(2)}</span>
                      <ArrowRight className="w-3 h-3 text-neutral-600 group-hover:text-white" />
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>

            {/* Footer Help */}
            <div className="px-4 py-2 bg-[#090909] border-t border-neutral-800 flex items-center justify-between text-[10px] font-mono text-neutral-500">
              <span>Navega con <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded">↑</kbd> <kbd className="px-1 py-0.5 bg-neutral-800 text-neutral-300 rounded">↓</kbd></span>
              <span>Selecciona con <kbd className="px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">Enter</kbd></span>
            </div>
          </Command>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
