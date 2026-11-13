import React, { useState, useEffect } from 'react';
import { trackOrder, reportOrderPayment } from '../services/api';
import { reportOrderPaymentInFirestore } from '../services/firebase';
import { PAYMENT_ACCOUNTS } from '../config/paymentConfig';
import { formatCOP, WHATSAPP_PHONE, WHATSAPP_PHONE_DISPLAY, generateWhatsAppTrackingUrl } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Search, 
  X, 
  Package, 
  Clock, 
  CheckCircle2, 
  MessageSquare, 
  Bike, 
  Sparkles,
  Phone,
  AlertCircle,
  Lock,
  Copy,
  ShieldCheck,
  Loader2,
  Banknote
} from 'lucide-react';

const TIMELINE_STEPS = [
  {
    key: 'ESPERANDO_PAGO',
    title: '1. Anticipo del 20% (Reserva de Materiales)',
    desc: 'Para pedidos desde $50.000 COP se valida el anticipo del 20% antes de asignar puesto en la cola.',
    icon: Lock,
  },
  {
    key: 'EN_COLA',
    title: '2. En Cola Oficial de Producción',
    desc: 'Anticipo verificado. Tu pedido tiene turno oficial asegurado en orden de llegada.',
    icon: CheckCircle2,
  },
  {
    key: 'EN_TALLER',
    title: '3. En Taller / Confección Artesanal',
    desc: 'Tu amigurumi está siendo tejido y detallado a mano junto con su certificado.',
    icon: Sparkles,
  },
  {
    key: 'EN_RUTA',
    title: '4. Entrega Personal Acordada',
    desc: 'Tu pedido está listo para entrega personal en mano.',
    icon: Bike,
  },
  {
    key: 'DELIVERED',
    title: '5. Entregado en Mano',
    desc: 'Recibiste tu pieza y cancelaste el saldo restante con éxito.',
    icon: Package,
  }
];

export const OrderTrackingModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isReporting, setIsReporting] = useState(false);

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
      setErrorMessage('Ingresa un número de orden o código de rastreo.');
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
      setErrorMessage('No pudimos localizar la orden. Verifica el código o escríbenos a WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReportRefInTracking = async (e) => {
    e.preventDefault();
    if (!order || isReporting) return;
    const cleanRef = paymentReference.trim().toUpperCase();
    if (!cleanRef || cleanRef.length < 4) {
      toast.warning('Ingresa un número de comprobante válido (mínimo 4 caracteres).');
      return;
    }

    setIsReporting(true);
    try {
      const updated = await reportOrderPayment(order.id, { paymentReference: cleanRef });
      await reportOrderPaymentInFirestore(order.id, { paymentReference: cleanRef });
      setOrder((prev) => ({
        ...prev,
        ...updated,
        paymentReference: cleanRef,
        paymentStatus: 'VERIFICANDO_ANTICIPO',
        status: 'VERIFICANDO_ANTICIPO',
      }));
      setPaymentReference('');
      toast.success('¡Comprobante registrado! Verificando ingreso en cuenta.');
    } catch (err) {
      toast.error(err.message || 'Error al registrar comprobante.');
    } finally {
      setIsReporting(false);
    }
  };

  const copyValue = (val, msg = 'Copiado al portapapeles') => {
    navigator.clipboard.writeText(String(val));
    toast.info(msg);
  };

  if (!isOpen) return null;

  const getStepIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('DELIVER') || s.includes('ENTREG')) return 4;
    if (s.includes('SHIP') || s.includes('RUTA') || s.includes('DISPATCH')) return 3;
    if (s.includes('PRODUCT') || s.includes('TALLER')) return 2;
    if (s === 'EN_COLA' || s === 'CONFIRMED' || s === 'PLACED') return 1;
    return 0; // ESPERANDO_PAGO o VERIFICANDO_ANTICIPO
  };

  const currentStepIdx = order ? getStepIndex(order.status) : 0;
  const orderTotal = Number(order?.total || order?.totalAmount || 0);
  const requiresDeposit = order?.requiresDeposit !== undefined ? Boolean(order.requiresDeposit) : orderTotal >= 50000;
  const depositAmount = Number(order?.depositRequiredAmount || order?.depositBaseAmount || (requiresDeposit ? Math.ceil(orderTotal * 0.20) : 0));
  const remainingBalance = Number(
    order?.remainingBalance !== undefined
      ? order.remainingBalance
      : orderTotal - (requiresDeposit ? Math.ceil(orderTotal * 0.20) : 0),
  );
  const statusUpper = String(order?.status || '').toUpperCase();

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
                [ RADAR DE DESPACHO & COLA EN VIVO ]
              </span>
              <h2 className="font-stencil text-xl sm:text-3xl uppercase text-white tracking-wide">
                Seguimiento de Pedido
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
                placeholder="Número de orden (ej. VS-...) o Código de Rastreo (KURO-TRK-...)"
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
                  {(order.trackingCode || order.trackingNumber) && (
                    <span className="text-neutral-500 ml-2">({order.trackingCode || order.trackingNumber})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-400">DESTINATARIO:</span>
                  <span className="text-white font-semibold">{order.customerName || order.customerData?.name}</span>
                </div>
              </div>

              {/* BLOQUE DINÁMICO SEGÚN ESTADO DEL ANTICIPO */}
              {statusUpper === 'ESPERANDO_PAGO' && (
                <div className="p-5 bg-[#141313] border-2 border-[#e0141f] space-y-4 font-mono text-xs">
                  <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-2">
                    <span className="text-[#ffb4ab] font-bold uppercase flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-[#e0141f]" />
                      ESTADO: ESPERANDO PAGO DEL ANTICIPO (20%)
                    </span>
                    {order.paymentStatus === 'RECHAZADO' && (
                      <span className="px-2 py-0.5 bg-red-900 text-white text-[10px] font-bold uppercase">
                        Comprobante anterior no válido
                      </span>
                    )}
                  </div>

                  <p className="text-neutral-300 leading-relaxed">
                    Para ingresar tu pedido a la cola oficial de producción, transfiere el monto exacto con identificador único y sube tu número de comprobante:
                  </p>

                  <div className="p-3 bg-[#1d1b1b] border border-[#25D366] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#25D366] uppercase block">Monto Exacto a Transferir (20% + ID):</span>
                      <strong className="text-2xl text-white font-headline-md">{formatCOP(depositAmount)}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyValue(depositAmount, 'Monto exacto copiado')}
                      className="px-3 py-2 bg-[#25D366] text-black font-bold uppercase text-[11px] flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" /> Copiar Valor
                    </button>
                  </div>

                  {/* Llaves para pagar */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {PAYMENT_ACCOUNTS.map((acc) => (
                      <div key={acc.id} className="p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] flex flex-col justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#ffb4ab] font-bold block">{acc.label}</span>
                          <strong className="text-sm text-[#25D366] block">{acc.key}</strong>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyValue(acc.key, `Llave ${acc.label} copiada`)}
                          className="w-full py-1 bg-[#262424] hover:bg-[#333030] text-white border border-neutral-600 text-[10px] uppercase font-bold flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3" /> Copiar Llave
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Formulario para subir referencia */}
                  <form onSubmit={handleReportRefInTracking} className="space-y-2 pt-2 border-t border-[#2b2929]">
                    <label className="text-[11px] text-[#ffb4ab] font-bold uppercase block">
                      ¿Ya transferiste? Ingresa el Número de Comprobante / Referencia:
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        required
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="Ej: M12948392"
                        className="flex-1 bg-[#0d0c0c] border border-[#5e3f3c] px-3 py-2.5 text-white uppercase outline-none focus:border-[#25D366]"
                      />
                      <button
                        type="submit"
                        disabled={isReporting}
                        className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold uppercase flex items-center justify-center gap-1.5 shrink-0"
                      >
                        {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                        <span>Reportar Comprobante</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {statusUpper === 'VERIFICANDO_ANTICIPO' && (
                <div className="p-5 bg-amber-950/30 border-2 border-amber-500/70 space-y-2 font-mono text-xs">
                  <div className="text-amber-300 font-bold uppercase flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>VERIFICANDO INGRESO DEL ANTICIPO</span>
                  </div>
                  <p className="text-neutral-200 leading-relaxed">
                    Recibimos tu reporte de pago por <strong className="text-white">{formatCOP(depositAmount)}</strong>
                    {order.paymentReference ? ` (Comprobante #${order.paymentReference})` : ''}. Estamos confirmando el ingreso del dinero en la cuenta para asignarte tu puesto en la cola.
                  </p>
                </div>
              )}

              {(statusUpper === 'EN_COLA' || statusUpper === 'CONFIRMED' || statusUpper === 'IN_PRODUCTION' || statusUpper === 'SHIPPED' || statusUpper === 'DELIVERED') && (
                <div className="p-4 bg-emerald-950/30 border-2 border-[#25D366] space-y-2 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#25D366] font-bold uppercase flex items-center gap-1.5 text-sm">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {requiresDeposit
                          ? '✓ ANTICIPO DEL 20% VERIFICADO // EN COLA OFICIAL'
                          : '✓ PEDIDO EN COLA OFICIAL DE PRODUCCIÓN'}
                      </span>
                    </span>
                    {order.queuedAt && (
                      <span className="text-[10px] text-neutral-400">
                        Ingreso a cola: {new Date(order.queuedAt).toLocaleString('es-CO')}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-300">
                    Tu muñeco está agendado en la fila del taller. El{' '}
                    <strong className="text-emerald-400">saldo restante ({formatCOP(remainingBalance)})</strong> se paga únicamente el día de la entrega.
                  </p>
                </div>
              )}

              {/* Step Timeline */}
              <div className="space-y-4 px-2">
                <span className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider block font-bold">
                  PROGRESO DE TU ORDEN:
                </span>
                
                <div className="relative pl-6 sm:pl-8 border-l-2 border-neutral-800 space-y-6">
                  {TIMELINE_STEPS.map((step, idx) => {
                    const isCompleted = idx <= currentStepIdx;
                    const isCurrent = idx === currentStepIdx;
                    const StepIcon = step.icon;

                    return (
                      <div key={step.key} className="relative group">
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                            isCompleted
                              ? 'bg-[#25D366] border-[#25D366] text-black shadow-[0_0_12px_rgba(37,211,102,0.5)]'
                              : 'bg-[#171515] border-neutral-700 text-neutral-600'
                          }`}
                        >
                          <StepIcon className="w-3.5 h-3.5" />
                        </div>

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
                              <span className="text-[10px] font-mono px-2 py-0.5 bg-[#e0141f] text-white font-bold uppercase rounded-sm">
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

              {/* Items & Payment Summary */}
              <div className="p-4 bg-[#111010] border border-[#5e3f3c] text-xs font-mono space-y-2">
                <div className="flex justify-between text-neutral-400">
                  <span>Dirección Registrada:</span>
                  <span className="text-neutral-200 text-right">{order.address || order.customerData?.shippingAddress}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Valor Total del Pedido:</span>
                  <span className="text-white font-bold">{formatCOP(orderTotal)}</span>
                </div>
                {requiresDeposit && (
                  <div className="flex justify-between text-neutral-400">
                    <span>Anticipo Requerido (20%):</span>
                    <span className="text-[#ffb4ab] font-bold">
                      {formatCOP(depositAmount)} ({order.paymentStatus || 'PENDIENTE'})
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-neutral-800 text-sm">
                  <span className="text-white font-bold">Saldo Restante a Pagar en la Entrega (80%):</span>
                  <span className="text-emerald-400 font-bold text-base">{formatCOP(remainingBalance)}</span>
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
                  <span>Hablar con el Taller por WhatsApp</span>
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
