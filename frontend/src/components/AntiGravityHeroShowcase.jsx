import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../services/firebase';
import { PRODUCTS as fallbackCatalog } from '../data/products';
import { formatCOP } from '../utils/formatters';
import { Sparkles, ChevronLeft, ChevronRight, Eye, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AntiGravityHeroShowcase
 * 
 * Componente interactivo con física vectorial y levitación armónica antigravedad.
 * Calcula en tiempo real el vector de desplazamiento entre el centro del contenedor (O)
 * y la posición del cursor (P), aplicando rotación 3D, parallax y oscilación sinusoidal A*sin(wt).
 */
export function AntiGravityHeroShowcase({ onSelectProduct }) {
  const containerRef = useRef(null);
  const dollRef = useRef(null);
  const shadowRef = useRef(null);

  // Lista de piezas destacadas para el Hero (solo activas con fotos reales)
  const [featuredProducts, setFeaturedProducts] = useState(() => {
    const active = fallbackCatalog.filter((p) => p.isActive !== false && (p.isFeatured || p.isHero));
    return active.length > 0 ? active.slice(0, 3) : fallbackCatalog.filter((p) => p.isActive !== false).slice(0, 3);
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // 1. Consulta dinámica de productos más vendidos / destacados en Firestore
  useEffect(() => {
    async function fetchShowcaseProducts() {
      if (!isFirebaseConfigured) return;
      try {
        const q = query(
          collection(db, 'products'),
          where('isActive', '==', true),
          limit(6)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
          }));
          // Filtrar los que tengan imagen válida y sean destacados
          const filtered = list.filter((p) => p.destacado || p.isFeatured || p.isBestSeller);
          if (filtered.length > 0) {
            setFeaturedProducts(filtered.slice(0, 4));
          } else if (list.length > 0) {
            setFeaturedProducts(list.slice(0, 3));
          }
        }
      } catch (err) {
        console.warn('[AntiGravityHeroShowcase] Fallback a catálogo local:', err.message);
      }
    }
    fetchShowcaseProducts();
  }, []);

  // Autoplay suave para alternar entre piezas cada 7s (se pausa si el usuario tiene el mouse encima)
  useEffect(() => {
    if (isHovered || featuredProducts.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [isHovered, featuredProducts.length]);

  // =========================================================================
  // 2. FÍSICA VECTORIAL Y LEVITACIÓN ANTIGRAVEDAD (requestAnimationFrame)
  // =========================================================================
  const stateRef = useRef({
    // Vectores objetivo, actuales y velocidades (sistema masa-resorte-amortiguador)
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    velRotX: 0,
    velRotY: 0,
    targetTransX: 0,
    currentTransX: 0,
    velTransX: 0,
    targetTransZ: 0,
    currentTransZ: 0,
    velTransZ: 0,
    normDistance: 0,
    // Parámetros de trayectoria paramétrica r(t)
    amplitude: 14,      // Amplitud A en píxeles
    frequency: 0.0022,  // Velocidad angular omega
    lastTimestamp: null,
    animFrameId: null
  });

  useEffect(() => {
    let isRunning = true;
    let isVisible = true;
    let isScrolling = false;
    let scrollTimeoutId = null;
    const isMobile =
      typeof window !== 'undefined' &&
      (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches);
    const minFrameMs = isMobile ? 32 : 16;
    let lastDrawTime = 0;

    const handleScroll = () => {
      if (!isMobile) return;
      isScrolling = true;
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      scrollTimeoutId = setTimeout(() => {
        isScrolling = false;
      }, 120);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // IntersectionObserver to pause loop when Hero is completely off screen
    let observer;
    try {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry) isVisible = entry.isIntersecting;
        },
        { threshold: 0 }
      );
      if (containerRef.current) {
        observer.observe(containerRef.current);
      }
    } catch (e) {
      isVisible = true;
    }

    // Integrador semi-implícito de Euler para ecuación diferencial masa-resorte-amortiguador:
    // a = k * (target - x) - c * v
    const stepSpring = (pos, vel, target, dt) => {
      const stiffness = 110;
      const damping = 15;
      const accel = stiffness * (target - pos) - damping * vel;
      const nextVel = vel + accel * dt;
      return [pos + nextVel * dt, nextVel];
    };

    const updatePhysics = (timestamp) => {
      if (!isRunning) return;
      stateRef.current.animFrameId = requestAnimationFrame(updatePhysics);

      if (!isVisible || isScrolling) return;
      if (timestamp - lastDrawTime < minFrameMs) return;

      const s = stateRef.current;
      const dt = s.lastTimestamp
        ? Math.min(0.05, (timestamp - s.lastTimestamp) / 1000)
        : 0.016;
      s.lastTimestamp = timestamp;
      lastDrawTime = timestamp;

      // 4. Trayectoria paramétrica espacial r(t) = (x(t), y(t), z(t)) tipo Lissajous
      const omegaX = 0.0014;
      const omegaZ = 0.0011;
      const paramX = 4.5 * Math.sin(omegaX * timestamp);
      const paramY = s.amplitude * Math.sin(s.frequency * timestamp);
      const paramZ = 6 * Math.cos(omegaZ * timestamp);

      // Vector velocidad tangente v(t) = r'(t) para inclinación dinámica sutil
      const velParamX = 4.5 * omegaX * Math.cos(omegaX * timestamp);
      const velParamY = s.amplitude * s.frequency * Math.cos(s.frequency * timestamp);
      const pitchFromVel = -velParamY * 45;
      const bankFromVel = velParamX * 140;

      // Integración del sistema masa-resorte-amortiguador
      [s.currentRotX, s.velRotX] = stepSpring(s.currentRotX, s.velRotX, s.targetRotX, dt);
      [s.currentRotY, s.velRotY] = stepSpring(s.currentRotY, s.velRotY, s.targetRotY, dt);
      [s.currentTransX, s.velTransX] = stepSpring(s.currentTransX, s.velTransX, s.targetTransX, dt);
      [s.currentTransZ, s.velTransZ] = stepSpring(s.currentTransZ, s.velTransZ, s.targetTransZ, dt);

      const totalX = s.currentTransX + paramX;
      const totalY = paramY;
      const totalZ = s.currentTransZ + paramZ;
      const totalRotX = s.currentRotX + pitchFromVel;
      const totalRotY = s.currentRotY + bankFromVel;

      // Aplicar transformación tridimensional al muñeco con aceleración por hardware
      if (dollRef.current) {
        dollRef.current.style.transform = `perspective(1000px) translate3d(${totalX.toFixed(1)}px, ${totalY.toFixed(1)}px, ${totalZ.toFixed(1)}px) rotateX(${totalRotX.toFixed(1)}deg) rotateY(${totalRotY.toFixed(1)}deg)`;
      }

      // Sombra en el suelo interactiva
      if (shadowRef.current) {
        const shadowScale = Math.max(0.65, Math.min(1.2, 0.95 - totalY * 0.018));
        const shadowAlpha = Math.max(0.2, Math.min(0.6, 0.45 + totalY * 0.012));
        shadowRef.current.style.transform = `translate3d(${(totalX * 0.4).toFixed(1)}px, 0, 0) scale(${shadowScale.toFixed(2)})`;
        shadowRef.current.style.opacity = shadowAlpha.toFixed(2);
      }
    };

    stateRef.current.animFrameId = requestAnimationFrame(updatePhysics);

    return () => {
      isRunning = false;
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutId) clearTimeout(scrollTimeoutId);
      if (observer) observer.disconnect();
      if (stateRef.current.animFrameId) {
        cancelAnimationFrame(stateRef.current.animFrameId);
      }
    };
  }, []);

  // Manejo de eventos del mouse para cálculo de vectores
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    // 1. Vector Origen O = (x0, y0) en el centro geométrico del contenedor
    const x0 = rect.left + rect.width / 2;
    const y0 = rect.top + rect.height / 2;

    // 2. Vector Posición del Mouse P = (xm, ym)
    const xm = e.clientX;
    const ym = e.clientY;

    // 3. Vector de Desplazamiento D = P - O
    const Dx = xm - x0;
    const Dy = ym - y0;

    // Distancia Euclidiana ||D|| = sqrt(Dx^2 + Dy^2)
    const distance = Math.hypot(Dx, Dy);
    const maxRadius = Math.hypot(rect.width / 2, rect.height / 2);
    const k = Math.min(1, distance / (maxRadius * 0.85)); // Factor de normalización

    // Vector Unitario u = D / ||D||
    const ux = distance > 0.001 ? Dx / distance : 0;
    const uy = distance > 0.001 ? Dy / distance : 0;

    // 4. Inclinación 3D y Parallax:
    // - Inclinación en X = -uy * thetaMax
    // - Inclinación en Y = ux * thetaMax
    const thetaMax = 18; // Grados máximos de rotación
    stateRef.current.targetRotX = -uy * k * thetaMax;
    stateRef.current.targetRotY = ux * k * thetaMax;
    stateRef.current.targetTransX = ux * k * 26; // Parallax lateral (px)
    stateRef.current.targetTransZ = (1 - k) * 35; // Profundidad Z (px)
  };

  const handleTouchMove = (e) => {
    if (!e.touches || !e.touches[0]) return;
    setIsHovered(true);
    handleMouseMove(e.touches[0]);
  };

  const handleTouchEnd = () => {
    handleMouseLeave();
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Retorno suave a posición de equilibrio en levitación
    stateRef.current.targetRotX = 0;
    stateRef.current.targetRotY = 0;
    stateRef.current.targetTransX = 0;
    stateRef.current.targetTransZ = 0;
  };

  const activeProduct = featuredProducts[currentIndex] || featuredProducts[0] || fallbackCatalog[0];
  const activeImage =
    activeProduct.image ||
    (activeProduct.images && activeProduct.images[0]) ||
    activeProduct.altImage ||
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className="relative z-10 w-full min-h-[440px] sm:min-h-[520px] flex flex-col items-center justify-center select-none touch-pan-y overflow-x-clip"
      style={{ perspective: '1200px' }}
    >
      {/* Luz volumétrica de fondo (Gradiente radial sin costo de Gaussian Blur en GPU móvil) */}
      <div
        className="absolute w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full pointer-events-none -z-10"
        style={{
          background: 'radial-gradient(circle, rgba(224, 20, 31, 0.28) 0%, rgba(224, 20, 31, 0.08) 45%, rgba(224, 20, 31, 0) 72%)',
        }}
      />

      {/* Sombra de suelo reactiva acelerada por GPU (translate3d + scale) */}
      <div
        ref={shadowRef}
        className="absolute bottom-6 w-48 sm:w-60 h-8 rounded-full pointer-events-none will-change-transform -z-10"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.3) 50%, rgba(0, 0, 0, 0) 75%)',
        }}
      />

      {/* Muñeco interactivo en levitación con física vectorial */}
      <div
        onClick={() => onSelectProduct && onSelectProduct(activeProduct)}
        className="cursor-pointer group relative flex items-center justify-center p-2"
        title="Toca para inspeccionar pieza en el taller"
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={activeProduct.id || currentIndex}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center w-[290px] h-[290px] sm:w-[370px] sm:h-[370px] md:w-[420px] md:h-[420px] relative"
          >
            <img
              ref={dollRef}
              src={activeImage}
              alt={activeProduct.title}
              decoding="async"
              className="w-full h-full object-contain will-change-transform pointer-events-none select-none"
              style={{
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Insignia HUD Flotante Minimalista */}
        <div className="absolute -bottom-2 sm:bottom-2 right-2 sm:right-6 z-20 bg-[#141313] sm:bg-[#141313]/95 border border-[#e0141f] px-3.5 py-2 sm:backdrop-blur-md shadow-[0_0_20px_rgba(224,20,31,0.35)] flex flex-col gap-0.5 group-hover:scale-105 transition-transform duration-300">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#ffb4ab] uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e0141f] animate-ping" />
            <span translate="no">
              {activeProduct.technique === 'punto_cruz'
                ? 'PUNTO CRUZ · GRÁFICO DMC'
                : 'AMIGURUMI · SERIE LIMITADA'}
            </span>
          </div>
          <div className="font-accent-tag text-xs sm:text-sm text-[#fff4f3] uppercase tracking-wider flex items-center gap-2">
            <span>{activeProduct.title}</span>
            <span className="text-[#e0141f] font-mono font-bold">
              {formatCOP(activeProduct.price)}
            </span>
          </div>
        </div>
      </div>

      {/* Controles accesibles de navegación entre piezas del showcase */}
      {featuredProducts.length > 1 && (
        <div className="flex items-center gap-2 sm:gap-3 mt-4 sm:mt-6 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length);
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#1c1a1a]/90 hover:bg-[#e0141f] text-neutral-400 hover:text-white border border-[#5e3f3c] transition-colors"
            aria-label="Pieza anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots indicadores con área táctil ampliada (min-h-[44px]) */}
          <div className="flex items-center gap-1">
            {featuredProducts.map((p, idx) => (
              <button
                key={p.id || idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className="min-w-[32px] sm:min-w-[40px] min-h-[44px] flex items-center justify-center group"
                aria-label={`Ver pieza ${idx + 1}`}
              >
                <span
                  className={`h-1.5 transition-all duration-300 block ${
                    currentIndex === idx
                      ? 'w-6 bg-[#e0141f]'
                      : 'w-2 bg-neutral-700 group-hover:bg-neutral-500'
                  }`}
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev + 1) % featuredProducts.length);
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center bg-[#1c1a1a]/90 hover:bg-[#e0141f] text-neutral-400 hover:text-white border border-[#5e3f3c] transition-colors"
            aria-label="Siguiente pieza"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
