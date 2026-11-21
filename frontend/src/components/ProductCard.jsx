import React, { useEffect, useRef } from 'react';
import { useCartActions } from '../context/CartContext';
import { formatCOP } from '../utils/formatters';
import { Plus, Bell, Flame, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Lanza una partícula hacia el carrito siguiendo una curva paramétrica de Bézier cuadrática r(t)
 * y orientándola según su vector tangente r'(t) = dr/dt.
 */
export function launchCartBezierFlight(sourceEl, onArrive) {
  if (typeof window === 'undefined' || !sourceEl) {
    if (onArrive) onArrive();
    return;
  }
  const targetEl = document.querySelector('[data-cart-target="true"]');
  if (!targetEl) {
    if (onArrive) onArrive();
    return;
  }

  const sRect = sourceEl.getBoundingClientRect();
  const tRect = targetEl.getBoundingClientRect();

  // Puntos de control P0 (origen), P1 (vértice elevado), P2 (destino en carrito)
  const p0 = { x: sRect.left + sRect.width / 2, y: sRect.top + sRect.height / 2 };
  const p2 = { x: tRect.left + tRect.width / 2, y: tRect.top + tRect.height / 2 };
  const p1 = {
    x: (p0.x + p2.x) * 0.5 + (p0.x < p2.x ? -50 : 50),
    y: Math.min(p0.y, p2.y) - 130
  };

  const orb = document.createElement('div');
  orb.style.cssText =
    'position:fixed;left:0;top:0;width:16px;height:16px;border-radius:9999px;background:#e0141f;box-shadow:0 0 18px rgba(224,20,31,0.95),0 0 6px #fff;pointer-events:none;z-index:9999;will-change:transform,opacity;';
  document.body.appendChild(orb);

  const duration = 520;
  const start = performance.now();

  const step = (now) => {
    const t = Math.max(0, Math.min(1, (now - start) / duration));
    const omt = 1 - t;

    // r(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
    const x = omt * omt * p0.x + 2 * omt * t * p1.x + t * t * p2.x;
    const y = omt * omt * p0.y + 2 * omt * t * p1.y + t * t * p2.y;

    // Vector tangente r'(t) = 2(1-t)(P1 - P0) + 2t(P2 - P1)
    const dx = 2 * omt * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
    const dy = 2 * omt * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
    const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
    const speedNorm = Math.min(1.8, 1 + Math.hypot(dx, dy) * 0.0005);

    orb.style.transform = `translate3d(${x - 8}px, ${y - 8}px, 0) rotate(${angleDeg.toFixed(1)}deg) scale(${speedNorm.toFixed(2)}, ${(1 - t * 0.45).toFixed(2)})`;
    orb.style.opacity = t > 0.85 ? String((1 - t) / 0.15) : '1';

    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      orb.remove();
      if (onArrive) onArrive();
    }
  };

  requestAnimationFrame(step);
}

export const ProductCard = React.memo(({ product, onSelectProduct, delayIndex = 0 }) => {
  const { addToCart, showToast } = useCartActions();
  const cardRef = useRef(null);
  const glareRef = useRef(null);
  const rectRef = useRef(null);
  const tiltRafRef = useRef(null);
  const isSoldOut = product.badge === 'SOLD OUT' || product.badge === 'AGOTADO' || product.badgeType === 'sold-out' || product.stock === 0;

  useEffect(() => {
    return () => {
      if (tiltRafRef.current) {
        cancelAnimationFrame(tiltRafRef.current);
        tiltRafRef.current = null;
      }
    };
  }, []);

  const applyTiltAndLambert = (clientX, clientY) => {
    if (tiltRafRef.current) cancelAnimationFrame(tiltRafRef.current);
    tiltRafRef.current = requestAnimationFrame(() => {
      tiltRafRef.current = null;
      if (!cardRef.current) return;
      const rect = rectRef.current || cardRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      rectRef.current = rect;

      const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((clientY - rect.top) / rect.height) * 2 - 1;

      const maxTiltDeg = 9;
      const rotX = -ny * maxTiltDeg;
      const rotY = nx * maxTiltDeg;
      cardRef.current.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;

      // Iluminación de Lambert N · L animada exclusivamente en GPU compositor (translate3d + opacity, cero repaints)
      if (glareRef.current) {
        const rx = (rotX * Math.PI) / 180;
        const ry = (rotY * Math.PI) / 180;
        const nVec = [-Math.sin(ry), Math.sin(rx), Math.cos(rx) * Math.cos(ry)];
        const lLen = Math.hypot(nx, ny, 1.2);
        const lVec = [nx / lLen, ny / lLen, 1.2 / lLen];
        const nDotL = Math.max(0, nVec[0] * lVec[0] + nVec[1] * lVec[1] + nVec[2] * lVec[2]);

        const tx = (nx * rect.width * 0.45).toFixed(1);
        const ty = (ny * rect.height * 0.45).toFixed(1);
        glareRef.current.style.opacity = (nDotL * 0.55).toFixed(3);
        glareRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
    });
  };

  const handleMouseMove = (e) => {
    applyTiltAndLambert(e.clientX, e.clientY);
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      rectRef.current = cardRef.current.getBoundingClientRect();
      cardRef.current.style.transition = 'none';
    }
  };

  const handleMouseLeave = () => {
    if (tiltRafRef.current) {
      cancelAnimationFrame(tiltRafRef.current);
      tiltRafRef.current = null;
    }
    rectRef.current = null;
    if (cardRef.current) {
      cardRef.current.style.transition = 'transform 180ms ease-out';
      cardRef.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (isSoldOut) {
      showToast(`Te avisaremos cuando "${product.title}" vuelva a estar disponible.`, "info");
      return;
    }
    launchCartBezierFlight(e.currentTarget, () => {
      addToCart(product, 1);
    });
  };

  const discountPercent = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
    : null;

  const primaryImg = product.image || product.imageUrl || (product.images && product.images[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(delayIndex * 0.04, 0.3) }}
      className="h-full"
    >
      <div
        ref={cardRef}
        onClick={() => onSelectProduct(product)}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ transformStyle: 'preserve-3d', transition: 'transform 180ms ease-out' }}
        className={`group flex flex-col h-full cursor-pointer bg-[#0e0e0e] border transition-colors duration-300 relative overflow-hidden staple-corner ${
          isSoldOut 
            ? 'border-neutral-900 opacity-80 hover:opacity-100 hover:border-neutral-700' 
            : 'border-neutral-800/80 hover:border-[#5e3f3c] hover:shadow-[0_8px_30px_rgba(0,0,0,0.8)]'
        }`}
      >
      {/* Reflejo especular estático movido solo vía translate3d en GPU */}
      <div
        ref={glareRef}
        className="absolute -inset-1/2 pointer-events-none z-20 opacity-0 transition-opacity duration-200 will-change-transform"
        style={{
          background: 'radial-gradient(circle, rgba(255, 180, 171, 0.35) 0%, rgba(224, 20, 31, 0.12) 35%, transparent 65%)',
        }}
      />

      {/* Torn Tape Accent on Special Drops */}
      {(product.badge === 'LIMITED DROP' || product.badge === 'EDICIÓN LIMITADA' || product.badge === 'FLAGSHIP' || product.badge === 'HOT' || product.badge === 'DESTACADO') && (
        <div className="torn-tape -top-2 -left-2 transform -rotate-12 pointer-events-none z-30"></div>
      )}

      {/* Studio Image Container */}
      <div className="relative w-full aspect-[4/5] bg-[#141414] overflow-hidden">
        {/* Spray Hover Backlight Bloom */}
        <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/15 transition-colors duration-500 z-10 pointer-events-none"></div>

        {/* Main Product Image */}
        <img
          src={primaryImg}
          alt={product.title}
          className={`w-full h-full object-cover object-center transition-transform duration-700 ease-out ${
            isSoldOut ? 'grayscale contrast-125' : 'group-hover:scale-105'
          }`}
          loading="lazy"
          decoding="async"
        />

        {/* Alternate angle image swapped via CSS opacity (avoids React state re-render on hover) */}
        {product.altImage && (
          <img
            src={product.altImage}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out group-hover:scale-105 pointer-events-none"
            loading="lazy"
            decoding="async"
          />
        )}

        {/* Dynamic Top-Left Badges (solid backgrounds, sin backdrop-blur por tarjeta) */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
          {isSoldOut ? (
            <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 bg-neutral-900/95 text-[#FF0033] border border-[#FF0033]/60 font-bold shadow-lg">
              DROP AGOTADO
            </span>
          ) : (
            <>
              {product.badge && (
                <span className={`text-[9px] font-mono tracking-widest uppercase px-2 py-0.5 flex items-center gap-1 ${
                  product.badge === 'LIMITED DROP' || product.badge === 'EDICIÓN LIMITADA' || product.badge === 'FLAGSHIP'
                    ? 'bg-[#FF0033] text-white font-bold shadow-md'
                    : product.badge === 'NEW' || product.badge === 'NUEVO'
                    ? 'bg-white text-black font-bold'
                    : product.badge === 'HOT' || product.badge === 'DESTACADO' || product.badge === 'LAST ONE' || product.badge === 'ÚLTIMA UNIDAD'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-neutral-900/95 text-neutral-200 border border-neutral-700'
                }`}>
                  {(product.badge === 'HOT' || product.badge === 'DESTACADO') && <Flame className="w-2.5 h-2.5" />}
                  {product.badge} {product.badgeVol ? `· ${product.badgeVol}` : ''}
                </span>
              )}

              {product.stock > 0 && product.stock <= 4 && (
                <span className="text-[8.5px] font-mono tracking-wider text-amber-400 bg-black/85 px-1.5 py-0.5 border border-amber-500/40 self-start">
                  ÚLTIMAS {product.stock} PIEZAS
                </span>
              )}
            </>
          )}

          {product.size && (
            <span className="text-[9px] font-mono tracking-wider text-neutral-400 bg-black/80 px-1.5 py-0.5 self-start">
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

        {/* SOLD OUT Center Overlay Ribbon */}
        {isSoldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none z-15">
            <div className="w-[120%] bg-[#111111]/95 py-2 border-y border-[#5e3f3c] text-center transform -rotate-12 shadow-2xl">
              <span className="text-xs font-mono font-bold tracking-[0.3em] text-[#ffb4ab] uppercase">
                // DROP AGOTADO //
              </span>
            </div>
          </div>
        )}

        {/* Quick Action Overlay */}
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
          <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 tracking-wider uppercase mb-1">
            <span>{product.sku || 'KP-AMIGURUMI'}</span>
            <span className="text-neutral-400">{product.edition || product.height || 'EDICIÓN'}</span>
          </div>

          <h3 className="text-sm font-medium text-neutral-200 group-hover:text-[#ffb4ab] transition-colors tracking-tight truncate break-words" title={product.title}>
            {product.title}
          </h3>
          
          <p className="text-xs text-neutral-500 truncate mt-0.5">
            {product.subtitle || product.category}
          </p>

          {product.rating && (
            <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono text-neutral-400">
              <span className="text-[#FF0033] flex items-center">
                ★ <strong className="text-neutral-300 ml-0.5">{product.rating.toFixed(1)}</strong>
              </span>
              <span className="text-neutral-600">({product.reviewsCount || 0} valoraciones)</span>
            </div>
          )}
        </div>

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
      </div>
    </motion.div>
  );
});
