import React from 'react';
import { useCart } from '../context/CartContext';
import { formatCOP } from '../utils/formatters';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CartDrawer = ({ onCheckout, onExploreCatalog }) => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  const shippingThreshold = 150000;
  const progressPercent = Math.min(100, (subtotal / shippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, shippingThreshold - subtotal);

  const handleBrowseCatalog = () => {
    setIsCartOpen(false);
    if (onExploreCatalog) {
      onExploreCatalog();
    }
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 240 }}
              className="w-screen max-w-md bg-[#1d1b1b] brutalist-border border-r-0 border-y-0 text-[#e6e1e1] shadow-2xl flex flex-col relative"
            >
              {/* Corner Tape */}
              <div className="tape-overlay !top-[-10px] !right-12 !left-auto">
                ARSENAL // CARRITO
              </div>

              {/* Header */}
              <div className="p-6 border-b border-[#5e3f3c] flex items-center justify-between bg-[#141313]">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-[#ffb4ab]" />
                  <h2 className="font-headline-md text-2xl uppercase tracking-wider text-[#e6e1e1]">
                    Tu Arsenal ({totalItems})
                  </h2>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="w-8 h-8 flex items-center justify-center border border-[#5e3f3c] hover:border-[#e0141f] hover:bg-[#e0141f] hover:text-white transition-colors"
                  aria-label="Cerrar carrito"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Free Shipping Tier */}
              <div className="p-4 bg-[#211f1f] border-b border-[#5e3f3c]/60 text-xs">
                <div className="flex justify-between font-label-caps text-[#c7c6c2] mb-1.5">
                  <span>
                    {remainingForFreeShipping === 0
                      ? '✓ DOMICILIO GRATIS DESBLOQUEADO'
                      : `AGREGA ${formatCOP(remainingForFreeShipping)} PARA DOMICILIO GRATIS`}
                  </span>
                  <span className="text-[#ffb4ab] font-bold">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full h-1.5 bg-[#141313] overflow-hidden">
                  <div
                    className="h-full bg-[#e0141f] transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Item List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    <div className="w-16 h-16 border-2 border-dashed border-[#5e3f3c] flex items-center justify-center text-[#5e3f3c]">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-headline-md text-xl text-[#e6e1e1] uppercase">Tu Arsenal está Vacío</p>
                      <p className="text-xs text-[#8a8a86] mt-1 font-mono">
                        Aún no has agregado artefactos de crochet a tu orden.
                      </p>
                    </div>
                    {/* Botón de exploración con redirección activa al catálogo */}
                    <button
                      type="button"
                      onClick={handleBrowseCatalog}
                      className="px-6 py-3 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-mono font-bold text-xs uppercase tracking-wider transition-all shadow-[4px_4px_0px_#000] flex items-center gap-2 group cursor-pointer"
                    >
                      <span>Explorar Catálogo</span>
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      key={`${item.id}-${item.size || ''}`}
                      className="flex gap-4 p-3 bg-[#141313] border border-[#5e3f3c] relative group hover:border-[#ffb4ab] transition-colors"
                    >
                      {/* Thumbnail */}
                      <div className="w-20 h-20 bg-[#28251f] shrink-0 border border-[#5e3f3c] overflow-hidden relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 transition-all"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-headline-md text-base text-[#e6e1e1] uppercase leading-none">
                              {item.title}
                            </h3>
                            <p className="text-[11px] font-mono text-[#8a8a86] mt-1">
                              TALLA: {item.size || 'MED'}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-[#8a8a86] hover:text-[#e0141f] p-1 transition-colors"
                            title="Eliminar artefacto"
                            aria-label="Eliminar artefacto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Stepper and Price */}
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center border border-[#5e3f3c] bg-[#211f1f]">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="px-2 py-0.5 text-xs text-[#e6e1e1] hover:text-[#ffb4ab] hover:bg-[#141313]"
                              aria-label="Disminuir cantidad"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 py-0.5 text-xs font-mono font-bold text-[#e6e1e1] min-w-5 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="px-2 py-0.5 text-xs text-[#e6e1e1] hover:text-[#ffb4ab] hover:bg-[#141313]"
                              aria-label="Aumentar cantidad"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-accent-tag text-sm text-[#ffb4ab]">
                            {formatCOP(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Summary & Checkout Footer */}
              {cart.length > 0 && (
                <div className="p-6 bg-[#141313] border-t border-[#5e3f3c] space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[#e7bcb8]/70">
                      <span>Subtotal</span>
                      <span className="font-mono text-[#e6e1e1] font-bold">{formatCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-[#e7bcb8]/70">
                      <span>Domicilio Personalizado</span>
                      <span className="font-mono text-[#e6e1e1]">
                        {remainingForFreeShipping === 0 ? 'GRATIS' : formatCOP(15000)}
                      </span>
                    </div>
                    <div className="flex justify-between text-base pt-2 border-t border-[#5e3f3c] font-bold">
                      <span className="font-headline-md uppercase text-[#e6e1e1]">Total a Pagar en Puerta</span>
                      <span className="font-headline-md text-2xl text-[#ffb4ab]">
                        {formatCOP(subtotal + (remainingForFreeShipping === 0 ? 0 : 15000))}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      onCheckout();
                    }}
                    className="w-full py-4 px-6 bg-[#e0141f] text-[#fff4f3] font-headline-md text-xl uppercase tracking-wider border-2 border-[#e0141f] hover:bg-transparent hover:text-[#ffb4ab] transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0px_#000] group cursor-pointer"
                  >
                    <span>Finalizar Pedido Contraentrega</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#8a8a86] font-mono uppercase">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#ffb4ab]" />
                    Despacho Táctico Contraentrega // Pago al Recibir en Mano
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
