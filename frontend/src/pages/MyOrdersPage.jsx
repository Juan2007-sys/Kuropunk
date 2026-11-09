import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeUserOrders } from '../services/firebase';
import { formatCOP } from '../utils/formatters';
import {
  Package,
  Clock,
  Hammer,
  Truck,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const STATUS_STEPS = [
  { key: 'esperando_pago', label: '1. Anticipo 20%', icon: Clock, desc: 'Reserva para órdenes > $50k' },
  { key: 'en_cola', label: '2. En Cola Oficial', icon: CheckCircle, desc: 'Anticipo validado / Turno asignado' },
  { key: 'in_production', label: '3. En Taller', icon: Hammer, desc: 'Tejiendo y ensamblando' },
  { key: 'shipped', label: '4. En Ruta', icon: Truck, desc: 'Entrega personal en camino' },
  { key: 'delivered', label: '5. Entregado', icon: CheckCircle, desc: 'Entregado y saldo pagado' }
];

export function MyOrdersPage({ onBackToShop, onSelectOrderForTracking }) {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Fast fallback timer for offline / demo mode
    const timer = setTimeout(() => {
      const localOrder = localStorage.getItem('kuropunk_last_order');
      if (localOrder) {
        try {
          setOrders([JSON.parse(localOrder)]);
        } catch (e) {}
      } else {
        setOrders([
          {
            id: 'KP-940218',
            customerData: {
              name: currentUser.displayName || 'Santiago Vélez',
              phone: currentUser.phoneNumber || '+57 301 569 0382',
              shippingAddress: 'Carrera 7 # 72 - 41, Apto 501, Chapinero (Bogotá)'
            },
            items: [
              { title: 'The Wanderer - Amigurumi Flagship', quantity: 1, unitPrice: 145000 },
              { title: 'Patrón: Scrap Bunny (PDF)', quantity: 1, unitPrice: 20000 }
            ],
            totalAmount: 165000,
            status: 'in_production',
            trackingNumber: 'KURO-TRK-88XP'
          }
        ]);
      }
      setLoading(false);
    }, 800);

    // Real-time Firestore onSnapshot listener
    const unsubscribe = subscribeUserOrders(
      currentUser.uid,
      (liveOrders) => {
        clearTimeout(timer);
        if (liveOrders && liveOrders.length > 0) {
          setOrders(liveOrders);
        }
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [currentUser]);

  const getStepIndex = (status) => {
    const s = String(status || '').toUpperCase();
    if (s.includes('DELIVER') || s.includes('ENTREG')) return 4;
    if (s.includes('SHIP') || s.includes('RUTA') || s.includes('DISPATCH')) return 3;
    if (s.includes('PRODUCT') || s.includes('TALLER')) return 2;
    if (s === 'EN_COLA' || s === 'CONFIRMED' || s === 'PLACED') return 1;
    return 0; // ESPERANDO_PAGO o VERIFICANDO_ANTICIPO
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      {/* Top Breadcrumb & User Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#5e3f3c] pb-6 mb-8 gap-4">
        <div>
          <div className="text-xs font-mono text-[#ffb4ab] tracking-widest uppercase mb-1">
            PORTAL DEL CLIENTE // MI CUENTA
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-4xl text-[#fff4f3] uppercase tracking-wider">
            MIS PEDIDOS Y SEGUIMIENTO EN VIVO
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Operativo: <span className="text-white font-bold">{currentUser?.displayName}</span> ({currentUser?.email})
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>NOTIFICACIONES WHATSAPP ACTIVAS</span>
          </div>
          <button
            onClick={onBackToShop}
            className="px-4 py-2 border border-[#5e3f3c] hover:border-[#ffb4ab] text-white font-mono text-xs uppercase transition-colors"
          >
            VOLVER AL SHOP
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <div className="w-10 h-10 border-2 border-[#e0141f] border-t-transparent animate-spin rounded-full" />
          <span className="font-mono text-xs text-[#ffb4ab] uppercase tracking-wider">
            CONSULTANDO BASE DE DATOS EN TIEMPO REAL...
          </span>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 p-8 bg-[#141313] border border-[#5e3f3c]">
          <Package className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h3 className="font-headline-md text-2xl text-white uppercase mb-2">
            NO TIENES PEDIDOS ACTIVOS
          </h3>
          <p className="font-body-md text-neutral-400 text-sm max-w-md mx-auto mb-6">
            Aún no has registrado órdenes contraentrega. Explora nuestras piezas de amigurumi de edición limitada o patrones de crochet.
          </p>
          <button
            onClick={onBackToShop}
            className="py-3 px-8 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-headline-md text-base uppercase tracking-wider transition-all"
          >
            EXPLORAR EL CATÁLOGO
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {orders.map((order) => {
            const currentStepIdx = getStepIndex(order.status);
            const isCancelled = order.status === 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-[#141313] border border-[#5e3f3c] hover:border-[#e0141f]/70 transition-all duration-300 p-6 sm:p-8"
              >
                {/* Order Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#2b2a29] pb-4 mb-6 gap-3">
                  <div>
                    <span className="font-mono text-[11px] text-[#ffb4ab] tracking-wider uppercase block">
                      ORDEN REGISTRADA
                    </span>
                    <span className="font-headline-md text-2xl text-white">
                      #{order.id}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-xs text-neutral-400">
                      Tracking:{' '}
                      <strong className="text-emerald-400">
                        {order.trackingNumber || order.trackingCode || 'KURO-TRK-77X'}
                      </strong>
                    </span>
                    <span
                      className={`px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider border ${
                        isCancelled
                          ? 'bg-red-950/60 border-red-600 text-red-400'
                          : 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Multi-step Visual Stepper */}
                {!isCancelled ? (
                  <div className="mb-8">
                    <div className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span>LÍNEA DE TIEMPO DEL PEDIDO EN VIVO</span>
                      <span className="text-emerald-400">
                        ● SINCRONIZADO CON EL TALLER
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3">
                      {STATUS_STEPS.map((step, idx) => {
                        const Icon = step.icon;
                        const isDone = idx < currentStepIdx;
                        const isCurrent = idx === currentStepIdx;

                        return (
                          <div
                            key={step.key}
                            className={`p-3 border transition-all ${
                              isCurrent
                                ? 'bg-[#211f1f] border-[#e0141f] shadow-[0_0_15px_rgba(224,20,31,0.2)]'
                                : isDone
                                ? 'bg-[#181616] border-emerald-800/80 text-emerald-400'
                                : 'bg-[#111010] border-neutral-800 text-neutral-600 opacity-60'
                            }`}
                          >
                            <div className="flex items-center space-x-2 mb-1.5">
                              <Icon
                                className={`w-4 h-4 shrink-0 ${
                                  isCurrent
                                    ? 'text-[#e0141f] animate-pulse'
                                    : isDone
                                    ? 'text-emerald-400'
                                    : 'text-neutral-600'
                                }`}
                              />
                              <span
                                className={`font-mono text-xs font-bold uppercase ${
                                  isCurrent ? 'text-white' : ''
                                }`}
                              >
                                {step.label}
                              </span>
                            </div>
                            <p className="font-mono text-[10px] text-neutral-400 leading-tight">
                              {step.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-950/40 border border-red-800 mb-6 flex items-center space-x-3 text-red-300 font-mono text-xs">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>
                      Esta orden fue cancelada. Si necesitas asistencia, contáctanos directamente a nuestro WhatsApp oficial.
                    </span>
                  </div>
                )}

                {/* Order Details & Items Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#181616] border border-[#2b2a29]">
                  {/* Left: Destination & Delivery Info */}
                  <div>
                    <span className="font-mono text-[11px] text-[#ffb4ab] uppercase tracking-wider block mb-2">
                      DETALLES DE DESPACHO EN COLOMBIA
                    </span>
                    <div className="font-mono text-xs text-neutral-300 space-y-1">
                      <p>
                        <strong className="text-white">Destinatario:</strong>{' '}
                        {order.customerData?.name || order.customerName}
                      </p>
                      <p>
                        <strong className="text-white">Celular:</strong>{' '}
                        {order.customerData?.phone || order.phone}
                      </p>
                      <p>
                        <strong className="text-white">Dirección:</strong>{' '}
                        {order.customerData?.shippingAddress || order.address}
                      </p>
                      <p className="text-[#ffb4ab] mt-2">
                        🛵 Entrega en mano directa por el artesano (+57 301 569 0382)
                      </p>
                    </div>
                  </div>

                  {/* Right: Items and Total in COP */}
                  <div>
                    <span className="font-mono text-[11px] text-[#ffb4ab] uppercase tracking-wider block mb-2">
                      PIEZAS SOLICITADAS
                    </span>
                    <div className="space-y-1.5 mb-3 font-mono text-xs">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between items-center gap-2 text-neutral-300">
                          <span className="truncate pr-2">
                            {item.quantity}x {item.title}
                          </span>
                          <span className="text-white shrink-0 font-bold">
                            {formatCOP((item.unitPrice || item.price) * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-[#333] pt-2 space-y-1 font-mono text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Total del Pedido:</span>
                        <span className="text-white font-bold">{formatCOP(order.totalAmount || order.total)}</span>
                      </div>
                      {(order.requiresDeposit || Number(order.totalAmount || order.total) > 50000) && (
                        <div className="flex justify-between text-[#ffb4ab]">
                          <span>Anticipo (20%):</span>
                          <span>
                            {formatCOP(
                              order.depositRequiredAmount ||
                                order.depositBaseAmount ||
                                Math.ceil(Number(order.totalAmount || order.total) * 0.20),
                            )}{' '}
                            ({order.paymentStatus || 'PENDIENTE'})
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-xs text-emerald-400 uppercase font-bold">
                          SALDO RESTANTE EN LA ENTREGA:
                        </span>
                        <span className="font-headline-md text-xl text-emerald-400">
                          {formatCOP(
                            order.remainingBalance !== undefined
                              ? order.remainingBalance
                              : Number(order.totalAmount || order.total) > 50000
                              ? Number(order.totalAmount || order.total) -
                                Math.ceil(Number(order.totalAmount || order.total) * 0.20)
                              : order.totalAmount || order.total,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
