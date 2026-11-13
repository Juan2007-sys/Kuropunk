import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/formatters';
import { Plus, Bell, Star, Flame, Sparkles, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProductCard = ({ product, onSelectProduct, delayIndex = 0 }) => {
  const { addToCart, showToast } = useCart();
  const [isHovered, setIsHovered] = useState(false);
  const isSoldOut = product.badge === 'SOLD OUT' || product.badge === 'AGOTADO' || product.badgeType === 'sold-out' || product.stock === 0;

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isSoldOut) {
      showToast(`Te avisaremos cuando "${product.title}" vuelva a estar disponible.`, "info");
      return;
    }
    addToCart(product, 1);
  };

  // Discount percentage calculation
  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(delayIndex * 0.04, 0.3) }}
      onClick={() => onSelectProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group flex flex-col cursor-pointer bg-[#0e0e0e] border transition-all duration-300 relative overflow-hidden staple-corner ${
        isSoldOut 
          ? 'border-neutral-900 opacity-80 hover:opacity-100 hover:border-neutral-700' 
          : 'border-neutral-800/80 hover:border-[#5e3f3c] hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
      }`}
    >
      {/* Torn Tape Accent on Special Drops */}
      {(product.badge === 'LIMITED DROP' || product.badge === 'EDICIÓN LIMITADA' || product.badge === 'FLAGSHIP' || product.badge === 'HOT' || product.badge === 'DESTACADO') && (
        <div className="torn-tape -top-2 -left-2 transform -rotate-12 pointer-events-none z-30"></div>
      )}

      {/* Studio Image Container */}
      <div className="relative w-full aspect-[4/5] bg-[#141414] overflow-hidden">
        {/* Spray Hover Backlight Bloom (Stitch Style) */}
        <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/15 transition-opacity duration-500 z-10 mix-blend-screen pointer-events-none"></div>

        {/* Main Product Image with zoom / alternate angle switch */}
        <img
          src={isHovered && product.altImage ? product.altImage : (product.image || product.imageUrl || (product.images && product.images[0]))}
          alt={product.title}
          className={`w-full h-full object-cover object-center transition-all duration-700 ease-out ${
            isSoldOut ? 'grayscale contrast-125' : 'group-hover:scale-105'
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Dynamic Top-Left Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
          {/* SOLD OUT Banner */}
          {isSoldOut ? (
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 bg-neutral-900 text-[#FF0033] border border-[#FF0033]/60 font-bold backdrop-blur-md shadow-lg">
              DROP AGOTADO
            </span>
          ) : (
            <>
              {product.badge && (
                <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 backdrop-blur-md flex items-center gap-1 ${
                  product.badge === 'LIMITED DROP' || product.badge === 'EDICIÓN LIMITADA' || product.badge === 'FLAGSHIP'
                    ? 'bg-[#FF0033] text-white font-bold shadow-md'
                    : product.badge === 'NEW' || product.badge === 'NUEVO'
                    ? 'bg-white text-black font-bold'
                    : product.badge === 'HOT' || product.badge === 'DESTACADO' || product.badge === 'LAST ONE' || product.badge === 'ÚLTIMA UNIDAD'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-neutral-900/90 text-neutral-200 border border-neutral-700'
                }`}>
                  {(product.badge === 'HOT' || product.badge === 'DESTACADO') && <Flame className="w-2.5 h-2.5" />}
                  {product.badge} {product.badgeVol ? `· ${product.badgeVol}` : ''}
                </span>
              )}

              {/* Low Stock Pill */}
              {product.stock > 0 && product.stock <= 4 && (
                <span className="text-[8.5px] font-mono tracking-wider text-amber-400 bg-black/80 px-1.5 py-0.5 border border-amber-500/40 backdrop-blur-sm self-start animate-pulse">
                  ÚLTIMAS {product.stock} PIEZAS
                </span>
              )}
            </>
          )}

          {/* Size Tag */}
          {product.size && (
            <span className="text-[9px] font-mono tracking-wider text-neutral-400 bg-black/70 px-1.5 py-0.5 backdrop-blur-sm self-start">
              TALLA: {product.size}
            </span>
          )}
        </div>

        {/* Top-Right Discount Badge */}
        {discountPercent && !isSoldOut && (
          <div className="absolute top-2.5 right-2.5 z-20 bg-[#FF0033] text-white text-[10px] font-mono font-bold px-1.5 py-0.5 shadow-md">
            -{discountPercent}%
          </div>
        )}

        {/* SOLD OUT Center Overlay Ribbon (Stitch Diagonal Stamp) */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] pointer-events-none z-15">
            <div className="w-[120%] bg-[#111111]/95 py-2 border-y border-[#5e3f3c] text-center transform -rotate-12 shadow-2xl">
              <span className="text-xs font-mono font-bold tracking-[0.3em] text-[#ffb4ab] uppercase">
                // DROP AGOTADO //
              </span>
            </div>
          </div>
        )}

        {/* Quick Action Overlay (Visible on mobile/touch, hover on desktop) */}
        <div className="absolute inset-x-2 bottom-2 z-20 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
          <button
            type="button"
            onClick={handleAddToCart}
            className={`w-full min-h-[44px] py-2.5 px-3 text-xs font-mono uppercase tracking-wider font-semibold transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.97] ${
              isSoldOut
                ? 'bg-neutral-900/95 hover:bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'bg-neutral-100 hover:bg-[#FF0033] text-neutral-950 hover:text-white'
            }`}
          >
            {isSoldOut ? (
              <>
                <Bell className="w-4 h-4 text-[#FF0033] shrink-0" />
                <span className="truncate">AVISARME STOCK</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 shrink-0" />
                <span>AGREGAR AL CARRITO</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Product Metadata & Info */}
      <div className="p-3.5 flex flex-col justify-between flex-grow bg-[#0b0b0b]">
        <div className="min-w-0">
          {/* Subtle Technical Tag & Edition */}
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 tracking-wider uppercase mb-1">
            <span>{product.sku || 'KP-AMIGURUMI'}</span>
            <span className="text-neutral-400">{product.edition || product.height || 'EDICIÓN'}</span>
          </div>

          {/* Product Title */}
          <h3 className="text-sm font-medium text-neutral-200 group-hover:text-[#ffb4ab] transition-colors tracking-tight truncate break-words" title={product.title}>
            {product.title}
          </h3>
          
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {product.subtitle || product.category}
          </p>

          {/* Star Rating & Reviews */}
          {product.rating && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-neutral-400">
              <span className="text-[#FF0033] flex items-center">
                ★ <strong className="text-neutral-300 ml-0.5">{product.rating.toFixed(1)}</strong>
              </span>
              <span className="text-neutral-600">({product.reviewsCount || 0} valoraciones)</span>
            </div>
          )}
        </div>

        {/* Price & Action Link */}
        <div className="mt-3 pt-2.5 border-t border-neutral-900 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-sm font-semibold tracking-tight ${isSoldOut ? 'text-neutral-500' : 'text-white'}`}>
              {formatCOP(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs font-mono text-neutral-600 line-through">
                {formatCOP(product.originalPrice)}
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-neutral-500 group-hover:text-[#FF0033] transition-colors flex items-center gap-0.5">
            VER DETALLE <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </motion.div>
  );
};
