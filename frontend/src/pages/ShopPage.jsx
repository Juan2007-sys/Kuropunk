import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';
import { subscribeProducts } from '../services/firebase';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/formatters';
import { downloadPatternPDF } from '../utils/downloadPdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ChevronDown, 
  Download, 
  ShoppingBag, 
  ArrowUpRight, 
  SlidersHorizontal,
  X,
  FileText,
  Grid as GridIcon,
  Layers,
  Sparkles
} from 'lucide-react';

export const ShopPage = ({ onSelectProduct }) => {
  // Navigation Tabs: 'amigurumis' | 'punto_cruz' | 'patrones'
  const [activeTab, setActiveTab] = useState('amigurumis');

  // Filter States
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('ALL');
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [sizeFilter, setSizeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore live products state
  const [firestoreProducts, setFirestoreProducts] = useState(null);

  const { addToCart, showToast } = useCart();

  // Subscribe to live products in Firestore
  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (liveList) => {
        if (liveList && liveList.length > 0) {
          setFirestoreProducts(liveList);
        }
      },
      (err) => {
        console.warn('[ShopPage] Products subscription fallback:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Compute Base Lists (Firestore merged with fallback catalog)
  const amigurumisBase = useMemo(() => {
    const activeLocal = PRODUCTS.filter(p => p.isActive !== false);
    if (!firestoreProducts || firestoreProducts.length === 0) return activeLocal;
    const allFirestoreIds = new Set(firestoreProducts.map(p => p.id));
    const liveAmis = firestoreProducts.filter(p => 
      p.isActive !== false &&
      (p.technique === 'amigurumi' || (!p.technique && p.category !== 'Punto de Cruz' && p.category !== 'Patrones'))
    );
    const fallbacksNotOverridden = activeLocal.filter(p => !allFirestoreIds.has(p.id));
    return [...liveAmis, ...fallbacksNotOverridden];
  }, [firestoreProducts]);

  const puntoCruzBase = useMemo(() => {
    const activeLocal = PUNTO_CRUZ_PRODUCTS.filter(p => p.isActive !== false);
    if (!firestoreProducts || firestoreProducts.length === 0) return activeLocal;
    const allFirestoreIds = new Set(firestoreProducts.map(p => p.id));
    const liveCruz = firestoreProducts.filter(p => 
      p.isActive !== false &&
      (p.technique === 'punto_cruz' || p.category === 'Punto de Cruz')
    );
    const fallbacksNotOverridden = activeLocal.filter(p => !allFirestoreIds.has(p.id));
    return [...liveCruz, ...fallbacksNotOverridden];
  }, [firestoreProducts]);

  const patronesBase = useMemo(() => {
    const activeLocal = PATRONES_PRODUCTS.filter(p => p.isActive !== false);
    if (!firestoreProducts || firestoreProducts.length === 0) return activeLocal;
    const allFirestoreIds = new Set(firestoreProducts.map(p => p.id));
    const livePatrones = firestoreProducts.filter(p => 
      p.isActive !== false &&
      (p.technique === 'patron' || p.technique === 'patron_pdf' || p.category === 'Patrones' || p.isPattern)
    );
    const fallbacksNotOverridden = activeLocal.filter(p => !allFirestoreIds.has(p.id));
    return [...livePatrones, ...fallbacksNotOverridden];
  }, [firestoreProducts]);

  // Reset all filters
  const resetFilters = () => {
    setAvailabilityFilter('ALL');
    setPriceFilter('ALL');
    setSeriesFilter('ALL');
    setSizeFilter('ALL');
    setSortBy('featured');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    availabilityFilter !== 'ALL' || 
    priceFilter !== 'ALL' || 
    seriesFilter !== 'ALL' || 
    sizeFilter !== 'ALL' || 
    searchQuery.trim() !== '';

  // 1. Process Amigurumis
  const processedAmigurumis = useMemo(() => {
    let list = [...amigurumisBase];

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // Availability
    if (availabilityFilter === 'IN_STOCK') {
      list = list.filter(p => p.stock > 0 && p.badge !== 'SOLD OUT' && p.badge !== 'AGOTADO' && p.badgeType !== 'sold-out');
    } else if (availabilityFilter === 'LIMITED') {
      list = list.filter(p => p.badge === 'LIMITED DROP' || p.badge === 'EDICIÓN LIMITADA' || p.badge === 'FLAGSHIP');
    }

    // Series
    if (seriesFilter !== 'ALL') {
      list = list.filter(p => p.series === seriesFilter || p.category === seriesFilter);
    }

    // Size
    if (sizeFilter !== 'ALL') {
      list = list.filter(p => p.size === sizeFilter);
    }

    // Price Range (COP)
    if (priceFilter === 'UNDER_50') {
      list = list.filter(p => p.price < 50000);
    } else if (priceFilter === '50_100') {
      list = list.filter(p => p.price >= 50000 && p.price <= 100000);
    } else if (priceFilter === 'OVER_100') {
      list = list.filter(p => p.price > 100000);
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }

    return list;
  }, [amigurumisBase, searchQuery, availabilityFilter, seriesFilter, sizeFilter, priceFilter, sortBy]);

  // 2. Process Punto Cruz
  const processedPuntoCruz = useMemo(() => {
    let list = [...puntoCruzBase];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return list;
  }, [puntoCruzBase, searchQuery, sortBy]);

  // 3. Process Patrones
  const processedPatrones = useMemo(() => {
    let list = [...patronesBase];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        (p.title && p.title.toLowerCase().includes(q)) || 
        (p.sku && p.sku.toLowerCase().includes(q)) || 
        (p.description && p.description.toLowerCase().includes(q))
      );
    }
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    }
    return list;
  }, [patronesBase, searchQuery, sortBy]);

  const handleDownload = (e, item) => {
    e.stopPropagation();
    try {
      downloadPatternPDF(item);
      showToast(`DESCARGANDO PDF · ${item.title.toUpperCase()}`, "success");
    } catch (err) {
      console.error(err);
      showToast("ERROR AL GENERAR EL DOCUMENTO", "error");
    }
  };

  const handleAddKit = (e, item, isBundle = false) => {
    e.stopPropagation();
    const price = isBundle ? (item.bundlePrice || item.price) : (item.kitPrice || item.price);
    const title = isBundle ? `${item.title} [BUNDLE LANA + PDF]` : `${item.title} [KIT COMPLETO]`;
    addToCart({
      id: `${item.id}-${isBundle ? 'bundle' : 'kit'}`,
      title: title,
      price: price,
      image: item.image
    });
    showToast(`AGREGADO · ${title.toUpperCase()}`, "success");
  };

  const currentCount = 
    activeTab === 'amigurumis' ? processedAmigurumis.length :
    activeTab === 'punto_cruz' ? processedPuntoCruz.length :
    processedPatrones.length;

  return (
    <div className="w-full min-h-screen bg-[#080808] text-neutral-200 pt-6 pb-28 selection:bg-[#FF0033] selection:text-white">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 lg:px-12">
        
        {/* ========================================================================= */}
        {/* 1. MINIMALIST TOP TEXT TABS (OWL / NIKE TECH STYLE)                       */}
        {/* ========================================================================= */}
        <div className="border-b border-neutral-900 pb-0 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Horizontal Text Tabs */}
            <nav className="flex items-center gap-4 sm:gap-10 overflow-x-auto no-scrollbar" aria-label="Catálogo">
              <button
                onClick={() => setActiveTab('amigurumis')}
                className={`text-xs sm:text-sm tracking-widest font-mono uppercase pb-3 min-h-[44px] flex items-center transition-all relative whitespace-nowrap ${
                  activeTab === 'amigurumis'
                    ? 'text-white font-medium'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                [ AMIGURUMIS ({amigurumisBase.length}) ]
                {activeTab === 'amigurumis' && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0033] shadow-[0_0_8px_rgba(255,0,51,0.8)]"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
              </button>

              {puntoCruzBase.length > 0 && (
                <button
                  onClick={() => setActiveTab('punto_cruz')}
                  className={`text-xs sm:text-sm tracking-widest font-mono uppercase pb-3 min-h-[44px] flex items-center transition-all relative whitespace-nowrap ${
                    activeTab === 'punto_cruz'
                      ? 'text-white font-medium'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [ PUNTO CRUZ ({puntoCruzBase.length}) ]
                  {activeTab === 'punto_cruz' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0033] shadow-[0_0_8px_rgba(255,0,51,0.8)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              )}

              {patronesBase.length > 0 && (
                <button
                  onClick={() => setActiveTab('patrones')}
                  className={`text-xs sm:text-sm tracking-widest font-mono uppercase pb-3 min-h-[44px] flex items-center transition-all relative whitespace-nowrap ${
                    activeTab === 'patrones'
                      ? 'text-white font-medium'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  [ PATRONES PDF ({patronesBase.length}) ]
                  {activeTab === 'patrones' && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#FF0033] shadow-[0_0_8px_rgba(255,0,51,0.8)]"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </button>
              )}
            </nav>

            {/* Subtitle / Telemetry */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono text-neutral-500 tracking-wider pb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF0033] animate-pulse"></span>
              <span>KUROPUNK · ARCHIVO 2024</span>
              <span>•</span>
              <span>WORLDWIDE DISPATCH</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. COMPACT HORIZONTAL FILTER BAR (SINGLE ROW - NO HEAVY SIDEBAR)          */}
        {/* ========================================================================= */}
        <div className="bg-[#0e0e0e] border border-neutral-800/80 px-4 py-3 mb-8 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          
          {/* Left Group: Dropdown Filters & Search */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 flex-grow">
            
            {/* Inline Search */}
            <div className="relative w-full sm:w-auto sm:min-w-[180px] sm:max-w-[240px]">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="BUSCAR ARCHIVO..."
                className="w-full bg-[#141414] border border-neutral-800 focus:border-neutral-500 text-neutral-200 placeholder:text-neutral-600 text-base sm:text-xs min-h-[44px] px-3 py-2 pl-9 outline-none transition-colors"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-11 h-11 flex items-center justify-center absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Amigurumis Specific Filters */}
            {activeTab === 'amigurumis' && (
              <>
                {/* Series Dropdown */}
                <div className="relative">
                  <select
                    value={seriesFilter}
                    onChange={(e) => setSeriesFilter(e.target.value)}
                    className="appearance-none bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-base sm:text-xs min-h-[44px] px-3 py-2 pr-8 outline-none cursor-pointer transition-colors uppercase"
                  >
                    <option value="ALL">Categoría: Todas</option>
                    <option value="Alley Kats">Alley Kats</option>
                    <option value="Grit Series">Grit Series</option>
                    <option value="Hardware">Hardware / EDC</option>
                    <option value="Beasts">Beasts</option>
                    <option value="Rogues">Rogues</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Size Dropdown */}
                <div className="relative">
                  <select
                    value={sizeFilter}
                    onChange={(e) => setSizeFilter(e.target.value)}
                    className="appearance-none bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-base sm:text-xs min-h-[44px] px-3 py-2 pr-8 outline-none cursor-pointer transition-colors uppercase"
                  >
                    <option value="ALL">Tamaño: Todos</option>
                    <option value="SML">SML (Pocket)</option>
                    <option value="MED">MED (Stand)</option>
                    <option value="LRG">LRG (Large)</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Availability Dropdown */}
                <div className="relative">
                  <select
                    value={availabilityFilter}
                    onChange={(e) => setAvailabilityFilter(e.target.value)}
                    className="appearance-none bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-base sm:text-xs min-h-[44px] px-3 py-2 pr-8 outline-none cursor-pointer transition-colors uppercase"
                  >
                    <option value="ALL">Estado: Todos</option>
                    <option value="IN_STOCK">En Stock</option>
                    <option value="LIMITED">Edición Limitada</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </>
            )}

            {/* Price Filter */}
            <div className="relative">
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="appearance-none bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-base sm:text-xs min-h-[44px] px-3 py-2 pr-8 outline-none cursor-pointer transition-colors uppercase"
              >
                <option value="ALL">Precio: Todos</option>
                <option value="UNDER_50">&lt; $50.000 COP</option>
                <option value="50_100">$50.000 - $100.000 COP</option>
                <option value="OVER_100">&gt; $100.000 COP</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="text-xs text-neutral-400 hover:text-[#FF0033] underline px-2 min-h-[44px] flex items-center transition-colors"
              >
                LIMPIAR
              </button>
            )}
          </div>

          {/* Right Group: Item Counter & Sort Dropdown */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Live Count */}
            <span className="text-neutral-500 text-[11px]">
              [ <strong className="text-neutral-200">{currentCount}</strong> {currentCount === 1 ? 'PIEZA' : 'PIEZAS'} ]
            </span>

            {/* Sort Selector */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-[#141414] border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-base sm:text-xs min-h-[44px] px-3 py-2 pr-8 outline-none cursor-pointer transition-colors uppercase"
              >
                <option value="featured">ORDENAR: DESTACADOS</option>
                <option value="price_asc">PRECIO: MENOR A MAYOR</option>
                <option value="price_desc">PRECIO: MAYOR A MENOR</option>
                <option value="name_asc">NOMBRE: A - Z</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. PRODUCT GRIDS (STREETWEAR 4-COLUMN RESPONSIVE LAYOUT)                  */}
        {/* ========================================================================= */}

        {/* TAB 1: AMIGURUMIS GRID */}
        {activeTab === 'amigurumis' && (
          <div>
            {processedAmigurumis.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-800 bg-[#0c0c0c]">
                <p className="text-sm font-mono text-neutral-400 uppercase mb-3">
                  NO SE ENCONTRARON ARTEFACTOS CON ESOS PARÁMETROS
                </p>
                <button
                  onClick={resetFilters}
                  className="text-xs font-mono text-[#FF0033] hover:underline uppercase tracking-wider"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {processedAmigurumis.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelectProduct={onSelectProduct}
                    delayIndex={idx}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PUNTO CRUZ GRID */}
        {activeTab === 'punto_cruz' && (
          <div>
            {processedPuntoCruz.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-800 bg-[#0c0c0c]">
                <p className="text-sm font-mono text-neutral-400 uppercase mb-3">
                  NO SE ENCONTRARON GRÁFICOS DE PUNTO CRUZ
                </p>
                <button
                  onClick={resetFilters}
                  className="text-xs font-mono text-[#FF0033] hover:underline uppercase tracking-wider"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {processedPuntoCruz.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.05 }}
                    onClick={() => onSelectProduct(item)}
                    className="group flex flex-col bg-[#0e0e0e] border border-neutral-800/80 hover:border-[#5e3f3c] staple-corner transition-all duration-300 relative overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
                  >
                    <div className="torn-tape -top-2 -left-2 transform -rotate-12 pointer-events-none z-30"></div>

                    {/* Image Preview */}
                    <div className="relative w-full aspect-[4/5] bg-[#141414] overflow-hidden">
                      <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/15 transition-opacity duration-500 z-10 mix-blend-screen pointer-events-none"></div>

                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
                        <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 bg-neutral-900/90 text-[#ffb4ab] border border-[#5e3f3c] backdrop-blur-md">
                          {item.badge}
                        </span>
                        <span className="text-[9px] font-mono tracking-wider text-neutral-400 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm self-start">
                          {item.gridSize}
                        </span>
                      </div>

                      {/* Action Bar: visible on touch devices, hover on desktop */}
                      <div className="absolute inset-x-2 bottom-2 z-20 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="w-full min-h-[40px] py-2 bg-[#FF0033] hover:bg-red-700 text-white text-xs sm:text-[11px] font-mono uppercase tracking-widest font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>DESCARGAR PDF GRÁFICO</span>
                        </button>
                        <button
                          onClick={(e) => handleAddKit(e, item, false)}
                          className="w-full min-h-[38px] py-1.5 bg-neutral-900/95 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs sm:text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <ShoppingBag className="w-3 h-3 text-[#FF0033]" />
                          <span>+ KIT CON TELA ({formatCOP(item.kitPrice)})</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 flex flex-col justify-between flex-grow bg-[#0b0b0b]">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 tracking-wider uppercase mb-1">
                          <span>{item.sku}</span>
                          <span className="text-neutral-400">{item.fabric}</span>
                        </div>

                        <h3 className="text-sm font-medium text-neutral-200 group-hover:text-[#ffb4ab] transition-colors tracking-tight line-clamp-1">
                          {item.title}
                        </h3>

                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                          {item.dmcPalette}
                        </p>

                        {/* Star Rating & Reviews */}
                        {item.rating && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-neutral-400">
                            <span className="text-[#FF0033] flex items-center">
                              ★ <strong className="text-neutral-300 ml-0.5">{item.rating.toFixed(1)}</strong>
                            </span>
                            <span className="text-neutral-600">({item.reviewsCount || 0} valoraciones)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-white tracking-tight">
                            {formatCOP(item.price)}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            PDF DIGITAL
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500 group-hover:text-[#FF0033] transition-colors flex items-center gap-0.5">
                          DETALLE <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PATRONES PDF GRID */}
        {activeTab === 'patrones' && (
          <div>
            {processedPatrones.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-neutral-800 bg-[#0c0c0c]">
                <p className="text-sm font-mono text-neutral-400 uppercase mb-3">
                  NO SE ENCONTRARON PATRONES
                </p>
                <button
                  onClick={resetFilters}
                  className="text-xs font-mono text-[#FF0033] hover:underline uppercase tracking-wider"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
                {processedPatrones.map((item, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: idx * 0.04 }}
                    onClick={() => onSelectProduct(item)}
                    className="group flex flex-col bg-[#0e0e0e] border border-neutral-800/80 hover:border-[#5e3f3c] staple-corner transition-all duration-300 relative overflow-hidden cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]"
                  >
                    <div className="torn-tape -top-2 -left-2 transform -rotate-12 pointer-events-none z-30"></div>

                    {/* Image Preview with Blueprint tag */}
                    <div className="relative w-full aspect-[4/5] bg-[#141414] overflow-hidden">
                      <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/15 transition-opacity duration-500 z-10 mix-blend-screen pointer-events-none"></div>

                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
                        <span className="text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 bg-[#FF0033]/90 text-white font-bold backdrop-blur-md">
                          {item.difficulty}
                        </span>
                        <span className="text-[9px] font-mono tracking-wider text-neutral-400 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm self-start">
                          {item.hookSize}
                        </span>
                      </div>

                      {/* Action Bar: visible on touch devices, hover on desktop */}
                      <div className="absolute inset-x-2 bottom-2 z-20 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={(e) => handleDownload(e, item)}
                          className="w-full min-h-[40px] py-2 bg-[#FF0033] hover:bg-red-700 text-white text-xs sm:text-[11px] font-mono uppercase tracking-widest font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>DESCARGAR GUÍA PDF</span>
                        </button>
                        <button
                          onClick={(e) => handleAddKit(e, item, true)}
                          className="w-full min-h-[38px] py-1.5 bg-neutral-900/95 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs sm:text-[10px] font-mono uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 active:scale-95"
                        >
                          <ShoppingBag className="w-3 h-3 text-[#FF0033]" />
                          <span>+ BUNDLE CON LANA ({formatCOP(item.bundlePrice)})</span>
                        </button>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="p-3.5 flex flex-col justify-between flex-grow bg-[#0b0b0b]">
                      <div>
                        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 tracking-wider uppercase mb-1">
                          <span>{item.sku}</span>
                          <span className="text-neutral-400">{item.height}</span>
                        </div>

                        <h3 className="text-sm font-medium text-neutral-200 group-hover:text-[#ffb4ab] transition-colors tracking-tight line-clamp-1">
                          {item.title}
                        </h3>

                        <p className="text-xs text-neutral-500 line-clamp-1 mt-0.5">
                          {item.pages} • {item.stitches}
                        </p>

                        {/* Star Rating & Reviews */}
                        {item.rating && (
                          <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-neutral-400">
                            <span className="text-[#FF0033] flex items-center">
                              ★ <strong className="text-neutral-300 ml-0.5">{item.rating.toFixed(1)}</strong>
                            </span>
                            <span className="text-neutral-600">({item.reviewsCount || 0} valoraciones)</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-semibold text-white tracking-tight">
                            {formatCOP(item.price)}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-500">
                            MANUAL PDF
                          </span>
                        </div>

                        <span className="text-[10px] font-mono text-neutral-500 group-hover:text-[#FF0033] transition-colors flex items-center gap-0.5">
                          BLUEPRINT <ArrowUpRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
