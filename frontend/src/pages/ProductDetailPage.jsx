import React, { useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';
import { useCart } from '../context/CartContext';
import { formatCOP, WHATSAPP_PHONE_DISPLAY } from '../utils/formatters';
import { downloadPatternPDF } from '../utils/downloadPdf';
import { getProductReviews, submitReview } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Heart, 
  ShieldCheck, 
  Check, 
  ArrowLeft, 
  Share2, 
  Sparkles, 
  Download, 
  ZoomIn, 
  Flame, 
  Star,
  FileText,
  Bell,
  MessageSquare,
  Send,
  User,
  Hammer,
  Layers,
  Scissors
} from 'lucide-react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import { CrossStitchViewerModal } from '../components/CrossStitchViewerModal';
import { WorkshopHUDModal } from '../components/WorkshopHUDModal';
import { AuthenticityModal } from '../components/AuthenticityModal';

export const ProductDetailPage = ({ product, onSelectProduct, onBackToShop }) => {
  const { addToCart, showToast, toggleWishlist, isInWishlist } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(
    product?.image || product?.imageUrl || (product?.images && product?.images[0]) || PRODUCTS[0].image
  );
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Modals de Módulos Artesanales
  const [isCrossStitchOpen, setIsCrossStitchOpen] = useState(false);
  const [isWorkshopHUDOpen, setIsWorkshopHUDOpen] = useState(false);
  const [isAuthenticityOpen, setIsAuthenticityOpen] = useState(false);

  // Restock modal state
  const [isRestockOpen, setIsRestockOpen] = useState(false);
  const [restockEmail, setRestockEmail] = useState('');

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  if (!product) {
    product = PRODUCTS.find((p) => p.isActive !== false) || PRODUCTS[0];
  }

  const isSoldOut = product.badge === 'SOLD OUT' || product.badge === 'AGOTADO' || product.badgeType === 'sold-out' || product.stock === 0;
  const isDigitalPattern = product.type === 'patron' || product.type === 'punto_cruz' || product.category === 'Punto Cruz';
  const isCrossStitch = product.technique === 'punto_cruz' || product.category === 'Punto Cruz' || product.type === 'punto_cruz';
  const moreDrops = PRODUCTS.filter((p) => p.isActive !== false && p.id !== product.id).slice(0, 4);
  const isWishlisted = isInWishlist(product.id);

  // Modo Coleccionable Físico (única opción activa por solicitud de tienda)
  const loadoutTier = 'finished';
  const effectivePrice = product.price;

  useEffect(() => {
    setQuantity(1);
    const primaryImg =
      product?.image ||
      product?.imageUrl ||
      (product?.images && product?.images[0]) ||
      PRODUCTS[0].image;
    if (primaryImg) {
      setActiveImage(primaryImg);
    }
    // Load reviews
    let isMounted = true;
    setIsLoadingReviews(true);
    getProductReviews(product.id).then((res) => {
      if (isMounted) {
        setReviews(res || []);
        setIsLoadingReviews(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [product]);

  const handleAddToCart = () => {
    if (isSoldOut) {
      setIsRestockOpen(true);
      return;
    }
    addToCart(
      { ...product, price: product.price },
      quantity,
      { tier: 'finished', tierLabel: 'Coleccionable Terminado (Hecho a mano)' }
    );
  };

  const handleDownload = () => {
    try {
      downloadPatternPDF(product);
      showToast(`DESCARGANDO PATRÓN DIGITAL · ${product.title.toUpperCase()}`, "success");
    } catch (err) {
      showToast("ERROR AL GENERAR EL DOCUMENTO PDF", "error");
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("ENLACE DEL PRODUCTO COPIADO AL PORTAPAPELES", "info");
    }
  };

  const handleRestockSubmit = (e) => {
    e.preventDefault();
    if (!restockEmail) return;
    showToast(`ALERTA PROGRAMADA PARA: ${restockEmail.toUpperCase()}`, "success");
    setIsRestockOpen(false);
    setRestockEmail('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!newReviewAuthor.trim() || !newReviewComment.trim()) {
      showToast("POR FAVOR COMPLETA TU NOMBRE Y COMENTARIO", "warning");
      return;
    }

    setIsSubmittingReview(true);
    const newRev = await submitReview({
      productId: product.id,
      author: newReviewAuthor.trim(),
      rating: newReviewRating,
      comment: newReviewComment.trim(),
      verifiedBuyer: true,
    });

    setReviews([newRev, ...reviews]);
    setIsSubmittingReview(false);
    setNewReviewAuthor('');
    setNewReviewComment('');
    showToast("¡GRACIAS POR TU OPINIÓN! RESEÑA PUBLICADA", "success");
  };

  const primaryProductImage =
    product.image ||
    product.imageUrl ||
    (product.images && product.images[0]) ||
    PRODUCTS[0].image;
  const secondaryProductImage =
    product.altImage ||
    (product.images && product.images.length > 1 ? product.images[1] : null);

  const galleryImages = [
    { src: primaryProductImage },
    ...(secondaryProductImage ? [{ src: secondaryProductImage }] : [])
  ];

  return (
    <div className="w-full pt-4 pb-32 sm:pb-24 bg-[#080808] relative min-h-screen text-neutral-200">
      
      {/* Lightbox Modal for HD Inspection */}
      <Lightbox
        open={isLightboxOpen}
        close={() => setIsLightboxOpen(false)}
        slides={galleryImages}
        plugins={[Zoom]}
        zoom={{ maxZoomPixelRatio: 3 }}
      />

      {/* Top Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 pt-2 pb-6 flex justify-between items-center">
        <button
          onClick={onBackToShop}
          className="flex items-center gap-2 font-mono text-xs text-neutral-400 hover:text-white transition-colors uppercase tracking-wider group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Volver al Catálogo Bóveda</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 font-mono text-xs text-neutral-400 hover:text-[#ffb4ab] transition-colors border border-neutral-800 px-3 py-1.5 bg-[#121212]"
          title="Compartir Producto"
        >
          <Share2 className="w-3.5 h-3.5 text-[#e0141f]" />
          <span>COMPARTIR</span>
        </button>
      </div>

      {/* Main Product Layout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left Column: Media Stage (7 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-7 flex flex-col gap-4 relative"
        >
          <div 
            onClick={() => setIsLightboxOpen(true)}
            className="relative w-full aspect-[4/3] sm:aspect-square bg-[#0e0e0e] border border-neutral-800 p-6 flex items-center justify-center group overflow-hidden shadow-2xl cursor-zoom-in"
          >
            {/* Tag / Badge */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-1.5">
              {product.badge && (
                <span className={`text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 font-bold ${
                  product.badge === 'LIMITED DROP' || product.badge === 'EDICIÓN LIMITADA' || product.badge === 'FLAGSHIP'
                    ? 'bg-[#FF0033] text-white shadow-lg'
                    : product.badge === 'SOLD OUT' || product.badge === 'AGOTADO' || product.badgeType === 'sold-out'
                    ? 'bg-neutral-900 text-[#FF0033] border border-[#FF0033]'
                    : product.badge === 'NEW' || product.badge === 'NUEVO'
                    ? 'bg-white text-black font-bold'
                    : product.badge === 'HOT' || product.badge === 'DESTACADO' || product.badge === 'LAST ONE' || product.badge === 'ÚLTIMA UNIDAD'
                    ? 'bg-amber-600 text-white font-bold'
                    : 'bg-neutral-900 text-neutral-200 border border-neutral-700'
                }`}>
                  {product.badge} {product.badgeVol ? `· ${product.badgeVol}` : ''}
                </span>
              )}
            </div>

            {/* Zoom Tooltip */}
            <div className="absolute top-4 right-4 z-20 bg-black/70 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-neutral-400 border border-neutral-800 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-3.5 h-3.5 text-[#FF0033]" />
              <span>ZOOM HD (CLICK)</span>
            </div>

            {/* Main Stage Image */}
            <img
              src={activeImage}
              alt={product.title}
              className="w-full h-full object-contain filter contrast-125 group-hover:scale-105 transition-transform duration-700 ease-out z-10"
            />

            {/* Subtle red bottom glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#FF0033]/10 to-transparent pointer-events-none"></div>
          </div>

          {/* Alternate angle thumbnails */}
          {product.altImage && (
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setActiveImage(product.image)}
                className={`w-20 h-20 bg-[#0e0e0e] border ${
                  activeImage === product.image ? 'border-[#FF0033]' : 'border-neutral-800 hover:border-neutral-600'
                } p-1 overflow-hidden transition-all`}
              >
                <img src={product.image} alt="Angle 1" className="w-full h-full object-contain" />
              </button>
              <button
                onClick={() => setActiveImage(product.altImage)}
                className={`w-20 h-20 bg-[#0e0e0e] border ${
                  activeImage === product.altImage ? 'border-[#FF0033]' : 'border-neutral-800 hover:border-neutral-600'
                } p-1 overflow-hidden transition-all`}
              >
                <img src={product.altImage} alt="Angle 2" className="w-full h-full object-contain" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Column: Commercial & Dossier Specs (5 cols) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="lg:col-span-5 flex flex-col justify-center gap-6 relative"
        >
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-mono text-xs text-[#FF0033] tracking-widest uppercase font-semibold">
                SKU: {product.sku}
              </span>
              {product.edition && (
                <span className="font-mono text-xs text-neutral-500">
                  {product.edition}
                </span>
              )}
            </div>

            <h1 className="font-headline-lg text-4xl sm:text-5xl text-white uppercase tracking-tight leading-tight">
              {product.title}
            </h1>

            {/* Ratings */}
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
              <span className="text-[#FF0033] flex items-center font-bold">
                ★ {product.rating ? product.rating.toFixed(1) : '5.0'}
              </span>
              <span>•</span>
              <span>{reviews.length || product.reviewsCount || 1} valoraciones certificadas</span>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pt-2">
              <span className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                {formatCOP(effectivePrice)}
              </span>
              {product.originalPrice && (
                <span className="text-sm font-mono text-neutral-500 line-through">
                  {formatCOP(product.originalPrice)}
                </span>
              )}
              <span className="font-mono text-xs text-neutral-400 ml-auto">
                PAGO CONTRAENTREGA DISPONIBLE
              </span>
            </div>

            {/* Cash on Delivery Trust Tag */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#161414] border-l-2 border-[#FF0033] text-xs font-mono text-neutral-300">
              <span className="text-[#FF0033] font-bold">✓ PAGO AL RECIBIR:</span>
              <span>Pagas en efectivo, Nequi o Daviplata en mano al recibir tu paquete.</span>
            </div>
          </div>

          {/* Badge Informativo: Coleccionable Artesanal */}
          <div className="flex items-center justify-between p-3 bg-[#121010] border border-neutral-800 text-xs font-mono shadow-md">
            <span className="text-[#ffb4ab] font-bold uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#e0141f]" /> ARTEFACTO ARTESANAL · EDICIÓN FÍSICA
            </span>
            <span className="text-neutral-300 text-[11px] font-bold bg-neutral-900 px-2.5 py-1 border border-neutral-700">
              COLECCIONABLE TERMINADO
            </span>
          </div>

          {/* Dossier Specifications Box */}
          <div className="space-y-3 bg-[#0e0e0e] p-5 border border-neutral-800 relative shadow-xl">
            <p className="text-sm font-body-md text-neutral-300 leading-relaxed relative z-10">
              {product.description}
            </p>

            {/* Technical Specs Checklist */}
            <ul className="text-xs text-neutral-400 space-y-2 pt-3 border-t border-neutral-800 relative z-10 font-mono">
              {product.yarn && (
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span><strong className="text-neutral-200">LANA:</strong> {product.yarn}</span>
                </li>
              )}
              {product.height && (
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span><strong className="text-neutral-200">ALTURA / TAMAÑO:</strong> {product.height}</span>
                </li>
              )}
              {product.fabric && (
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span><strong className="text-neutral-200">TELA:</strong> {product.fabric}</span>
                </li>
              )}
              {product.gridSize && (
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span><strong className="text-neutral-200">GRILLA:</strong> {product.gridSize}</span>
                </li>
              )}
              {product.hookSize && (
                <li className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span><strong className="text-neutral-200">AGUJA / HOOK:</strong> {product.hookSize}</span>
                </li>
              )}
              {product.specs && product.specs.slice(0, 3).map((spec, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-2.5 h-px bg-[#FF0033]"></span>
                  <span>{spec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* HERRAMIENTAS INTERACTIVAS ARTESANALES (VISOR DMC) */}
          {isCrossStitch && (
            <div className="w-full">
              <button
                type="button"
                onClick={() => setIsCrossStitchOpen(true)}
                className="w-full p-3 bg-[#171414] hover:bg-[#251b1b] border border-[#e0141f] text-[#ffb4ab] hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group"
              >
                <Layers className="w-4 h-4 text-[#e0141f] group-hover:scale-110 transition-transform" />
                <span>VISOR DMC & GRILLA DE BORDADO</span>
              </button>
            </div>
          )}

          {/* Actions: Quantity + Add To Cart / Download PDF + Wishlist */}
          <div className="flex flex-col gap-3 p-4 bg-[#0e0e0e] border border-neutral-800">
            {!isSoldOut && loadoutTier !== 'digital' && (
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                <span className="font-mono text-xs text-neutral-400 uppercase">Cantidad</span>
                <div className="flex items-center border border-neutral-700 bg-[#141414]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Disminuir cantidad"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-base text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="w-11 h-11 flex items-center justify-center font-mono text-sm font-bold text-white">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.min(product.stock ?? 10, q + 1))}
                    aria-label="Aumentar cantidad"
                    className="w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center text-base text-neutral-200 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            {isSoldOut ? (
              <button
                onClick={() => setIsRestockOpen(true)}
                className="w-full py-4 px-6 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest bg-[#1a1818] border-2 border-[#e0141f] text-[#ffb4ab] hover:bg-[#e0141f] hover:text-white transition-all flex items-center justify-center gap-2.5 shadow-lg"
              >
                <Bell className="w-4 h-4" />
                <span>NOTIFICARME EN EL PRÓXIMO DROP</span>
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full py-4 px-6 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest bg-[#FF0033] hover:bg-red-700 text-white transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.98]"
              >
                <span>AGREGAR AL CARRITO</span>
                <ShoppingCart className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => toggleWishlist(product.id, product.title)}
              className={`w-full min-h-[44px] py-2.5 px-6 font-mono text-xs uppercase tracking-wider border transition-colors flex justify-center items-center gap-2 ${
                isWishlisted
                  ? 'bg-white text-black border-white font-bold'
                  : 'bg-transparent text-neutral-400 border-neutral-800 hover:text-white hover:border-neutral-600'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-black' : ''}`} />
              <span>{isWishlisted ? 'Guardado en Favoritos' : 'Agregar a Lista de Deseos'}</span>
            </button>
          </div>

          {/* Restock Notification Dropdown */}
          <AnimatePresence>
            {isRestockOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-[#141313] border border-[#e0141f]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs text-[#ffb4ab] font-bold uppercase flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-[#e0141f]" /> Radar de Restock Activado
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsRestockOpen(false)}
                    aria-label="Cerrar radar de restock"
                    className="w-11 h-11 -mr-2 -mt-2 flex items-center justify-center text-sm text-neutral-400 hover:text-white transition-colors"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-xs text-neutral-400 mb-3 font-mono">
                  Te enviaremos una señal encriptada antes de que este lote se vuelva a liberar al público.
                </p>
                <form onSubmit={handleRestockSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="email"
                    required
                    placeholder="tu-correo@operativo.com"
                    value={restockEmail}
                    onChange={(e) => setRestockEmail(e.target.value)}
                    className="flex-grow bg-[#0c0c0c] border border-neutral-700 px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] font-mono text-white outline-none focus:border-[#e0141f]"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-5 py-2.5 bg-[#e0141f] text-white font-mono text-xs uppercase font-bold hover:bg-red-700 active:scale-95 transition-all"
                  >
                    Activar
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authenticity Certificate Guarantee (Clickable para abrir modal) */}
          <button
            type="button"
            onClick={() => setIsAuthenticityOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-[#0c0c0c] hover:bg-[#181414] border border-neutral-800 hover:border-[#FF0033] text-xs font-mono text-neutral-400 hover:text-white transition-all group"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-[#FF0033] shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-left font-bold text-neutral-200 group-hover:text-white">
                CERTIFICADO DE AUTENTICIDAD · VERIFICAR EN BÓVEDA
              </span>
            </div>
            <span className="text-[10px] text-[#ffb4ab] border border-[#5e3f3c] px-2 py-0.5">
              CONSULTAR SKU &rarr;
            </span>
          </button>
        </motion.div>
      </section>

      {/* Reviews & Social Proof Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 mt-20 pt-12 border-t border-neutral-900">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Reviews List (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div>
                <span className="font-mono text-xs text-[#FF0033] uppercase tracking-widest">
                  [ EVALUACIONES DE CAMPO ]
                </span>
                <h3 className="font-headline-md text-2xl text-white uppercase mt-1">
                  Reseñas Verificadas ({reviews.length})
                </h3>
              </div>
            </div>

            {isLoadingReviews ? (
              <p className="font-mono text-xs text-neutral-500 py-6">Decodificando transmisiones...</p>
            ) : reviews.length === 0 ? (
              <p className="font-mono text-xs text-neutral-500 py-6">Aún no hay valoraciones para este drop. Sé el primer operativo en dejar una.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev, i) => (
                  <div key={rev.id || i} className="p-4 bg-[#0e0e0e] border border-neutral-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center text-xs text-[#ffb4ab] font-bold">
                          {rev.author ? rev.author[0].toUpperCase() : 'O'}
                        </span>
                        <span className="font-mono text-xs font-bold text-neutral-200">
                          {rev.author}
                        </span>
                        {rev.verifiedBuyer && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 bg-[#FF0033]/20 text-[#ffb4ab] border border-[#FF0033]/40">
                            COMPRA CERTIFICADA
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#e0141f]">
                        {'★'.repeat(rev.rating || 5)}{'☆'.repeat(5 - (rev.rating || 5))}
                      </div>
                    </div>
                    <p className="text-xs font-body-md text-neutral-300 leading-relaxed">
                      "{rev.comment}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leave a Review Form (5 cols) */}
          <div className="lg:col-span-5 bg-[#0e0e0e] border border-neutral-800 p-6 space-y-4">
            <h4 className="font-headline-md text-xl text-white uppercase tracking-wider">
              Transmitir Valoración
            </h4>
            <p className="text-xs font-mono text-neutral-400">
              ¿Recibiste esta pieza? Registra tu evaluación sobre la tensión del tejido, acabados y empaque.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
              <div>
                <label className="font-mono text-xs text-[#ffb4ab] uppercase block mb-1">
                  Tu Alias / Nombre
                </label>
                <input
                  type="text"
                  required
                  placeholder="Operative_88"
                  value={newReviewAuthor}
                  onChange={(e) => setNewReviewAuthor(e.target.value)}
                  className="w-full bg-[#141414] border border-neutral-800 px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] font-mono text-white outline-none focus:border-[#e0141f] transition-colors"
                />
              </div>

              <div>
                <label className="font-mono text-xs text-[#ffb4ab] uppercase block mb-1">
                  Puntuación (1 a 5 Estrellas)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewReviewRating(star)}
                      aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
                      className={`w-11 h-11 min-w-[44px] min-h-[44px] flex items-center justify-center font-mono text-sm border transition-all active:scale-95 ${
                        newReviewRating >= star
                          ? 'bg-[#e0141f] text-white border-[#e0141f]'
                          : 'bg-[#141414] text-neutral-500 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono text-xs text-[#ffb4ab] uppercase block mb-1">
                  Comentario Técnico
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detalla la calidad del crochet o gráfico..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full bg-[#141414] border border-neutral-800 px-3.5 py-2.5 text-base sm:text-xs min-h-[96px] font-body-md text-white outline-none focus:border-[#e0141f] resize-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full min-h-[44px] py-3 bg-[#ffb4ab] hover:bg-[#e0141f] text-[#690006] hover:text-white font-mono text-xs uppercase font-bold tracking-wider transition-colors flex items-center justify-center gap-2 active:scale-95"
              >
                <span>{isSubmittingReview ? 'TRANSMITIENDO...' : 'PUBLICAR RESEÑA'}</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </section>

      {/* More Drops Recommended Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 mt-20 pt-12 border-t border-neutral-900">
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="font-mono text-xs text-[#FF0033] uppercase tracking-widest">
              [ ARSENAL RECOMENDADO ]
            </span>
            <h2 className="font-headline-lg text-3xl sm:text-4xl text-white uppercase mt-1">
              Más Lanzamientos
            </h2>
          </div>
          <button
            onClick={onBackToShop}
            className="font-mono text-xs text-neutral-400 hover:text-white uppercase tracking-wider"
          >
            Ver Todo &rarr;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {moreDrops.map((drop) => (
            <div
              key={drop.id}
              onClick={() => {
                onSelectProduct(drop);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="group cursor-pointer bg-[#0e0e0e] border border-neutral-800/80 hover:border-neutral-600 p-3 transition-all"
            >
              <div className="w-full aspect-[4/5] bg-[#141414] overflow-hidden mb-3">
                <img
                  src={drop.image}
                  alt={drop.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="text-[10px] font-mono text-neutral-500 uppercase">{drop.sku}</div>
              <h4 className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors line-clamp-1">
                {drop.title}
              </h4>
              <div className="text-sm font-semibold text-white mt-1">{formatCOP(drop.price)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Visor Táctico de Punto de Cruz (DMC) */}
      <CrossStitchViewerModal
        isOpen={isCrossStitchOpen}
        onClose={() => setIsCrossStitchOpen(false)}
        productTitle={product.title}
      />

      {/* HUD Modo Taller // Contador de Vueltas */}
      <WorkshopHUDModal
        isOpen={isWorkshopHUDOpen}
        onClose={() => setIsWorkshopHUDOpen(false)}
        currentPatternTitle={product.title}
      />

      {/* Verificador de Certificado de Autenticidad */}
      <AuthenticityModal
        isOpen={isAuthenticityOpen}
        onClose={() => setIsAuthenticityOpen(false)}
        initialSerial={product.sku || 'RX-00-042'}
      />

      {/* Floating Mobile Bottom Action Bar (Safe Area & Thumb Friendly) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0e0e0e]/95 backdrop-blur-md border-t border-neutral-800 p-3 sm:hidden pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between gap-3 shadow-[0_-4px_25px_rgba(0,0,0,0.85)]">
        <div className="flex flex-col min-w-0 pr-2">
          <span className="text-[10px] font-mono text-neutral-400 uppercase truncate">
            {product.title}
          </span>
          <span className="text-base font-bold text-white font-mono tracking-tight">
            {formatCOP(effectivePrice)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          className="shrink-0 min-h-[44px] px-5 py-2.5 bg-[#FF0033] hover:bg-red-700 text-white font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>{isSoldOut ? 'AVISARME' : 'AGREGAR'}</span>
        </button>
      </div>

    </div>
  );
};
