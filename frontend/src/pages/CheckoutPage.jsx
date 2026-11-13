import React, { useState, useMemo, useCallback, useRef } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder, reportOrderPayment, trackOrder } from '../services/api';
import {
  createFirestoreOrder,
  reportOrderPaymentInFirestore,
  compressImageToDataUrl,
  subscribeToOrderById,
} from '../services/firebase';
import { DEPOSIT_THRESHOLD_COP, PAYMENT_ACCOUNTS } from '../config/paymentConfig';
import { AuthGuard } from '../guards/AuthGuard';
import { downloadReceiptPDF } from '../utils/downloadPdf';
import { formatCOP, generateWhatsAppOrderUrl } from '../utils/formatters';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Printer, 
  Truck, 
  MapPin, 
  Banknote, 
  Loader2,
  MessageSquare,
  AlertTriangle,
  Lock,
  Upload,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

const DEPARTAMENTOS_COLOMBIA = [
  'Antioquia', 'Bogotá D.C.', 'Valle del Cauca', 'Cundinamarca', 'Santander',
  'Atlántico', 'Bolívar', 'Risaralda', 'Caldas', 'Quindío', 'Tolima',
  'Huila', 'Norte de Santander', 'Boyacá', 'Meta', 'Nariño', 'Córdoba',
  'Cesar', 'Magdalena', 'Otro Departamento'
];

export const CheckoutPage = ({ onBackToShop, onOpenTracking }) => {
  const { currentUser } = useAuth();
  const { cart, removeFromCart, updateQuantity, subtotal, clearCart, showToast } = useCart();
  const [showDepositNotice, setShowDepositNotice] = useState(false);
  const [depositDraft, setDepositDraft] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const submittingRef = useRef(false);

  const [customerInfo, setCustomerInfo] = useState({
    name: currentUser?.displayName || '',
    phone: currentUser?.phoneNumber || '',
    department: 'Bogotá D.C.',
    city: 'Bogotá',
    neighborhood: '',
    address: '',
    deliveryNotes: '',
    paymentMethod: 'EFECTIVO_CONTRAENTREGA',
  });

  // Sincronizar datos si el usuario inicia sesión
  React.useEffect(() => {
    if (currentUser) {
      setCustomerInfo((prev) => ({
        ...prev,
        name: prev.name || currentUser.displayName || '',
        phone: prev.phone || currentUser.phoneNumber || '',
      }));
    }
  }, [currentUser]);

  // Entrega acordada en mano: total real sumando el precio de cada muñeco
  const shippingCost = 0;
  const grandTotal = useMemo(() => subtotal, [subtotal]);

  // Regla de los $50.000 COP: >= $50.000 requiere anticipo obligatorio del 20%
  const requiresDeposit = useMemo(() => grandTotal >= DEPOSIT_THRESHOLD_COP, [grandTotal]);
  const depositBaseAmount = useMemo(
    () => (requiresDeposit ? Math.ceil(grandTotal * 0.20) : 0),
    [requiresDeposit, grandTotal],
  );
  const remainingBalance = useMemo(
    () => grandTotal - depositBaseAmount,
    [grandTotal, depositBaseAmount],
  );

  // Estados para el formulario de confirmación del anticipo (pre-creación de orden)
  const [paymentReference, setPaymentReference] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [proofError, setProofError] = useState(false);
  const [isReportingPayment, setIsReportingPayment] = useState(false);

  const cleanPhoneDigits = useMemo(
    () => (customerInfo.phone || '').replace(/\D/g, '').replace(/^57(?=\d{10}$)/, '').slice(0, 10),
    [customerInfo.phone],
  );

  // Si el usuario permanece en la pantalla tras reportar el anticipo, escuchar en tiempo real cuando el Admin apruebe el pago
  React.useEffect(() => {
    if (!orderConfirmed?.id || orderConfirmed.status !== 'VERIFICANDO_ANTICIPO') return;

    const handleLiveOrderUpdate = (liveData) => {
      if (!liveData) return;
      const nextStatus = String(liveData.status || '').toUpperCase();
      const nextPayStatus = String(liveData.paymentStatus || '').toUpperCase();

      if (nextStatus === 'EN_COLA' || nextPayStatus === 'ANTICIPO_VERIFICADO') {
        setOrderConfirmed((prev) =>
          prev && prev.status !== 'EN_COLA'
            ? {
                ...prev,
                status: 'EN_COLA',
                paymentStatus: 'ANTICIPO_VERIFICADO',
                queuedAt: liveData.queuedAt || new Date().toISOString(),
              }
            : prev,
        );
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#25D366', '#ffb4ab', '#ffffff'],
          });
        } catch {}
        showToast("¡ANTICIPO ACEPTADO! TU PEDIDO YA ESTÁ EN LA COLA OFICIAL DE PRODUCCIÓN", "success");
      } else if (nextPayStatus === 'RECHAZADO') {
        setOrderConfirmed((prev) =>
          prev && prev.paymentStatus !== 'RECHAZADO'
            ? {
                ...prev,
                status: liveData.status || 'ESPERANDO_PAGO',
                paymentStatus: 'RECHAZADO',
              }
            : prev,
        );
        showToast("EL COMPROBANTE FUE RECHAZADO POR EL TALLER. REVISA EL RASTREO DE TU PEDIDO", "error");
      }
    };

    const unsub = subscribeToOrderById(orderConfirmed.id, handleLiveOrderUpdate);
    const pollInterval = setInterval(async () => {
      try {
        const tracked = await trackOrder(orderConfirmed.id);
        if (tracked) handleLiveOrderUpdate(tracked);
      } catch {}
    }, 6000);

    return () => {
      unsub();
      clearInterval(pollInterval);
    };
  }, [orderConfirmed?.id, orderConfirmed?.status, showToast]);

  const handleInputChange = useCallback((field, value) => {
    if (field === 'phone') {
      const onlyDigits = String(value || '')
        .replace(/\D/g, '')
        .replace(/^57(?=\d{10}$)/, '')
        .slice(0, 10);
      setCustomerInfo((prev) => ({ ...prev, phone: onlyDigits }));
      return;
    }
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validateCheckoutInputs = () => {
    if (cart.length === 0) {
      showToast("TU CARRITO DE COMPRAS ESTÁ VACÍO", "warning");
      return null;
    }
    if (!customerInfo.name || !customerInfo.name.trim()) {
      showToast("POR FAVOR INGRESA TU NOMBRE COMPLETO", "warning");
      return null;
    }
    const cleanPhone = (customerInfo.phone || '').replace(/\D/g, '').replace(/^57(?=\d{10}$)/, '');
    if (cleanPhone.length !== 10) {
      showToast("EL NÚMERO DE CELULAR O WHATSAPP DEBE TENER EXACTAMENTE 10 DÍGITOS", "warning");
      return null;
    }
    if (!customerInfo.address || !customerInfo.address.trim()) {
      showToast("POR FAVOR INGRESA TU DIRECCIÓN DE ENTREGA", "warning");
      return null;
    }
    if (!customerInfo.neighborhood || !customerInfo.neighborhood.trim()) {
      showToast("POR FAVOR INDICA EL BARRIO DE ENTREGA", "warning");
      return null;
    }
    const emailFallback = currentUser?.email || `${cleanPhone}@cliente.kuropunk.com`;
    return { cleanPhone, emailFallback };
  };

  const buildOrderPayload = (cleanPhone, emailFallback, extra = {}) => ({
    customerName: (customerInfo.name || '').trim(),
    email: emailFallback,
    phone: cleanPhone,
    address: (customerInfo.address || '').trim(),
    neighborhood: (customerInfo.neighborhood || '').trim(),
    city: (customerInfo.city || '').trim(),
    department: customerInfo.department || 'Bogotá D.C.',
    deliveryNotes: (customerInfo.deliveryNotes || '').trim(),
    paymentMethod: customerInfo.paymentMethod || 'EFECTIVO_CONTRAENTREGA',
    country: 'Colombia',
    items: cart.map((item) => ({
      productId: String(item.id),
      title: item.title,
      price: Number(item.price),
      quantity: item.quantity,
      color: item.color || 'Asphalt',
      size: item.size || 'MED',
      image: item.image,
      tier: item.tier || 'finished',
    })),
    shippingCost: 0,
    total: grandTotal,
    ...extra,
  });

  const buildConfirmedOrderState = ({
    id,
    trackingCode,
    total,
    requiresDepositFlag,
    baseDeposit,
    requiredDeposit,
    remaining,
    status,
    paymentStatus,
    refCode = null,
    proofUrl = '',
    phoneClean = '',
  }) => ({
    id,
    trackingCode,
    items: [...cart],
    subtotal: total,
    shippingCost: 0,
    total,
    requiresDeposit: requiresDepositFlag,
    depositBaseAmount: baseDeposit,
    depositRequiredAmount: requiredDeposit,
    remainingBalance: remaining,
    paymentStatus,
    status,
    paymentReference: refCode,
    paymentProofUrl: proofUrl,
    customerName: customerInfo.name.trim(),
    phone: phoneClean || customerInfo.phone.trim(),
    address: customerInfo.address.trim(),
    neighborhood: customerInfo.neighborhood.trim(),
    city: customerInfo.city.trim(),
    department: customerInfo.department,
    deliveryNotes: customerInfo.deliveryNotes.trim(),
    paymentMethod: customerInfo.paymentMethod,
    date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
  });

  const handleConfirmOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (submittingRef.current || isProcessing || isReportingPayment || orderConfirmed) return;

    const validated = validateCheckoutInputs();
    if (!validated) return;

    // Si el pedido es >= $50.000 COP, NO agendamos nada todavía: mostramos el aviso del anticipo del 20%
    if (requiresDeposit) {
      setShowDepositNotice(true);
      return;
    }

    submittingRef.current = true;
    setIsProcessing(true);
    try {
      const { cleanPhone, emailFallback } = validated;
      const res = await submitOrder(buildOrderPayload(cleanPhone, emailFallback));

      const generatedOrderId = res.id || `VS-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedTracking = res.trackingCode || `KURO-TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const serverTotal = Number(res.total || grandTotal);

      createFirestoreOrder({
        id: generatedOrderId,
        userId: currentUser?.uid || `guest_${cleanPhone}`,
        customerName: (customerInfo.name || '').trim(),
        phone: cleanPhone,
        email: emailFallback,
        address: (customerInfo.address || '').trim(),
        neighborhood: (customerInfo.neighborhood || '').trim(),
        city: (customerInfo.city || '').trim(),
        department: customerInfo.department,
        deliveryNotes: (customerInfo.deliveryNotes || '').trim(),
        paymentMethod: customerInfo.paymentMethod,
        items: cart,
        total: serverTotal,
        requiresDeposit: false,
        depositBaseAmount: 0,
        depositRequiredAmount: 0,
        remainingBalance: serverTotal,
        paymentStatus: 'NO_REQUIERE',
        status: 'EN_COLA',
        trackingCode: generatedTracking,
      }).catch(() => {});

      setOrderConfirmed(
        buildConfirmedOrderState({
          id: generatedOrderId,
          trackingCode: generatedTracking,
          total: serverTotal,
          requiresDepositFlag: false,
          baseDeposit: 0,
          requiredDeposit: 0,
          remaining: serverTotal,
          status: res.status || 'EN_COLA',
          paymentStatus: res.paymentStatus || 'NO_REQUIERE',
          phoneClean: cleanPhone,
        }),
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e0141f', '#ffb4ab', '#25D366', '#ffffff'],
        });
      } catch {}

      clearCart();
      showToast("¡PEDIDO EN COLA DE PRODUCCIÓN! PAGO CONTRAENTREGA", "success");
    } catch (err) {
      showToast(err.message || "NO SE PUDO REGISTRAR EL PEDIDO. REVISA LOS DATOS", "error");
    } finally {
      submittingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleProceedToDepositPage = () => {
    setShowDepositNotice(false);
    setProofError(false);
    setDepositDraft({
      grandTotal,
      depositBaseAmount,
      depositRequiredAmount: depositBaseAmount,
      remainingBalance,
    });
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {}
  };

  const handleFinalizeDepositOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!depositDraft || isReportingPayment || submittingRef.current || orderConfirmed) return;

    const validated = validateCheckoutInputs();
    if (!validated) return;

    const cleanRef = paymentReference.trim().toUpperCase();
    if (!cleanRef || cleanRef.length < 4) {
      showToast("INGRESA EL NÚMERO DE COMPROBANTE O REFERENCIA (MÍN. 4 CARACTERES)", "warning");
      return;
    }

    if (!proofFile) {
      setProofError(true);
      showToast("DEBES ADJUNTAR LA FOTO DEL COMPROBANTE PARA PODER AGENDAR TU PEDIDO", "warning");
      return;
    }

    submittingRef.current = true;
    setIsReportingPayment(true);
    setProofError(false);
    try {
      const { cleanPhone, emailFallback } = validated;

      const uploadedProofUrl = await compressImageToDataUrl(proofFile);

      const res = await submitOrder(
        buildOrderPayload(cleanPhone, emailFallback, {
          depositRequiredAmount: depositDraft.depositBaseAmount,
          paymentReference: cleanRef,
          paymentProofUrl: uploadedProofUrl,
        }),
      );

      const generatedOrderId = res.id || `VS-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedTracking = res.trackingCode || `KURO-TRK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const serverTotal = Number(res.total || depositDraft.grandTotal);
      const serverBaseDeposit = Number(res.depositBaseAmount || depositDraft.depositBaseAmount);
      const serverRequiredDeposit = serverBaseDeposit;
      const serverRemaining = Number(res.remainingBalance ?? serverTotal - serverBaseDeposit);

      if (res.status === 'ESPERANDO_PAGO') {
        await reportOrderPayment(generatedOrderId, {
          paymentReference: cleanRef,
          paymentProofUrl: uploadedProofUrl,
        });
      }

      // Firestore exige crear primero en ESPERANDO_PAGO y luego actualizar a VERIFICANDO_ANTICIPO
      try {
        await createFirestoreOrder({
          id: generatedOrderId,
          userId: currentUser?.uid || `guest_${cleanPhone}`,
          customerName: (customerInfo.name || '').trim(),
          phone: cleanPhone,
          email: emailFallback,
          address: (customerInfo.address || '').trim(),
          neighborhood: (customerInfo.neighborhood || '').trim(),
          city: (customerInfo.city || '').trim(),
          department: customerInfo.department,
          deliveryNotes: (customerInfo.deliveryNotes || '').trim(),
          paymentMethod: customerInfo.paymentMethod,
          items: cart,
          total: serverTotal,
          requiresDeposit: true,
          depositBaseAmount: serverBaseDeposit,
          depositRequiredAmount: serverRequiredDeposit,
          remainingBalance: serverRemaining,
          paymentStatus: 'PENDIENTE_ANTICIPO',
          status: 'ESPERANDO_PAGO',
          trackingCode: generatedTracking,
        });
        await reportOrderPaymentInFirestore(generatedOrderId, {
          paymentReference: cleanRef,
          paymentProofUrl: uploadedProofUrl,
        });
      } catch {}

      setDepositDraft(null);
      setOrderConfirmed(
        buildConfirmedOrderState({
          id: generatedOrderId,
          trackingCode: generatedTracking,
          total: serverTotal,
          requiresDepositFlag: true,
          baseDeposit: serverBaseDeposit,
          requiredDeposit: serverRequiredDeposit,
          remaining: serverRemaining,
          status: 'VERIFICANDO_ANTICIPO',
          paymentStatus: 'VERIFICANDO_ANTICIPO',
          refCode: cleanRef,
          proofUrl: uploadedProofUrl,
          phoneClean: cleanPhone,
        }),
      );

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#25D366', '#ffb4ab', '#e0141f'],
        });
      } catch {}

      clearCart();
      showToast("¡COMPROBANTE ENVIADO! TU PEDIDO ENTRÓ A VERIFICACIÓN", "success");
    } catch (err) {
      showToast(err.message || "NO SE PUDO REGISTRAR EL PEDIDO NI EL COMPROBANTE", "error");
    } finally {
      submittingRef.current = false;
      setIsReportingPayment(false);
    }
  };

  const copyTracking = () => {
    if (orderConfirmed?.trackingCode) {
      navigator.clipboard.writeText(orderConfirmed.trackingCode);
      showToast("CÓDIGO DE SEGUIMIENTO COPIADO", "info");
    }
  };

  const copyTextToClipboard = (text, label = "VALOR COPIADO") => {
    navigator.clipboard.writeText(String(text));
    showToast(label, "info");
  };

  return (
    <AuthGuard intent="checkout" allowGuest={true} fallbackMessage="Inicia sesión o regístrate para asegurar tu pedido contraentrega y activar el seguimiento en tiempo real con el taller.">
      <div className="w-full pt-2 pb-32 sm:pb-20 bg-[#0d0c0c] min-h-screen text-[#e6e1e1]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-12 relative z-10">
          
          {/* Navegación superior */}
          <div className="pt-2 pb-4 flex items-center justify-between">
            <button
              onClick={onBackToShop}
              className="min-h-[44px] flex items-center gap-2 font-mono text-xs text-[#8a8a86] hover:text-[#ffb4ab] transition-colors uppercase tracking-wider"
            >
              <ArrowLeft className="w-4 h-4" /> Volver al Catálogo
            </button>

            <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5">
              <Truck className="w-4 h-4 shrink-0" />
              <span className="hidden xs:inline">ENTREGA PERSONAL · BOGOTÁ & COLOMBIA</span>
              <span className="xs:hidden">ENTREGA SEGURA</span>
            </div>
          </div>

          {/* Modal Aviso Obligatorio de Anticipo (20%) antes de ir a pagar */}
          {showDepositNotice && !orderConfirmed && (
            <div
              role="dialog"
              aria-modal="true"
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#181616] border border-[#5e3f3c] shadow-[0_24px_60px_rgba(0,0,0,0.85)] overflow-hidden text-left"
              >
                <div className="h-1 w-full bg-gradient-to-r from-[#e0141f] via-[#ffb4ab] to-[#25D366]" />

                <div className="p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 shrink-0 bg-[#e0141f]/15 border border-[#e0141f]/50 flex items-center justify-center text-[#ffb4ab]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#ffb4ab] font-bold block">
                        Anticipo requerido · Pedidos desde $50.000
                      </span>
                      <h2 className="font-headline-md text-2xl uppercase text-white leading-tight">
                        Tu pedido requiere abono del 20%
                      </h2>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-300 leading-relaxed">
                    Como tu compra suma <strong className="text-white">{formatCOP(grandTotal)}</strong>, te pedimos un anticipo del 20% para iniciar el tejido. El saldo restante lo pagas cuando recibas tu pieza.
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 bg-[#111010] border border-[#e0141f]/50">
                      <span className="font-mono text-[10px] uppercase text-[#ffb4ab] block">Anticipo hoy (20%)</span>
                      <strong className="font-mono text-lg text-white">{formatCOP(depositBaseAmount)}</strong>
                    </div>
                    <div className="p-3.5 bg-[#111010] border border-emerald-700/50">
                      <span className="font-mono text-[10px] uppercase text-emerald-400 block">Al entregar (80%)</span>
                      <strong className="font-mono text-lg text-emerald-400">{formatCOP(remainingBalance)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-neutral-400 bg-[#111010] border border-neutral-800 px-3 py-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#25D366] shrink-0" />
                    <span>Tu pedido aún no se ha agendado; se registra al enviar el comprobante.</span>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDepositNotice(false)}
                      className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 bg-[#242222] hover:bg-[#2e2b2b] border border-neutral-700 text-neutral-300 font-mono text-xs uppercase font-bold transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToDepositPage}
                      className="w-full sm:flex-1 min-h-[44px] px-5 py-2.5 bg-[#25D366] hover:bg-[#1fa851] text-black font-headline-md text-lg uppercase font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <span>Ir a pagar anticipo</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Pantalla Post-Confirmación, Pantalla de Pago de Anticipo o Formulario de Checkout */}
          {depositDraft && !orderConfirmed ? (
            /* PANTALLA DE PAGO DEL ANTICIPO OBLIGATORIO (20%) - ANTES DE CREAR LA ORDEN */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto p-4 sm:p-8 bg-[#1d1b1b] border-2 border-[#e0141f] shadow-[0_0_40px_rgba(224,20,31,0.25)] space-y-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#5e3f3c] pb-4">
                <div className="inline-flex items-center gap-2 bg-[#e0141f] text-white font-mono font-bold text-xs px-3 py-1 uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5" />
                  <span>PAGO DE ANTICIPO (20%) · SIN AGENDAR AÚN</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDepositDraft(null)}
                  className="font-mono text-xs text-[#ffb4ab] hover:text-white underline flex items-center gap-1.5 uppercase"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Editar Datos del Pedido</span>
                </button>
              </div>

              <div className="space-y-2 text-left">
                <h1 className="font-headline-md text-2xl sm:text-4xl uppercase text-white">
                  Realiza tu Anticipo y Anexa el Comprobante
                </h1>
                <p className="font-mono text-xs sm:text-sm text-neutral-300 leading-relaxed">
                  Transfiere el <strong className="text-[#ffb4ab]">anticipo del 20%</strong> a nuestra llave oficial y registra abajo el número o captura del comprobante para agendar oficialmente tu pedido.
                </p>
              </div>

              {/* Monto Exacto del Anticipo (20% sin pesos adicionales) */}
              <div className="p-5 bg-[#141313] border-2 border-[#25D366] space-y-3 text-left relative overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-mono text-[10px] text-[#25D366] uppercase font-bold tracking-widest block">
                      VALOR DEL ANTICIPO (20%) A TRANSFERIR HOY:
                    </span>
                    <div className="font-headline-md text-4xl sm:text-5xl text-white tracking-tight pt-1">
                      {formatCOP(depositDraft.depositBaseAmount)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyTextToClipboard(
                        depositDraft.depositBaseAmount,
                        "MONTO DEL ANTICIPO COPIADO AL PORTAPAPELES",
                      )
                    }
                    className="px-4 py-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-black font-mono text-xs font-bold uppercase flex items-center gap-2 self-start sm:self-center shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar Valor ({formatCOP(depositDraft.depositBaseAmount)})</span>
                  </button>
                </div>

                {/* Desglose Financiero */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-[#2b2929] font-mono text-xs">
                  <div className="p-2.5 bg-[#1d1b1b] border border-[#363434]">
                    <span className="text-[10px] text-neutral-400 block uppercase">Total del Pedido</span>
                    <strong className="text-white text-sm">{formatCOP(depositDraft.grandTotal)}</strong>
                  </div>
                  <div className="p-2.5 bg-[#1d1b1b] border border-[#e0141f]/50">
                    <span className="text-[10px] text-[#ffb4ab] block uppercase">Anticipo 20% (Hoy)</span>
                    <strong className="text-[#ffb4ab] text-sm">{formatCOP(depositDraft.depositBaseAmount)}</strong>
                  </div>
                  <div className="p-2.5 bg-[#1d1b1b] border border-emerald-700/50">
                    <span className="text-[10px] text-emerald-400 block uppercase">Saldo al Entregar (80%)</span>
                    <strong className="text-emerald-400 text-sm">{formatCOP(depositDraft.remainingBalance)}</strong>
                  </div>
                </div>
              </div>

              {/* Llave oficial única de pago */}
              <div className="space-y-3 text-left">
                <h2 className="font-headline-md text-xl uppercase text-white flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-[#e0141f]" />
                  <span>1. Transfiere a nuestra Llave Oficial Bre-B</span>
                </h2>
                <div className={`grid gap-3 ${PAYMENT_ACCOUNTS.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {PAYMENT_ACCOUNTS.map((acc) => (
                    <div
                      key={acc.id}
                      className="p-4 sm:p-5 bg-[#141313] border border-[#5e3f3c] hover:border-[#ffb4ab] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#e0141f]/20 text-[#ffb4ab] text-[10px] font-bold uppercase inline-block">
                            {acc.badge}
                          </span>
                          <strong className="text-white text-sm">{acc.label}</strong>
                        </div>
                        <span className="text-neutral-400 text-[11px] block">{acc.bank}</span>
                        <div className="pt-1 flex flex-wrap items-baseline gap-2">
                          <span className="text-[10px] text-neutral-500 uppercase">Llave:</span>
                          <span className="text-xl sm:text-2xl font-bold text-[#25D366] tracking-wider">{acc.key}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400 block">Titular: {acc.holder}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyTextToClipboard(acc.key, `LLAVE ${acc.key} COPIADA`)}
                        className="w-full sm:w-auto px-5 py-3 bg-[#262424] hover:bg-[#333030] border border-neutral-600 text-white uppercase font-bold text-xs flex items-center justify-center gap-2 transition-colors shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Copiar Llave</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formulario de Confirmación de Comprobante */}
              <form onSubmit={handleFinalizeDepositOrder} noValidate className="p-5 bg-[#141313] border border-[#5e3f3c] space-y-4 text-left">
                <h2 className="font-headline-md text-xl uppercase text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#25D366]" />
                  <span>2. Anexa tu Comprobante para Agendar el Pedido</span>
                </h2>

                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold block">
                    Número de Comprobante / Referencia de Transferencia *
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder="Ej: M12948392 o 00049281"
                    className="w-full min-h-[46px] bg-[#1d1b1b] border-2 border-[#5e3f3c] focus:border-[#25D366] px-3 font-mono text-sm text-white uppercase outline-none"
                  />
                  <span className="font-mono text-[10px] text-neutral-400 block">
                    El sistema valida que el código sea único y solo agenda tu orden al completar este paso.
                  </span>
                </div>

                {/* Captura obligatoria */}
                <div className="space-y-1.5">
                  <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold block">
                    Foto / Captura del Comprobante (Obligatorio) *
                  </label>
                  <div
                    className={`p-3 bg-[#1d1b1b] border-2 transition-colors flex flex-wrap items-center justify-between gap-3 ${
                      proofError
                        ? 'border-[#e0141f] bg-[#e0141f]/10'
                        : proofFile
                        ? 'border-[#25D366]'
                        : 'border-[#5e3f3c]'
                    }`}
                  >
                    <label className="cursor-pointer py-2.5 px-4 bg-[#262424] hover:bg-[#333030] border border-[#5e3f3c] font-mono text-xs text-white font-bold uppercase flex items-center gap-2">
                      <Upload className="w-4 h-4 text-[#ffb4ab]" />
                      <span>{proofFile ? 'Cambiar Foto del Comprobante' : 'Seleccionar Foto del Comprobante *'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        required
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setProofFile(f);
                            setProofPreview(URL.createObjectURL(f));
                            setProofError(false);
                          }
                        }}
                      />
                    </label>
                    {proofPreview ? (
                      <div className="flex items-center gap-2.5 font-mono text-xs text-emerald-400">
                        <img src={proofPreview} alt="Voucher" className="w-12 h-12 object-cover border border-emerald-500" />
                        <span>✓ Foto del comprobante lista</span>
                      </div>
                    ) : (
                      <span className="font-mono text-[11px] text-amber-300">
                        * Requerido: adjunta la captura para poder agendar
                      </span>
                    )}
                  </div>
                  {proofError && (
                    <span className="font-mono text-xs text-[#ff897d] font-bold block">
                      ⚠ Es obligatorio adjuntar la foto o captura del comprobante antes de continuar.
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isReportingPayment}
                  className="w-full min-h-[50px] bg-[#25D366] hover:bg-[#1fa851] text-black font-headline-md text-xl uppercase font-bold py-3 px-6 flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(37,211,102,0.3)] transition-all disabled:opacity-50"
                >
                  {isReportingPayment ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AGENDANDO Y ENVIANDO COMPROBANTE...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Enviar Comprobante y Agendar Pedido</span>
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          ) : orderConfirmed ? (
              /* PANTALLA DE VERIFICACIÓN DE ANTICIPO EN CURSO O PEDIDO EN COLA DIRECTA */
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto p-4 sm:p-8 bg-[#1d1b1b] border border-[#5e3f3c] shadow-2xl text-center space-y-6"
              >
                <div
                  className={`inline-block font-mono font-bold text-xs px-3 py-1 uppercase tracking-wider ${
                    orderConfirmed.status === 'VERIFICANDO_ANTICIPO'
                      ? 'bg-amber-400 text-black'
                      : 'bg-[#25D366] text-black'
                  }`}
                >
                  {orderConfirmed.status === 'VERIFICANDO_ANTICIPO'
                    ? `VERIFICANDO ANTICIPO · ORDEN ${orderConfirmed.id}`
                    : orderConfirmed.paymentStatus === 'ANTICIPO_VERIFICADO'
                    ? `✓ PAGO ACEPTADO · EN COLA OFICIAL ${orderConfirmed.id}`
                    : `PEDIDO EN COLA DE PRODUCCIÓN · ${orderConfirmed.id}`}
                </div>

                <div className="w-16 h-16 bg-[#141313] border-2 border-[#25D366] flex items-center justify-center text-[#25D366] mx-auto shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                  {orderConfirmed.status === 'VERIFICANDO_ANTICIPO' ? (
                    <Clock className="w-8 h-8 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8" />
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="font-headline-md text-2xl sm:text-3xl uppercase text-white">
                    {orderConfirmed.status === 'VERIFICANDO_ANTICIPO'
                      ? '¡Reporte de Anticipo Recibido!'
                      : orderConfirmed.paymentStatus === 'ANTICIPO_VERIFICADO'
                      ? '¡Anticipo Aceptado! Ya estás en Cola'
                      : '¡Pedido Recibido con Éxito!'}
                  </h1>
                  {orderConfirmed.status === 'VERIFICANDO_ANTICIPO' ? (
                    <p className="text-xs sm:text-sm text-neutral-300 max-w-lg mx-auto font-mono leading-relaxed">
                      Recibimos tu reporte de pago por{' '}
                      <strong className="text-[#ffb4ab]">{formatCOP(orderConfirmed.depositRequiredAmount)}</strong>{' '}
                      (Comprobante: <strong className="text-white">#{orderConfirmed.paymentReference}</strong>). Estamos confirmando el ingreso del dinero en la cuenta; apenas el administrador lo apruebe, esta pantalla se actualizará automáticamente.
                    </p>
                  ) : orderConfirmed.paymentStatus === 'ANTICIPO_VERIFICADO' ? (
                    <p className="text-xs sm:text-sm text-emerald-300 max-w-lg mx-auto font-mono leading-relaxed">
                      ¡El taller confirmó tu anticipo de{' '}
                      <strong className="text-white">{formatCOP(orderConfirmed.depositRequiredAmount)}</strong>! Tu muñeco ya tiene turno oficial en la cola de producción y pagas el 80% restante ({formatCOP(orderConfirmed.remainingBalance)}) al recibirlo en mano.
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
                      Tu orden está en la cola de producción.{' '}
                      <strong className="text-emerald-400">
                        Pagas {formatCOP(orderConfirmed.remainingBalance || orderConfirmed.total)} al recibir tu pieza en mano.
                      </strong>
                    </p>
                  )}
                </div>

                {/* Resumen de Saldo Pendiente (80%) */}
                {orderConfirmed.requiresDeposit && (
                  <div className="p-4 bg-[#141313] border border-[#5e3f3c] grid grid-cols-2 gap-3 font-mono text-xs text-left">
                    <div>
                      <span className="text-[10px] text-neutral-400 uppercase block">Anticipo Reportado (20%)</span>
                      <strong className="text-[#ffb4ab] text-sm">{formatCOP(orderConfirmed.depositRequiredAmount)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase block">Saldo Restante al Entregar (80%)</span>
                      <strong className="text-emerald-400 text-sm">{formatCOP(orderConfirmed.remainingBalance)}</strong>
                    </div>
                  </div>
                )}

                {/* Caja de Código de Seguimiento */}
                <div className="p-4 bg-[#141414] border border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                  <div>
                    <span className="text-[10px] font-mono text-neutral-400 uppercase block">Código de Seguimiento</span>
                    <span className="font-mono text-base font-bold text-[#ffb4ab] break-all">{orderConfirmed.trackingCode}</span>
                  </div>
                  <button
                    onClick={copyTracking}
                    className="min-h-[44px] min-w-[44px] px-3 bg-[#262424] hover:bg-[#333030] text-xs font-mono uppercase text-white flex items-center gap-2 border border-neutral-600 shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copiar</span>
                  </button>
                </div>

                {/* Botón Principal WhatsApp para Atención Inmediata */}
                <div className="pt-2">
                  <a
                    href={generateWhatsAppOrderUrl(orderConfirmed)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-[48px] px-6 py-3 bg-[#25D366] hover:bg-[#1fa851] text-black font-mono text-xs sm:text-sm uppercase font-bold flex items-center justify-center gap-2 shadow-xl transition-all active:scale-98"
                  >
                    <MessageSquare className="w-5 h-5 fill-black" />
                    <span>Notificar al Taller por WhatsApp</span>
                  </a>
                </div>

                {/* Botones de Acción Secundarios Post-Compra */}
                <div className="flex flex-wrap justify-center gap-3 pt-1">
                  {onOpenTracking && (
                    <button
                      onClick={() => onOpenTracking(orderConfirmed.trackingCode)}
                      className="min-h-[44px] px-4 py-2.5 bg-[#262424] border border-neutral-700 text-[#ffb4ab] font-mono text-xs uppercase font-bold hover:bg-[#333030] flex items-center justify-center gap-2"
                    >
                      <Truck className="w-4 h-4 text-[#e0141f]" /> Rastrear Pedido
                    </button>
                  )}
                  <button
                    onClick={() => downloadReceiptPDF(orderConfirmed)}
                    className="min-h-[44px] px-4 py-2.5 bg-[#262424] border border-neutral-700 text-neutral-200 font-mono text-xs uppercase font-bold hover:bg-[#333030] flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> Recibo PDF
                  </button>
                  <button
                    onClick={onBackToShop}
                    className="min-h-[44px] px-6 py-2.5 bg-[#e0141f] text-white font-mono text-xs uppercase font-bold hover:bg-red-700"
                  >
                    Volver al Catálogo
                  </button>
                </div>
              </motion.div>
          ) : (
            /* Layout Principal de Checkout */
            <main className="w-full bg-[#1d1b1b] p-3.5 sm:p-6 md:p-8 border border-[#5e3f3c] shadow-2xl">
              <div className="border-b border-[#5e3f3c] pb-3 mb-6 flex justify-between items-center">
                <div>
                  <span className="font-mono text-[11px] text-[#25D366] font-bold uppercase block">
                    ✓ ENTREGA EN MANO & PAGO CONTRAENTREGA
                  </span>
                  <h1 className="font-headline-md text-2xl sm:text-4xl uppercase text-white">
                    Finalizar Pedido · Colombia
                  </h1>
                </div>
                <span className="font-mono text-xs text-[#ffb4ab] bg-[#2a2828] px-3 py-1 font-bold">
                  {cart.length} {cart.length === 1 ? 'Pieza' : 'Piezas'}
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center space-y-4">
                  <p className="font-headline-md text-xl uppercase text-neutral-300">Tu carrito está vacío</p>
                  <p className="text-xs text-neutral-400">Agrega piezas desde el catálogo para iniciar el despacho.</p>
                  <button
                    onClick={onBackToShop}
                    className="min-h-[44px] px-6 py-3 bg-[#e0141f] text-white font-mono text-xs uppercase font-bold"
                  >
                    Explorar Catálogo
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Columna Izquierda: Ítems y Formulario */}
                  <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
                    
                    {/* Lista de Ítems */}
                    <div className="space-y-3">
                      <span className="font-mono text-xs text-neutral-400 uppercase tracking-wider block">
                        [ REVISIÓN DE TU ARSENAL ]
                      </span>
                      {cart.map((item) => (
                        <div
                          key={`${item.id}-${item.size || 'std'}`}
                          className="flex gap-3 p-3 bg-[#141313] border border-[#5e3f3c]"
                        >
                          <div className="w-20 h-20 aspect-square bg-[#242222] shrink-0 border border-neutral-800 overflow-hidden">
                            <img
                              src={item.image}
                              alt={item.title}
                              width="80"
                              height="80"
                              loading="lazy"
                              className="w-full h-full object-cover filter contrast-125"
                            />
                          </div>

                          <div className="flex flex-col justify-between flex-grow min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <div className="min-w-0">
                                <h2 className="font-headline-md text-base sm:text-lg uppercase text-white truncate">
                                  {item.title}
                                </h2>
                                <p className="font-mono text-[11px] text-neutral-400 uppercase">
                                  Color: {item.color || 'Asphalt'} · {item.size || 'MED'}
                                </p>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.id)}
                                aria-label={`Eliminar ${item.title}`}
                                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-neutral-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex flex-wrap justify-between items-center gap-2 mt-2">
                              {/* Selector de cantidad con Touch Target accesible (>= 40-44px) */}
                              <div className="flex items-center border border-neutral-700 bg-[#211f1f]">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-lg text-white hover:bg-neutral-700 active:bg-neutral-600 transition-colors"
                                  aria-label="Restar una unidad"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs text-white min-w-8 text-center font-bold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  disabled={typeof item.stock === 'number' && item.quantity >= item.stock}
                                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-lg text-white hover:bg-neutral-700 active:bg-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                  aria-label="Sumar una unidad"
                                >
                                  +
                                </button>
                              </div>

                              <span className="font-mono text-sm sm:text-base font-bold text-[#ffb4ab] shrink-0">
                                {formatCOP(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Formulario de Envío (Inputs con text-base para evitar auto-zoom en iOS) */}
                    <div className="p-4 sm:p-6 bg-[#141313] border border-[#5e3f3c] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[#e0141f]" />
                          <h3 className="font-headline-md text-lg sm:text-xl text-white uppercase">
                            Datos para la Entrega Personal
                          </h3>
                        </div>
                        <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5">
                          Pagas al recibir
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Nombre */}
                        <div>
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Nombre y Apellido <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isProcessing}
                            placeholder="Ej: Mateo Gómez"
                            value={customerInfo.name}
                            onChange={(e) => handleInputChange('name', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Teléfono */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[#ffb4ab] text-xs font-mono uppercase">
                              Celular / WhatsApp (10 dígitos) <span className="text-red-500">*</span>
                            </label>
                            <span
                              className={`text-[10px] font-mono font-bold ${
                                cleanPhoneDigits.length === 10 ? 'text-[#25D366]' : 'text-neutral-400'
                              }`}
                            >
                              {cleanPhoneDigits.length}/10 dígitos
                            </span>
                          </div>
                          <input
                            type="tel"
                            inputMode="numeric"
                            maxLength={10}
                            required
                            disabled={isProcessing}
                            placeholder="Ej: 3238937221"
                            value={customerInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className={`w-full min-h-[44px] bg-[#1c1a1a] border px-3 text-base sm:text-sm text-white outline-none transition-colors disabled:opacity-50 ${
                              cleanPhoneDigits.length > 0 && cleanPhoneDigits.length < 10
                                ? 'border-amber-500/80 focus:border-amber-400'
                                : cleanPhoneDigits.length === 10
                                ? 'border-[#25D366]'
                                : 'border-[#5e3f3c] focus:border-[#25D366]'
                            }`}
                          />
                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                            Ingresa los 10 dígitos de tu número para notificarte el estado y la entrega.
                          </span>
                        </div>

                        {/* Departamento */}
                        <div>
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Departamento <span className="text-red-500">*</span>
                          </label>
                          <select
                            disabled={isProcessing}
                            value={customerInfo.department}
                            onChange={(e) => handleInputChange('department', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          >
                            {DEPARTAMENTOS_COLOMBIA.map((dep) => (
                              <option key={dep} value={dep}>{dep}</option>
                            ))}
                          </select>
                        </div>

                        {/* Ciudad */}
                        <div>
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Ciudad o Municipio <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isProcessing}
                            placeholder="Ej: Bogotá D.C. / Chapinero"
                            value={customerInfo.city}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Barrio */}
                        <div>
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Barrio <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isProcessing}
                            placeholder="Ej: Chapinero / Usaquén"
                            value={customerInfo.neighborhood}
                            onChange={(e) => handleInputChange('neighborhood', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Dirección */}
                        <div>
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Dirección Exacta <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            disabled={isProcessing}
                            placeholder="Ej: Calle 45 # 70-12 Apto 302"
                            value={customerInfo.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                        </div>

                        {/* Indicaciones */}
                        <div className="sm:col-span-2">
                          <label className="text-neutral-400 text-xs font-mono uppercase block mb-1">
                            Indicaciones Adicionales (Opcional)
                          </label>
                          <input
                            type="text"
                            disabled={isProcessing}
                            placeholder="Ej: Casa reja negra, dejar en portería..."
                            value={customerInfo.deliveryNotes}
                            onChange={(e) => handleInputChange('deliveryNotes', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                        </div>
                      </div>

                      {/* Modalidad de Pago al Recibir */}
                      <div className="pt-3 border-t border-[#5e3f3c]">
                        <span className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1 font-bold flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-emerald-400" />
                          {requiresDeposit
                            ? `¿Cómo deseas pagar el 80% restante (${formatCOP(remainingBalance)}) al recibir tu paquete?`
                            : '¿Cómo deseas pagar al recibir tu paquete?'}
                        </span>
                        {requiresDeposit && (
                          <span className="text-[11px] text-neutral-400 font-mono block mb-2.5">
                            Hoy transfieres el anticipo del 20% ({formatCOP(depositBaseAmount)}) por Llave Bre-B y el saldo lo entregas cuando tengas tu pedido en mano:
                          </span>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleInputChange('paymentMethod', 'EFECTIVO_CONTRAENTREGA')}
                            className={`min-h-[48px] p-3 border text-left flex items-center gap-2.5 transition-colors ${
                              customerInfo.paymentMethod === 'EFECTIVO_CONTRAENTREGA'
                                ? 'border-[#25D366] bg-emerald-950/30 text-white font-bold'
                                : 'border-[#5e3f3c] bg-[#181616] text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span>💵</span>
                            <span className="text-xs font-mono">
                              {requiresDeposit ? 'Efectivo al recibir (80% restante)' : 'Efectivo al recibir en mano'}
                            </span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleInputChange('paymentMethod', 'NEQUI_DAVIPLATA_CONTRAENTREGA')}
                            className={`min-h-[48px] p-3 border text-left flex items-center gap-2.5 transition-colors ${
                              customerInfo.paymentMethod === 'NEQUI_DAVIPLATA_CONTRAENTREGA'
                                ? 'border-[#25D366] bg-emerald-950/30 text-white font-bold'
                                : 'border-[#5e3f3c] bg-[#181616] text-neutral-400 hover:text-white'
                            }`}
                          >
                            <span>📱</span>
                            <span className="text-xs font-mono">
                              {requiresDeposit ? 'Nequi / Daviplata al recibir (80%)' : 'Nequi / Daviplata al recibir'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Columna Derecha: Resumen de Valor a Pagar */}
                  <div className="lg:col-span-5 xl:col-span-4 bg-[#141313] border border-[#5e3f3c] p-4 sm:p-6 lg:sticky lg:top-28 space-y-5 shadow-xl">
                    <div className="border-b border-[#5e3f3c] pb-2 flex items-center justify-between">
                      <h2 className="font-headline-md text-xl uppercase text-white">
                        Valor a Pagar
                      </h2>
                      <span className="font-mono text-[10px] text-neutral-400 uppercase">Resumen de Pago</span>
                    </div>

                    {requiresDeposit && (
                      <div className="p-3.5 bg-amber-950/30 border-l-4 border-amber-400 border border-amber-500/40 font-mono text-xs text-amber-100 space-y-1.5">
                        <div className="font-bold text-amber-300 flex items-center gap-1.5 uppercase">
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Información Importante · Anticipo del 20%</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-neutral-200">
                          Como tu pedido es de <strong>$50.000 COP o más</strong>, requiere un <strong>anticipo del 20% ({formatCOP(depositBaseAmount)})</strong> por Llave Bre-B y anexar la foto del comprobante para agendarlo. El <strong>80% restante ({formatCOP(remainingBalance)})</strong> lo pagas al recibir.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2.5 font-mono text-xs">
                      <div className="flex justify-between items-center text-neutral-300">
                        <span>Total del pedido:</span>
                        <span className="text-white font-bold text-sm">{formatCOP(grandTotal)}</span>
                      </div>

                      {requiresDeposit ? (
                        <>
                          <div className="flex justify-between items-center p-2.5 bg-[#1d1b1b] border border-[#e0141f]/60 text-[#ffb4ab]">
                            <span className="font-bold">Anticipo del 20% para iniciar hoy:</span>
                            <span className="font-bold text-base text-white">{formatCOP(depositBaseAmount)}</span>
                          </div>
                          <div className="flex justify-between items-center p-2.5 bg-[#1d1b1b] border border-emerald-700/50 text-emerald-400">
                            <span>Saldo restante (a pagar al entregar):</span>
                            <span className="font-bold text-sm">{formatCOP(remainingBalance)}</span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center text-emerald-400">
                            <span>Anticipo requerido hoy:</span>
                            <span className="font-bold">$ 0 COP (Directo a Cola)</span>
                          </div>
                          <div className="flex justify-between items-center text-neutral-400">
                            <span>Saldo a pagar al recibir:</span>
                            <span className="text-white font-bold">{formatCOP(grandTotal)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="border-t border-[#5e3f3c] pt-3">
                      <div className="flex justify-between items-end">
                        <span className="font-headline-md text-lg uppercase text-white">
                          {requiresDeposit ? 'A Transferir Hoy (20%)' : 'Total Contraentrega'}
                        </span>
                        <span className="font-mono text-2xl font-bold text-[#ffb4ab]">
                          {requiresDeposit ? formatCOP(depositBaseAmount) : formatCOP(grandTotal)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-emerald-400 text-right mt-1">
                        {requiresDeposit
                          ? `✓ El 80% restante (${formatCOP(remainingBalance)}) lo pagas al recibir.`
                          : '✓ 0 Cobros online. Pagas al tener la pieza en tus manos.'}
                      </p>
                    </div>

                    {/* Botón Desktop/Tablet */}
                    <div className="space-y-4 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmOrder}
                        disabled={isProcessing}
                        className="hidden lg:flex w-full min-h-[48px] bg-[#25D366] text-black hover:bg-[#20ba59] active:scale-[0.98] font-headline-md text-xl uppercase py-3 px-4 justify-center items-center gap-2 font-bold transition-all shadow-[3px_3px_0px_#000] disabled:opacity-60"
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>REGISTRANDO PEDIDO...</span>
                          </>
                        ) : (
                          <span>
                            {requiresDeposit
                              ? 'Pagar Anticipo (20%) y Agendar'
                              : 'Confirmar Pedido Contraentrega'}
                          </span>
                        )}
                      </button>

                      <div className="p-3 bg-[#171515] border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold">Garantía KuroPunk:</span>
                        </div>
                        <p>
                          Revisas el amigurumi, certificado y accesorios en mano antes de entregar el saldo final.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </main>
          )}

          {/* Barra Fija Inferior en Móvil (Zona del Pulgar) */}
          {!orderConfirmed && !depositDraft && cart.length > 0 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141313]/95 backdrop-blur-md border-t border-[#5e3f3c] p-3 px-4 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">
                    {requiresDeposit ? 'Anticipo 20% Hoy' : 'Total Contraentrega'}
                  </span>
                  <span className="font-mono text-lg font-bold text-[#ffb4ab] leading-none">
                    {requiresDeposit ? formatCOP(depositBaseAmount) : formatCOP(grandTotal)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmOrder}
                  disabled={isProcessing}
                  className="flex-1 min-h-[48px] bg-[#25D366] text-black active:bg-[#20ba59] font-mono text-xs uppercase font-bold px-4 py-2 flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>REGISTRANDO...</span>
                    </>
                  ) : (
                    <span>{requiresDeposit ? 'Pagar Anticipo (20%)' : 'Confirmar Pedido'}</span>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </AuthGuard>
  );
};
