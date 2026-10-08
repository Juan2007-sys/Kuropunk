import React, { useState, useMemo, useCallback } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { submitOrder } from '../services/api';
import { createFirestoreOrder } from '../services/firebase';
import { AuthGuard } from '../guards/AuthGuard';
import { downloadReceiptPDF } from '../utils/downloadPdf';
import { formatCOP, generateWhatsAppOrderUrl } from '../utils/formatters';
import { motion } from 'framer-motion';
import { 
  Trash2, 
  Check, 
  ArrowLeft, 
  ShieldCheck, 
  CheckCircle2, 
  Copy, 
  Printer, 
  Truck, 
  MapPin, 
  Banknote, 
  Loader2,
  MessageSquare
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
  const [agreed, setAgreed] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);

  const [customerInfo, setCustomerInfo] = useState({
    name: currentUser?.displayName || '',
    phone: currentUser?.phoneNumber || '',
    department: 'Antioquia',
    city: 'Medellín',
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

  // Regla única de envío: Gratis por compras >= $150.000 COP, sino $15.000 COP
  const shippingCost = useMemo(() => (subtotal >= 150000 ? 0 : 15000), [subtotal]);
  const grandTotal = useMemo(() => subtotal + (cart.length > 0 ? shippingCost : 0), [subtotal, cart.length, shippingCost]);

  const handleInputChange = useCallback((field, value) => {
    setCustomerInfo((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleConfirmOrder = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (cart.length === 0) {
      showToast("TU CARRITO DE COMPRAS ESTÁ VACÍO", "warning");
      return;
    }
    if (!customerInfo.name.trim()) {
      showToast("POR FAVOR INGRESA TU NOMBRE COMPLETO", "warning");
      return;
    }
    const cleanPhone = customerInfo.phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      showToast("POR FAVOR INGRESA UN CELULAR O WHATSAPP VÁLIDO", "warning");
      return;
    }
    if (!customerInfo.address.trim()) {
      showToast("POR FAVOR INGRESA TU DIRECCIÓN DE ENTREGA", "warning");
      return;
    }
    if (!customerInfo.neighborhood.trim()) {
      showToast("POR FAVOR INDICA EL BARRIO DE ENTREGA", "warning");
      return;
    }
    if (!agreed) {
      showToast("POR FAVOR CONFIRMA EL PAGO CONTRAENTREGA PARA CONTINUAR", "warning");
      return;
    }

    setIsProcessing(true);

    const emailFallback = currentUser?.email || `${cleanPhone}@cliente.kuropunk.com`;

    const orderPayload = {
      customerName: customerInfo.name.trim(),
      email: emailFallback,
      phone: customerInfo.phone.trim(),
      address: customerInfo.address.trim(),
      neighborhood: customerInfo.neighborhood.trim(),
      city: customerInfo.city.trim(),
      department: customerInfo.department,
      deliveryNotes: customerInfo.deliveryNotes.trim(),
      paymentMethod: customerInfo.paymentMethod,
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
      shippingCost,
      total: grandTotal,
    };

    try {
      const res = await submitOrder(orderPayload);

      const generatedOrderId = res.id || `VS-${Math.floor(100000 + Math.random() * 900000)}`;
      const generatedTracking = res.trackingCode || `KP-COP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

      // Sincronización en Firestore
      try {
        await createFirestoreOrder({
          id: generatedOrderId,
          userId: currentUser?.uid || `guest_${cleanPhone}`,
          customerName: customerInfo.name.trim(),
          phone: customerInfo.phone.trim(),
          email: emailFallback,
          address: customerInfo.address.trim(),
          neighborhood: customerInfo.neighborhood.trim(),
          city: customerInfo.city.trim(),
          department: customerInfo.department,
          deliveryNotes: customerInfo.deliveryNotes.trim(),
          paymentMethod: customerInfo.paymentMethod,
          items: cart,
          total: grandTotal,
          trackingCode: generatedTracking,
        });
      } catch (fErr) {
        console.warn('[Firestore] Advertencia al sincronizar orden:', fErr);
      }

      setOrderConfirmed({
        id: generatedOrderId,
        trackingCode: generatedTracking,
        items: [...cart],
        subtotal,
        shippingCost,
        total: grandTotal,
        customerName: customerInfo.name.trim(),
        phone: customerInfo.phone.trim(),
        address: customerInfo.address.trim(),
        neighborhood: customerInfo.neighborhood.trim(),
        city: customerInfo.city.trim(),
        department: customerInfo.department,
        deliveryNotes: customerInfo.deliveryNotes.trim(),
        paymentMethod: customerInfo.paymentMethod,
        date: new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }),
      });

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#e0141f', '#ffb4ab', '#25D366', '#ffffff'],
        });
      } catch (e) {}

      clearCart();
      showToast("¡PEDIDO REGISTRADO CON ÉXITO! PREPARANDO DESPACHO", "success");
    } catch (err) {
      console.error('[Checkout Error]', err);
      showToast(err.message || "NO SE PUDO REGISTRAR EL PEDIDO. REVISA LOS DATOS", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const copyTracking = () => {
    if (orderConfirmed?.trackingCode) {
      navigator.clipboard.writeText(orderConfirmed.trackingCode);
      showToast("CÓDIGO DE SEGUIMIENTO COPIADO", "info");
    }
  };

  return (
    <AuthGuard intent="checkout" fallbackMessage="Inicia sesión o regístrate para asegurar tu pedido contraentrega y activar el seguimiento en tiempo real con el taller.">
      <div className="w-full pt-2 pb-28 sm:pb-20 bg-[#0d0c0c] min-h-screen text-[#e6e1e1]">
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
              <span className="hidden xs:inline">PAGO CONTRAENTREGA // PAGA AL RECIBIR</span>
              <span className="xs:hidden">CONTRAENTREGA</span>
            </div>
          </div>

          {/* Pantalla de Confirmación de Pedido */}
          {orderConfirmed ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto p-4 sm:p-8 bg-[#1d1b1b] border border-[#5e3f3c] shadow-2xl text-center space-y-6"
            >
              <div className="inline-block bg-[#25D366] text-black font-mono font-bold text-xs px-3 py-1 uppercase tracking-wider">
                PEDIDO CONTRAENTREGA REGISTRADO // {orderConfirmed.id}
              </div>

              <div className="w-16 h-16 bg-[#141313] border-2 border-[#25D366] flex items-center justify-center text-[#25D366] mx-auto shadow-[0_0_20px_rgba(37,211,102,0.3)]">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h1 className="font-headline-md text-2xl sm:text-3xl uppercase text-white">
                  ¡Pedido Recibido con Éxito!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-300 max-w-md mx-auto">
                  Tu orden contraentrega está asegurada. <strong className="text-emerald-400">Pagas en mano cuando el artesano entregue tu paquete en tu puerta.</strong>
                </p>
              </div>

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

              {/* Botones de Acción Post-Compra */}
              <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
                <button
                  onClick={() => downloadReceiptPDF(orderConfirmed)}
                  className="min-h-[44px] px-5 py-2.5 bg-[#262424] border border-neutral-700 text-neutral-200 font-mono text-xs uppercase font-bold hover:bg-[#333030] flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" /> Descargar PDF
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
                    Finalizar Pedido // Colombia
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
                                  Color: {item.color || 'Asphalt'} // {item.size || 'MED'}
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

                            <div className="flex justify-between items-center mt-2">
                              {/* Selector de cantidad con Touch Target accesible (>= 44px) */}
                              <div className="flex items-center border border-neutral-700 bg-[#211f1f]">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1)}
                                  className="w-10 h-10 flex items-center justify-center text-lg text-white hover:bg-neutral-700 active:bg-neutral-600"
                                  aria-label="Restar una unidad"
                                >
                                  -
                                </button>
                                <span className="font-mono text-xs text-white min-w-7 text-center font-bold">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1)}
                                  className="w-10 h-10 flex items-center justify-center text-lg text-white hover:bg-neutral-700 active:bg-neutral-600"
                                  aria-label="Sumar una unidad"
                                >
                                  +
                                </button>
                              </div>

                              <span className="font-mono text-sm sm:text-base font-bold text-[#ffb4ab]">
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
                          <label className="text-[#ffb4ab] text-xs font-mono uppercase block mb-1">
                            Celular / WhatsApp <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            disabled={isProcessing}
                            placeholder="Ej: 301 569 0382"
                            value={customerInfo.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full min-h-[44px] bg-[#1c1a1a] border border-[#5e3f3c] px-3 text-base sm:text-sm text-white outline-none focus:border-[#25D366] transition-colors disabled:opacity-50"
                          />
                          <span className="text-[10px] text-neutral-500 font-mono block mt-0.5">
                            Te contactaremos antes de llegar a tu dirección.
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
                            placeholder="Ej: Medellín / Envigado"
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
                            placeholder="Ej: Laureles / El Poblado"
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
                        <span className="text-[#ffb4ab] text-xs font-mono uppercase block mb-2 font-bold flex items-center gap-1.5">
                          <Banknote className="w-4 h-4 text-emerald-400" />
                          ¿Cómo deseas pagar al recibir tu paquete?
                        </span>
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
                            <span className="text-xs font-mono">Efectivo al recibir en mano</span>
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
                            <span className="text-xs font-mono">Nequi / Daviplata al recibir</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Columna Derecha: Resumen de Liquidación */}
                  <div className="lg:col-span-5 xl:col-span-4 bg-[#141313] border border-[#5e3f3c] p-4 sm:p-6 lg:sticky lg:top-28 space-y-5 shadow-xl">
                    <h2 className="font-headline-md text-xl uppercase text-white border-b border-[#5e3f3c] pb-2">
                      Liquidación // Colombia
                    </h2>

                    <div className="flex flex-col gap-2 font-mono text-xs">
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>SUBTOTAL PIEZAS</span>
                        <span className="text-white font-bold">{formatCOP(subtotal)}</span>
                      </div>
                      <div className="flex justify-between items-center text-neutral-400">
                        <span>DOMICILIO PERSONAL</span>
                        <span className="text-white">
                          {shippingCost === 0 ? 'GRATIS (PROMO > $150.000)' : formatCOP(shippingCost)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-[#5e3f3c] pt-3">
                      <div className="flex justify-between items-end">
                        <span className="font-headline-md text-lg uppercase text-white">Total en Puerta</span>
                        <span className="font-mono text-2xl font-bold text-[#ffb4ab]">
                          {formatCOP(grandTotal)}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-emerald-400 text-right mt-1">
                        ✓ 0 Cobros online. Pagas al tener la pieza en tus manos.
                      </p>
                    </div>

                    {/* Términos y Botón Desktop/Tablet */}
                    <div className="space-y-4 pt-1">
                      <button
                        type="button"
                        onClick={() => setAgreed(!agreed)}
                        className="w-full min-h-[44px] flex items-start gap-3 text-left p-1 text-neutral-300 select-none"
                      >
                        <div
                          className={`w-5 h-5 min-w-[20px] border mt-0.5 flex items-center justify-center transition-colors ${
                            agreed ? 'bg-[#25D366] border-[#25D366] text-black font-bold' : 'border-neutral-600 bg-neutral-900'
                          }`}
                        >
                          {agreed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-mono leading-tight">
                          Acepto recibir la entrega personal y pagar el total acordado en mi dirección al artesano.
                        </span>
                      </button>

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
                          <span>Confirmar Pedido Contraentrega</span>
                        )}
                      </button>

                      <div className="p-3 bg-[#171515] border border-neutral-800 text-[11px] font-mono text-neutral-400 space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-300">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span className="font-bold">Garantía KuroPunk:</span>
                        </div>
                        <p>
                          Revisas el amigurumi, certificado y accesorios en mano antes de entregar el pago.
                        </p>
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </main>
          )}

          {/* Barra Fija Inferior en Móvil (Zona del Pulgar) */}
          {!orderConfirmed && cart.length > 0 && (
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#141313]/95 backdrop-blur-md border-t border-[#5e3f3c] p-3 px-4 shadow-[0_-8px_20px_rgba(0,0,0,0.6)]">
              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Total Contraentrega</span>
                  <span className="font-mono text-lg font-bold text-[#ffb4ab] leading-none">
                    {formatCOP(grandTotal)}
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
                    <span>Confirmar Pedido</span>
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
