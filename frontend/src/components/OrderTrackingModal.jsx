import React, { useState, useEffect } from 'react';
import { trackOrder } from '../services/api';
import { formatCOP, WHATSAPP_PHONE, WHATSAPP_PHONE_DISPLAY, generateWhatsAppTrackingUrl } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Package, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  MessageSquare, 
  Bike, 
  Sparkles,
  Phone,
  AlertCircle
} from 'lucide-react';

const TIMELINE_STEPS = [
  {
    key: 'CONFIRMED',
    title: 'Pedido Confirmado',
    desc: 'Orden contraentrega registrada. El artesano revisó los detalles.',
    icon: CheckCircle2,
    color: '#25D366'
  },
  {
    key: 'EN_TALLER',
    title: 'En Taller / Confección',
    desc: 'Tu amigurumi está siendo detallado y empacado con su certificado de autenticidad.',
    icon: Sparkles,
    color: '#ffb4ab'
  },
  {
    key: 'EN_RUTA',
    title: 'En Ruta // Entrega Personal',
    desc: 'El artesano o domiciliario va en camino a tu dirección. Te escribirá antes de llegar.',
    icon: Bike,
    color: '#e0141f'
  },
  {
    key: 'DELIVERED',
    title: 'Entregado en Mano',
    desc: 'Revisaste tu pieza y pagaste contraentrega con éxito.',
    icon: Package,
    color: '#25D366'
  }
];

export const OrderTrackingModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-search last order from localStorage if available
  useEffect(() => {
    if (isOpen) {
      try {
        const last = localStorage.getItem('kuropunk_last_order');
        if (last) {
          const parsed = JSON.parse(last);
          if (parsed && (parsed.id || parsed.trackingCode)) {
            setSearchQuery(parsed.id || parsed.trackingCode);
            handleSearch(parsed.id || parsed.trackingCode);
          }
        }
      } catch (e) {}
    }
  }, [isOpen]);

  const handleSearch = async (queryToSearch) => {
    const q = (queryToSearch || searchQuery).trim();
    if (!q) {
      setErrorMessage('Ingresa un número de orden o tu número de celular.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await trackOrder(q);
      if (res) {
        setOrder(res);
      } else {
        setErrorMessage('No encontramos ningún pedido activo con esos datos.');
      }
    } catch (err) {
      setErrorMessage('No pudimos localizar la orden. Verifica los datos o escríbenos a WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  // Determine current step index across both Firestore and Backend state strings
  const getStepIndex = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('deliver') || s.includes('entreg')) return 3;
    if (s.includes('ship') || s.includes('ruta') || s.includes('camino') || s.includes('despach')) return 2;
    if (s.includes('product') || s.includes('taller') || s.includes('prepar') || s.includes('confecc')) return 1;
    return 0;
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;

  return (
    <AnimatePresence>
      <div data-lenis-prevent="true" className="fixed inset-0 z-50 overflow-y-auto flex items-start sm:items-center justify-center p-2.5 sm:p-4 overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          data-lenis-prevent="true"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-2xl bg-[#171515] brutalist-border staple-corner shadow-2xl p-4 sm:p-8 text-[#e6e1e1] z-10 space-y-5 my-auto max-h-[92dvh] overflow-y-auto custom-scrollbar"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-[#5e3f3c] pb-4">
            <div>
              <span className="font-mono text-xs text-[#25D366] font-bold uppercase tracking-widest block">
                [ RADAR DE DESPACHO EN VIVO ]
              </span>
              <h2 className="font-stencil text-xl sm:text-3xl uppercase text-white tracking-wide">
                Rastreo de Pedido Contraentrega
              </h2>
            </div>
            <button
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-white border border-[#5e3f3c] hover:border-[#e0141f] transition-colors shrink-0"
              aria-label="Cerrar modal de rastreo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-grow">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Número de orden (ej. VS-592812) o tu Celular..."
                className="w-full bg-[#0d0c0c] border border-[#5e3f3c] pl-10 pr-4 py-3 text-base sm:text-xs font-mono text-white outline-none focus:border-[#25D366] transition-colors min-h-[44px]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="min-h-[44px] px-6 py-3 bg-[#e0141f] hover:bg-red-700 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center shrink-0"
            >
              {isLoading ? 'Rastreando...' : 'Buscar Pedido'}
            </button>
          </form>

          {errorMessage && (
            <div className="p-3 bg-red-950/40 border border-red-800/80 text-xs font-mono text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Order Details & Timeline */}
          {order && (
            <div className="space-y-6 pt-2">
              {/* Top Banner */}
              <div className="p-4 bg-[#111010] border border-[#5e3f3c] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-mono">
                <div>
                  <span className="text-neutral-400">ORDEN:</span>{' '}
                  <span className="text-[#ffb4ab] font-bold text-sm">#{order.id}</span>
                  {order.trackingCode && (
                    <span className="text-neutral-500 ml-2">({order.trackingCode})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">DESTINATARIO:</span>
                  <span className="text-white font-semibold">{order.customerName}</span>
                </div>
              </div>

              {/* Step Timeline */}
              <div className="space-y-4 px-2">
                <span className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider block font-bold">
                  LÍNEA DE TIEMPO DE TU ENTREGA PERSONAL:
                </span>
                
                <div className="relative pl-6 sm:pl-8 border-l-2 border-neutral-800 space-y-6">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="relative group">
                        {/* Dot indicator */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? 'bg-[#25D366] border-[#25D366] text-black shadow-[0_0_12px_rgba(37,211,102,0.5)]'
                              : 'bg-[#171515] border-neutral-700 text-neutral-600'
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>

                        {/* Step Content */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-headline-md text-base sm:text-lg uppercase tracking-wide ${
                                isCompleted ? 'text-white' : 'text-neutral-500'
                              }`}
                            >
                              {step.title}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#e0141f] text-white font-bold uppercase rounded-sm animate-pulse">
                                Estado Actual
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-neutral-400 leading-relaxed">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items & Payment Info */}
              <div className="p-4 bg-[#111010] border border-[#5e3f3c] text-xs font-mono space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Dirección Registrada:</span>
                  <span className="text-neutral-200 text-right">{order.address} ({order.city})</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Método de Pago:</span>
                  <span className="text-emerald-400 font-bold">Contraentrega (Paga al recibir en mano)</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-800 text-sm">
                  <span className="text-white font-bold">Total a Pagar en la Entrega:</span>
                  <span className="text-[#ffb4ab] font-bold text-base">{formatCOP(order.total)}</span>
                </div>
              </div>

              {/* WhatsApp Live Support Button */}
              <div className="pt-2">
                <a
                  href={generateWhatsAppTrackingUrl(order.id, order.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20ba59] text-black font-headline-md text-sm sm:text-base md:text-lg uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2.5 shadow-lg active:scale-[0.99] text-center"
                >
                  <MessageSquare className="w-5 h-5 fill-black shrink-0" />
                  <span>Hablar con el Artesano por WhatsApp</span>
                </a>
              </div>
            </div>
          )}

          {/* Quick Help Footer */}
          {!order && (
            <div className="p-4 bg-[#111010] border border-neutral-800 text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>¿Tienes dudas con tu pedido?</span>
              <a
                href={`https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent('🧶 *KUROPUNK* | *Atención al Cliente*\n\n¡Hola equipo KuroPunk! Tengo una consulta sobre una entrega.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#25D366] hover:underline flex items-center gap-1 font-bold"
              >
                <Phone className="w-3.5 h-3.5" /> Chatear al {WHATSAPP_PHONE_DISPLAY}
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
