import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeAllOrders,
  subscribeContactMessages,
  updateOrderStatusInFirestore,
  verifyOrderDepositInFirestore,
  deleteOrderInFirestore,
  clearAllOrdersInFirestore,
  saveProductInFirestore,
  deleteProductInFirestore,
  uploadProductImage,
  subscribeProducts,
  syncCatalogToFirestore,
  isFirebaseConfigured
} from '../services/firebase';
import {
  formatCOP,
  buildWhatsAppUrl,
  generateAdminToCustomerWhatsAppUrl,
  generateAdminDepositNoticeWhatsAppUrl,
} from '../utils/formatters';
import {
  getContactMessages,
  getAllOrders,
  verifyOrderDeposit,
  updateOrderStatusApi,
  deleteOrderApi,
  clearAllOrdersApi,
  syncProductToBackendApi,
} from '../services/api';
import { PRODUCTS as fallbackCatalog, PUNTO_CRUZ_PRODUCTS, PATRONES_PRODUCTS } from '../data/products';
import {
  Package,
  Layers,
  Upload,
  Save,
  Trash2,
  Edit3,
  Clock,
  CheckCircle2,
  Hammer,
  Truck,
  AlertTriangle,
  Send,
  Plus,
  RefreshCw,
  Eye,
  MessageSquare,
  X,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';

const ORDER_STATUS_OPTIONS = [
  { value: 'ESPERANDO_PAGO', label: '0A. Esperando Anticipo (20%)', color: 'text-amber-400' },
  { value: 'VERIFICANDO_ANTICIPO', label: '0B. Verificando Anticipo', color: 'text-yellow-400' },
  { value: 'EN_COLA', label: '1. En Cola Oficial (Anticipo OK)', color: 'text-emerald-400' },
  { value: 'placed', label: '1B. Creado / Placed', color: 'text-amber-400' },
  { value: 'confirmed', label: '2. Confirmado', color: 'text-blue-400' },
  { value: 'in_production', label: '3. En Producción (Taller)', color: 'text-purple-400' },
  { value: 'shipped', label: '4. Enviado (En Ruta)', color: 'text-emerald-400' },
  { value: 'delivered', label: '5. Entregado en Mano', color: 'text-green-500' },
  { value: 'cancelled', label: '6. Cancelado', color: 'text-red-500' }
];

function playRadarChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime);
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    setTimeout(() => {
      try {
        ctx.close();
      } catch {}
    }, 600);
  } catch (e) {}
}

export function AdminPage({ onBackToShop }) {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'commissions'
  const [contactMessages, setContactMessages] = useState([]);

  // Confirmation Modal State (replaces native window.confirm to eliminate "localhost dice")
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'CONFIRMAR',
    cancelText: 'CANCELAR',
    isDanger: false,
    onConfirm: null
  });

  const closeConfirm = () => {
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Orders State & Radar Real-Time
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [orderQueueFilter, setOrderQueueFilter] = useState('split'); // 'split' | 'pre_queue' | 'official_queue'
  const prevOrderCountRef = React.useRef(0);

  // Products State
  const [productsList, setProductsList] = useState(fallbackCatalog);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [savingProduct, setSavingProduct] = useState(false);
  const [syncingCatalog, setSyncingCatalog] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualImageUrl, setManualImageUrl] = useState('');

  // Product Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTechnique, setFormTechnique] = useState('amigurumi');
  const [formPrice, setFormPrice] = useState(145000);
  const [formStock, setFormStock] = useState(10);
  const [formSizes, setFormSizes] = useState(['M']);
  const [formImages, setFormImages] = useState([]);
  const [formIsActive, setFormIsActive] = useState(true);

  // Real-time Orders Subscription + Backend Sync
  useEffect(() => {
    const mergeOrdersLists = (listA = [], listB = []) => {
      const map = new Map();
      for (const item of [...listA, ...listB]) {
        if (!item || !item.id) continue;
        map.set(String(item.id), { ...(map.get(String(item.id)) || {}), ...item });
      }
      return Array.from(map.values());
    };

    if (!isFirebaseConfigured) {
      getAllOrders()
        .then((backendOrders) => {
          if (Array.isArray(backendOrders) && backendOrders.length > 0) {
            setOrders(backendOrders);
          } else {
            setOrders([]);
          }
          setLoadingOrders(false);
        })
        .catch(() => {
          setLoadingOrders(false);
        });
    }

    const timer = setTimeout(() => {
      setLoadingOrders(false);
    }, 800);

    const unsubscribe = subscribeAllOrders(
      (liveOrders) => {
        clearTimeout(timer);
        if (liveOrders && liveOrders.length > 0) {
          if (prevOrderCountRef.current > 0 && liveOrders.length > prevOrderCountRef.current) {
            playRadarChime();
            toast.success(`⚡ ¡NUEVO PEDIDO EN RADAR! #${liveOrders[0].id}`, {
              description: `Cliente: ${liveOrders[0].customerData?.name || liveOrders[0].customerName || 'Cliente'}`
            });
          }
          prevOrderCountRef.current = liveOrders.length;
          setOrders(liveOrders);
        } else {
          setOrders([]);
        }
        setLoadingOrders(false);
      },
      () => {
        setLoadingOrders(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  // Real-time Contact Messages & Commissions Subscription
  useEffect(() => {
    // 1. Fetch from backend as complement
    getContactMessages()
      .then((backendMsgs) => {
        if (Array.isArray(backendMsgs) && backendMsgs.length > 0) {
          setContactMessages((prev) => {
            const existingIds = new Set(prev.map((m) => String(m.id)));
            const newOnes = backendMsgs.filter((bm) => !existingIds.has(String(bm.id)));
            return [...prev, ...newOnes];
          });
        }
      })
      .catch(() => {});

    // 2. Real-time Firestore + LocalStorage subscription
    const unsubscribe = subscribeContactMessages(
      (liveMsgs) => {
        if (liveMsgs) {
          setContactMessages((prev) => {
            const liveIds = new Set(liveMsgs.map((m) => String(m.id)));
            const leftovers = prev.filter((p) => !liveIds.has(String(p.id)));
            return [...liveMsgs, ...leftovers];
          });
        }
      },
      (err) => {
        console.warn('[AdminPage] Contact messages subscription fallback:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Real-time Products Subscription from Firestore
  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (liveProducts) => {
        if (liveProducts && liveProducts.length > 0) {
          setProductsList(liveProducts);
        }
      },
      (err) => {
        console.warn('[AdminPage] Products subscription fallback:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  // Bulk sync default catalog to Firestore via styled ConfirmModal
  const handleSyncInitialCatalog = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'SINCRONIZAR A FIRESTORE',
      message: '¿Deseas subir todos los coleccionables, piezas de punto cruz y patrones predeterminados a tu base de datos Firebase Cloud Firestore?',
      confirmText: 'SÍ, SINCRONIZAR',
      cancelText: 'CANCELAR',
      isDanger: false,
      onConfirm: async () => {
        closeConfirm();
        setSyncingCatalog(true);
        try {
          const allItems = [...fallbackCatalog, ...PUNTO_CRUZ_PRODUCTS, ...PATRONES_PRODUCTS].filter(p => p.isActive !== false);
          const count = await syncCatalogToFirestore(allItems);
          toast.success(`¡Catálogo inicial sincronizado con éxito! (${count} piezas en Firestore)`);
        } catch (err) {
          toast.error(`Error al sincronizar: ${err.message}`);
        } finally {
          setSyncingCatalog(false);
        }
      }
    });
  };

  // Handle Order Status Mutation with Guided Steps & Stock Restitution
  const handleStatusChange = async (orderId, newStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);

    if (newStatus === 'cancelled' || newStatus === 'CANCELLED') {
      setConfirmConfig({
        isOpen: true,
        title: 'CANCELAR ORDEN · TALLER',
        message: `¿Estás seguro de cancelar la orden #${orderId}? Las piezas reservadas serán restituidas al inventario disponible de inmediato.`,
        confirmText: 'SÍ, CANCELAR Y RESTITUIR STOCK',
        cancelText: 'VOLVER',
        isDanger: true,
        onConfirm: async () => {
          closeConfirm();
          await executeStatusUpdate(orderId, 'cancelled', targetOrder);
        }
      });
      return;
    }

    await executeStatusUpdate(orderId, newStatus, targetOrder);
  };

  const executeStatusUpdate = async (orderId, newStatus, targetOrder) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);

      // Sincronizar cambio de estado con el backend NestJS (incluyendo restitución de stock al cancelar)
      try {
        await updateOrderStatusApi(orderId, newStatus);
      } catch (e) {
        console.warn('[AdminPage] Sincronización de estado en backend:', e);
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      if (selectedOrderDetail && selectedOrderDetail.id === orderId) {
        setSelectedOrderDetail((prev) => prev ? { ...prev, status: newStatus } : null);
      }
      toast.success(`Estado de orden #${orderId} actualizado a "${newStatus}".`);
    } catch (err) {
      toast.error('Error al actualizar estado en Firestore: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const [lastVerifiedNotice, setLastVerifiedNotice] = useState(null);
  const [previewProofUrl, setPreviewProofUrl] = useState(null);

  // Handle Admin Deposit Verification (Confirm -> EN_COLA + queuedAt, Reject -> ESPERANDO_PAGO + RECHAZADO)
  const handleVerifyDeposit = async (orderId, action) => {
    const act = String(action || '').toUpperCase();
    const targetOrder = orders.find((o) => String(o.id) === String(orderId));
    setUpdatingOrderId(orderId);
    try {
      const [backendRes] = await Promise.allSettled([
        verifyOrderDeposit(orderId, { action: act }),
        verifyOrderDepositInFirestore(orderId, act),
      ]);
      const updatedFromBackend = backendRes.status === 'fulfilled' ? backendRes.value : null;

      const nowIso = updatedFromBackend?.queuedAt || new Date().toISOString();
      const nextStatus = act === 'CONFIRM' ? 'EN_COLA' : 'ESPERANDO_PAGO';
      const nextPaymentStatus = act === 'CONFIRM' ? 'ANTICIPO_VERIFICADO' : 'RECHAZADO';

      const mergedOrder = targetOrder
        ? {
            ...targetOrder,
            status: nextStatus,
            paymentStatus: nextPaymentStatus,
            queuedAt: act === 'CONFIRM' ? nowIso : null,
          }
        : null;

      setOrders((prev) =>
        prev.map((o) =>
          String(o.id) === String(orderId)
            ? {
                ...o,
                status: nextStatus,
                paymentStatus: nextPaymentStatus,
                queuedAt: act === 'CONFIRM' ? nowIso : null
              }
            : o
        )
      );

      if (selectedOrderDetail && String(selectedOrderDetail.id) === String(orderId)) {
        setSelectedOrderDetail((prev) =>
          prev
            ? {
                ...prev,
                status: nextStatus,
                paymentStatus: nextPaymentStatus,
                queuedAt: act === 'CONFIRM' ? nowIso : null
              }
            : null
        );
      }

      if (mergedOrder) {
        setLastVerifiedNotice({
          order: mergedOrder,
          action: act,
          whatsappUrl: generateAdminDepositNoticeWhatsAppUrl(mergedOrder, act),
        });
      }

      if (act === 'CONFIRM') {
        playRadarChime();
        const waUrl = mergedOrder ? generateAdminDepositNoticeWhatsAppUrl(mergedOrder, 'CONFIRM') : '';
        toast.success(
          `¡Anticipo aceptado! Orden #${orderId} enviada a la Cola Oficial y notificada en la página del cliente.`,
          waUrl
            ? {
                action: {
                  label: 'Avisar por WhatsApp',
                  onClick: () => window.open(waUrl, '_blank', 'noopener,noreferrer'),
                },
                duration: 8000,
              }
            : undefined,
        );
      } else {
        const waRejectUrl = mergedOrder ? generateAdminDepositNoticeWhatsAppUrl(mergedOrder, 'REJECT') : '';
        toast.warning(
          `Anticipo rechazado para la orden #${orderId}. Se notificó en la página que el pago no fue validado.`,
          waRejectUrl
            ? {
                action: {
                  label: 'Avisar por WhatsApp',
                  onClick: () => window.open(waRejectUrl, '_blank', 'noopener,noreferrer'),
                },
                duration: 8000,
              }
            : undefined,
        );
      }
    } catch (err) {
      toast.error('Error al verificar anticipo: ' + (err.message || 'Intenta de nuevo'));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleDeleteOrder = (orderId) => {
    setConfirmConfig({
      isOpen: true,
      title: 'ELIMINAR ORDEN',
      message: `¿Estás seguro de eliminar permanentemente la orden #${orderId}? Esta acción eliminará el pedido de la base de datos y de la memoria local.`,
      confirmText: 'SÍ, ELIMINAR',
      cancelText: 'CANCELAR',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          setOrders((prev) => prev.filter((o) => String(o.id) !== String(orderId)));
          if (selectedOrderDetail && String(selectedOrderDetail.id) === String(orderId)) {
            setSelectedOrderDetail(null);
          }
          await Promise.allSettled([
            deleteOrderInFirestore(orderId),
            deleteOrderApi(orderId),
          ]);
          toast.success(`Orden #${orderId} eliminada correctamente.`);
        } catch (err) {
          console.error('[AdminPage Delete Order Error]', err);
          toast.error(`Error al eliminar orden: ${err?.message || err}`);
        }
      }
    });
  };

  const handleClearAllOrders = () => {
    setConfirmConfig({
      isOpen: true,
      title: 'REINICIAR ÓRDENES A CERO',
      message: '¿Estás seguro de eliminar TODAS las órdenes del sistema? El contador quedará en cero pedidos.',
      confirmText: 'SÍ, DEJAR EN CEROS',
      cancelText: 'CANCELAR',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          const allIds = orders.map((o) => o.id);
          setOrders([]);
          setSelectedOrderDetail(null);
          await Promise.allSettled([
            clearAllOrdersInFirestore(allIds),
            clearAllOrdersApi(),
          ]);
          toast.success('Todas las órdenes han sido eliminadas. Sistema en ceros.');
        } catch (err) {
          console.error('[AdminPage Clear All Error]', err);
          toast.error(`Error al vaciar órdenes: ${err?.message || err}`);
        }
      }
    });
  };

  // Separación estricta Pre-Cola vs Cola de Producción Oficial
  const isPreQueueStatus = (st) => {
    const u = String(st || '').toUpperCase();
    return u === 'ESPERANDO_PAGO' || u === 'VERIFICANDO_ANTICIPO';
  };

  const preQueueOrders = orders.filter((o) => isPreQueueStatus(o.status));
  const officialQueueOrders = orders
    .filter((o) => !isPreQueueStatus(o.status))
    .slice()
    .sort((a, b) => {
      const hasQueueA = Boolean(a.queuedAt);
      const hasQueueB = Boolean(b.queuedAt);
      if (hasQueueA && !hasQueueB) return -1;
      if (!hasQueueA && hasQueueB) return 1;
      const timeA = new Date(a.queuedAt || a.createdAt || 0).getTime();
      const timeB = new Date(b.queuedAt || b.createdAt || 0).getTime();
      return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
    });

  // Handle Product Image Upload to Firebase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const downloadUrl = await uploadProductImage(file, formSlug || 'prod', (pct) => {
        setUploadProgress(pct);
      });
      setFormImages((prev) => [...prev, downloadUrl]);
      toast.success('Imagen subida exitosamente a Firebase Storage.');
    } catch (err) {
      console.error('[AdminPage Image Upload Error]', {
        code: err?.code,
        message: err?.message,
        err
      });
      // Fallback local en modo desarrollo para previsualización inmediata
      const fakeUrl = URL.createObjectURL(file);
      setFormImages((prev) => [...prev, fakeUrl]);
      toast.info('Imagen cargada en previsualización local.');
    } finally {
      setUploadingImage(false);
      setUploadProgress(0);
    }
  };

  const handleAddManualImage = () => {
    if (!manualImageUrl || !manualImageUrl.trim()) return;
    const url = manualImageUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      toast.error('La URL de la imagen debe comenzar con http:// o https://');
      return;
    }
    setFormImages((prev) => [...prev, url]);
    setManualImageUrl('');
    toast.success('Imagen agregada al arsenal de la pieza.');
  };

  // Handle Product Form Submit (Create or Update with Storage + Firestore Flow)
  const handleSaveProduct = async (e) => {
    e.preventDefault();

    // 1. Validaciones de campos obligatorios en español
    if (!formTitle || !formTitle.trim()) {
      toast.error('El título de la pieza es obligatorio.');
      return;
    }

    const numericPrice = Number(formPrice);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      toast.error('El precio debe ser un valor numérico mayor a $0 COP.');
      return;
    }

    const numericStock = Number(formStock);
    if (isNaN(numericStock) || numericStock < 0) {
      toast.error('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setSavingProduct(true);

    try {
      // 2. Flujo de subida a Storage si hay un archivo seleccionado pendiente
      let finalImages = [...formImages];
      if (selectedFile && finalImages.length === 0) {
        setUploadingImage(true);
        setUploadProgress(0);
        try {
          const downloadUrl = await uploadProductImage(selectedFile, formSlug || 'prod', (pct) => {
            setUploadProgress(pct);
          });
          finalImages = [downloadUrl];
          setFormImages([downloadUrl]);
        } catch (storageErr) {
          console.error('[AdminPage Storage Flow Error]', {
            code: storageErr?.code,
            message: storageErr?.message,
            storageErr
          });
          finalImages = ['https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd'];
        } finally {
          setUploadingImage(false);
          setUploadProgress(0);
        }
      }

      if (finalImages.length === 0) {
        finalImages = ['https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd'];
      }

      const defaultCover = finalImages[0];

      // 3. Estructuración con coerción de datos estricta a Number
      const payload = {
        id: editingProduct?.id || formSlug || `prod-${Date.now()}`,
        title: formTitle.trim(),
        slug: formSlug.trim() || formTitle.toLowerCase().trim().replace(/\s+/g, '-'),
        description: formDescription.trim(),
        technique: formTechnique,
        price: numericPrice,
        stock: numericStock,
        sizesAvailable: formSizes,
        images: finalImages.length > 0 ? finalImages : [defaultCover],
        imageUrl: defaultCover,
        image: defaultCover,
        isActive: Boolean(formIsActive),
        destacado: true
      };

      // 4. Guardado en Firestore + sincronización de stock/precio en Backend SQLite en paralelo
      await saveProductInFirestore(payload);
      syncProductToBackendApi(payload).catch(() => {});
      toast.success(`¡Pieza "${payload.title}" guardada exitosamente!`);

      // Actualizar estado en UI reactiva
      setProductsList((prev) => {
        const idx = prev.findIndex((p) => p.id === payload.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = payload;
          return copy;
        }
        return [payload, ...prev];
      });

      resetProductForm();
    } catch (firestoreError) {
      console.error('[AdminPage Firestore Error]', {
        code: firestoreError?.code,
        message: firestoreError?.message,
        firestoreError
      });

      if (firestoreError?.code === 'permission-denied') {
        toast.error('Error de permisos en Firestore (permission-denied). Verifica las reglas de seguridad o autentícate como administrador.');
      } else {
        toast.error(`Error al guardar en Firestore (${firestoreError?.code || 'desconocido'}): ${firestoreError?.message || 'Revisa la consola'}`);
      }
    } finally {
      setSavingProduct(false);
    }
  };

  const handleEditProduct = (prod) => {
    setEditingProduct(prod);
    setFormTitle(prod.title || '');
    setFormSlug(prod.slug || prod.id || '');
    setFormDescription(prod.description || '');
    setFormTechnique(prod.technique || 'amigurumi');
    setFormPrice(prod.price || 0);
    setFormStock(prod.stock || 0);
    setFormSizes(prod.sizesAvailable || ['M']);
    setFormImages(prod.images || [prod.image].filter(Boolean));
    setSelectedFile(null);
    setFormIsActive(prod.isActive !== false);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleDeleteProduct = (id, title = '') => {
    const label = title ? `"${title}"` : `la pieza ${id}`;
    setConfirmConfig({
      isOpen: true,
      title: 'ELIMINAR PIEZA',
      message: `¿Estás seguro de eliminar permanentemente ${label} (${id}) de Firebase Firestore y de la tienda?`,
      confirmText: 'ELIMINAR PIEZA',
      cancelText: 'CANCELAR',
      isDanger: true,
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteProductInFirestore(id);
          toast.success(`Pieza ${label} eliminada exitosamente.`);
          setProductsList((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
          console.error('[AdminPage Delete Error]', err);
          toast.error(`Error al eliminar (${err?.code || 'error'}): ${err?.message}`);
        }
      }
    });
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setSelectedFile(null);
    setFormTitle('');
    setFormSlug('');
    setFormDescription('');
    setFormTechnique('amigurumi');
    setFormPrice(145000);
    setFormStock(10);
    setFormSizes(['M']);
    setFormImages([]);
    setFormIsActive(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#e0141f] pb-6 mb-8 gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-[#ffb4ab] tracking-widest uppercase mb-1">
            <span className="w-2 h-2 bg-[#e0141f] rounded-full animate-ping" />
            <span>KUROPUNK · PANEL DE ADMINISTRACIÓN [RBAC ACTIVO]</span>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-5xl text-white uppercase tracking-wider">
            PANEL DE ADMINISTRACIÓN Y TALLER
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Sesión: <span className="text-white font-bold">{currentUser?.displayName}</span> (
            <span className="text-emerald-400">{currentUser?.email}</span>) · Rol: ADMIN
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToShop}
            className="px-4 py-2 border border-[#5e3f3c] hover:border-[#ffb4ab] text-white font-mono text-xs uppercase transition-colors"
          >
            VER TIENDA
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 font-mono text-xs uppercase transition-colors"
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3 sm:py-3.5 px-4 sm:px-6 font-headline-md text-base sm:text-xl uppercase tracking-wider border-2 transition-all flex items-center justify-center space-x-3 min-h-[48px] ${
            activeTab === 'orders'
              ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_20px_rgba(224,20,31,0.3)]'
              : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5 shrink-0" />
          <span>ÓRDENES ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('commissions')}
          className={`py-3 sm:py-3.5 px-4 sm:px-6 font-headline-md text-base sm:text-xl uppercase tracking-wider border-2 transition-all flex items-center justify-center space-x-3 min-h-[48px] ${
            activeTab === 'commissions'
              ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_20px_rgba(224,20,31,0.3)]'
              : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-5 h-5 shrink-0" />
          <span>COMISIONES ({contactMessages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 sm:py-3.5 px-4 sm:px-6 font-headline-md text-base sm:text-xl uppercase tracking-wider border-2 transition-all flex items-center justify-center space-x-3 min-h-[48px] ${
            activeTab === 'products'
              ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_20px_rgba(224,20,31,0.3)]'
              : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5 shrink-0" />
          <span>PRODUCTOS Y STOCK</span>
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE ÓRDENES (PRE-COLA VS. COLA DE PRODUCCIÓN OFICIAL) */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#141313] border border-[#5e3f3c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-md text-2xl text-white uppercase">
                CONTROL DE ANTICIPOS Y COLA DE PRODUCCIÓN
              </h2>
              <p className="font-mono text-xs text-neutral-400">
                Los pedidos desde $50.000 COP permanecen en Pre-Cola hasta que confirmes el ingreso del anticipo exacto del 20% con su comprobante.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center space-x-2 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CANDADO ANTI-FRAUDE 20% ACTIVO</span>
            </div>
          </div>

          {/* Sub-Filtros: Pre-Cola vs Cola Oficial */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOrderQueueFilter('pre_queue')}
              className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border transition-all flex items-center gap-2 ${
                orderQueueFilter === 'pre_queue'
                  ? 'bg-amber-600 border-amber-400 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                  : 'bg-[#141313] border-[#5e3f3c] text-amber-300 hover:border-amber-400'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>1. Por Confirmar Anticipo ({preQueueOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderQueueFilter('official_queue')}
              className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border transition-all flex items-center gap-2 ${
                orderQueueFilter === 'official_queue'
                  ? 'bg-emerald-600 border-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                  : 'bg-[#141313] border-[#5e3f3c] text-emerald-300 hover:border-emerald-400'
              }`}
            >
              <Hammer className="w-4 h-4" />
              <span>2. Cola de Producción Oficial ({officialQueueOrders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setOrderQueueFilter('split')}
              className={`px-4 py-2.5 font-mono text-xs uppercase font-bold border transition-all flex items-center gap-2 ${
                orderQueueFilter === 'split'
                  ? 'bg-[#e0141f] border-[#e0141f] text-white'
                  : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Ver Ambas Secciones Separadas</span>
            </button>

            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="ml-auto px-4 py-2.5 font-mono text-xs uppercase font-bold border border-red-700/80 bg-red-950/70 hover:bg-red-900 text-red-200 transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                title="Eliminar todas las órdenes y reiniciar contador a ceros"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Vaciar Todas Las Órdenes (Dejar en Cero)</span>
              </button>
            )}
          </div>

          {loadingOrders ? (
            <div className="py-20 text-center font-mono text-xs text-[#ffb4ab]">
              CARGANDO ÓRDENES EN TIEMPO REAL...
            </div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center bg-[#141313] border border-[#5e3f3c] p-8 space-y-4">
              <Package className="w-14 h-14 text-neutral-600 mx-auto" />
              <h3 className="font-headline-md text-2xl text-white uppercase tracking-wider">
                0 PEDIDOS REGISTRADOS
              </h3>
              <p className="font-mono text-xs text-neutral-400 max-w-md mx-auto">
                No hay ninguna orden en el sistema. Los nuevos pedidos realizados por clientes aparecerán aquí automáticamente en tiempo real.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Banner rápido para notificar al cliente por WhatsApp tras aprobar o rechazar su anticipo */}
              {lastVerifiedNotice && (
                <div
                  className={`p-4 border-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs ${
                    lastVerifiedNotice.action === 'CONFIRM'
                      ? 'bg-emerald-950/40 border-[#25D366] text-emerald-200'
                      : 'bg-red-950/40 border-red-500 text-red-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <strong className="text-white text-sm uppercase block">
                      {lastVerifiedNotice.action === 'CONFIRM'
                        ? `✓ Anticipo Aceptado para Orden #${lastVerifiedNotice.order.id}`
                        : `⚠ Anticipo Rechazado para Orden #${lastVerifiedNotice.order.id}`}
                    </strong>
                    <span>
                      El estado ya se actualizó en vivo en la página del cliente. También puedes enviarle el aviso directo a su WhatsApp:
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lastVerifiedNotice.whatsappUrl && (
                      <a
                        href={lastVerifiedNotice.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2.5 bg-[#25D366] hover:bg-[#1fa851] text-black font-bold uppercase text-xs flex items-center gap-1.5 shadow-lg"
                      >
                        <MessageSquare className="w-4 h-4 fill-black" />
                        <span>Enviar Aviso por WhatsApp al Cliente</span>
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setLastVerifiedNotice(null)}
                      className="p-2 text-neutral-400 hover:text-white border border-neutral-700"
                      title="Cerrar aviso"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* SECCIÓN 1: POR CONFIRMAR ANTICIPO (ESPERANDO_PAGO y VERIFICANDO_ANTICIPO) */}
              {(orderQueueFilter === 'pre_queue' || orderQueueFilter === 'split') && (
                <div className="bg-[#141313] border-2 border-amber-500/60 p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-500/30 pb-3">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400 block font-bold">
                        SECCIÓN 1 · PRE-COLA DE VALIDACIÓN FINANCIERA
                      </span>
                      <h3 className="font-headline-md text-xl sm:text-2xl text-white uppercase">
                        POR CONFIRMAR ANTICIPO DEL 20% ({preQueueOrders.length})
                      </h3>
                      <p className="font-mono text-[11px] text-neutral-400">
                        Estos pedidos son de $50.000 COP o más y NO entran a la cola de tejido hasta que verifiques el ingreso exacto en Bre-B / Nequi.
                      </p>
                    </div>
                  </div>

                  {preQueueOrders.length === 0 ? (
                    <div className="py-8 text-center font-mono text-xs text-neutral-400 bg-[#1b1919] border border-[#363434]">
                      No hay pedidos pendientes por confirmar anticipo en este momento.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {preQueueOrders.map((order) => {
                        const isUpdating = updatingOrderId === order.id;
                        const totalVal = Number(order.totalAmount || order.total || 0);
                        const baseDep = Number(order.depositBaseAmount || Math.ceil(totalVal * 0.20));
                        const exactExpected = Number(order.depositRequiredAmount || baseDep);
                        const remBal = Number(order.remainingBalance ?? (totalVal - baseDep));
                        const cleanPhone = String(order.customerData?.phone || order.phone || '').replace(/\D/g, '');
                        const isVerifying = String(order.status || '').toUpperCase() === 'VERIFICANDO_ANTICIPO';

                        return (
                          <div
                            key={order.id}
                            className={`p-4 border-2 font-mono text-xs space-y-3 flex flex-col justify-between ${
                              isVerifying
                                ? 'bg-amber-950/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.12)]'
                                : 'bg-[#1a1818] border-[#5e3f3c]'
                            }`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2 border-b border-[#363434] pb-2">
                                <div>
                                  <button
                                    onClick={() => setSelectedOrderDetail(order)}
                                    className="text-white font-bold text-sm hover:text-[#ffb4ab] underline decoration-dotted"
                                  >
                                    #{order.id}
                                  </button>
                                  <span className="block text-[10px] text-neutral-400">
                                    Cliente: <strong className="text-white">{order.customerData?.name || order.customerName || 'Cliente'}</strong> • 📱 {order.customerData?.phone || order.phone}
                                  </span>
                                </div>
                                <span
                                  className={`px-2 py-0.5 text-[10px] font-bold uppercase border ${
                                    isVerifying
                                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                      : 'bg-red-950/60 border-red-500/50 text-[#ffb4ab]'
                                  }`}
                                >
                                  {isVerifying ? '⚡ COMPROBANTE REPORTADO' : '⏳ ESPERANDO PAGO'}
                                </span>
                              </div>

                              {/* Monto del Anticipo (20%) y Referencia del Cliente */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-black/70 border border-amber-500/40">
                                <div>
                                  <span className="text-[10px] text-amber-300 uppercase block font-bold">
                                    Valor del Anticipo (20%)
                                  </span>
                                  <strong className="font-headline-md text-2xl sm:text-3xl text-amber-400 tracking-wider block">
                                    {formatCOP(baseDep)}
                                  </strong>
                                  <span className="text-[10px] text-neutral-400">
                                    Total orden: {formatCOP(totalVal)} • Saldo 80%: {formatCOP(remBal)}
                                  </span>
                                </div>

                                <div className="border-t sm:border-t-0 sm:border-l border-neutral-800 pt-2 sm:pt-0 sm:pl-3">
                                  <span className="text-[10px] text-neutral-400 uppercase block">
                                    Referencia / Comprobante Cliente
                                  </span>
                                  {order.paymentReference ? (
                                    <strong className="text-sm text-emerald-400 font-bold tracking-wider block mt-0.5 break-all">
                                      REF: {order.paymentReference}
                                    </strong>
                                  ) : (
                                    <span className="text-xs text-neutral-500 italic block mt-0.5">
                                      Aún no ha enviado número de referencia
                                    </span>
                                  )}
                                  {order.paymentProofUrl && (
                                    <div className="mt-1.5 flex items-center gap-2">
                                      <img
                                        src={order.paymentProofUrl}
                                        alt="Comprobante"
                                        onClick={() => setPreviewProofUrl(order.paymentProofUrl)}
                                        className="w-10 h-10 object-cover border border-amber-400/60 cursor-pointer hover:opacity-80"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setPreviewProofUrl(order.paymentProofUrl)}
                                        className="inline-flex items-center gap-1 text-[10px] text-[#ffb4ab] hover:text-white underline cursor-pointer"
                                      >
                                        <Eye className="w-3 h-3" />
                                        <span>Ver foto del comprobante</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-[11px] text-neutral-300">
                                <strong className="text-neutral-500">Piezas:</strong>{' '}
                                {(order.items || []).map((it) => `${it.quantity || 1}x ${it.title}`).join(', ')}
                              </div>
                            </div>

                            {/* Botones de Acción de Confirmación o Rechazo */}
                            <div className="pt-2 border-t border-[#363434] flex flex-col sm:flex-row gap-2">
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleVerifyDeposit(order.id, 'CONFIRM')}
                                className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                              >
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                                <span>Confirmar que llegó la plata -&gt; Enviar a la Cola</span>
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => handleVerifyDeposit(order.id, 'REJECT')}
                                className="py-2.5 px-3 bg-red-950/90 hover:bg-red-900 border border-red-600 text-red-200 font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                              >
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>Rechazar / Pago no recibido</span>
                              </button>

                              {cleanPhone && (
                                <a
                                  href={buildWhatsAppUrl(cleanPhone, `Hola ${order.customerData?.name || order.customerName || 'Cliente'}, te escribimos de KuroPunk sobre el anticipo de tu orden #${order.id}`)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2.5 px-3 bg-[#1d1b1b] hover:bg-neutral-800 border border-[#5e3f3c] text-emerald-400 font-bold text-[11px] uppercase flex items-center justify-center gap-1"
                                  title="Contactar por WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>WA</span>
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteOrder(order.id)}
                                className="py-2.5 px-3 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-[11px] uppercase flex items-center justify-center gap-1 transition-colors cursor-pointer"
                                title="Eliminar orden permanentemente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Eliminar</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* SECCIÓN 2: COLA DE PRODUCCIÓN OFICIAL (EN_COLA, IN_PRODUCTION, SHIPPED, DELIVERED) */}
              {(orderQueueFilter === 'official_queue' || orderQueueFilter === 'split') && (
                <div className="space-y-3">
                  <div className="p-4 bg-[#141313] border-l-4 border-emerald-500 border-t border-r border-b border-[#5e3f3c] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400 block font-bold">
                        SECCIÓN 2 · TRABAJO REAL EN TALLER (ORDENADO POR LLEGADA / PAGO CONFIRMADO)
                      </span>
                      <h3 className="font-headline-md text-xl sm:text-2xl text-white uppercase">
                        COLA DE PRODUCCIÓN OFICIAL ({officialQueueOrders.length})
                      </h3>
                    </div>
                    <span className="font-mono text-[11px] text-neutral-400">
                      Orden estricto por <code className="text-emerald-400">queuedAt</code> (quién pagó primero)
                    </span>
                  </div>

                  <div className="overflow-x-auto bg-[#141313] border border-[#5e3f3c]">
                    <table className="w-full min-w-[920px] text-left font-mono text-xs border-collapse">
                      <thead>
                        <tr className="bg-[#1d1b1b] border-b-2 border-[#e0141f] text-[#ffb4ab]">
                          <th className="p-3">PUESTO / ORDEN</th>
                          <th className="p-3">CLIENTE & CELULAR</th>
                          <th className="p-3">DIRECCIÓN (BOGOTÁ / COL)</th>
                          <th className="p-3">TOTAL & SALDO 80%</th>
                          <th className="p-3">ACCIONES DE FLUJO (OMS)</th>
                          <th className="p-3 text-right">WHATSAPP / DETALLE</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2b2a29]">
                        {officialQueueOrders.map((order, index) => {
                          const isUpdating = updatingOrderId === order.id;
                          const cleanPhone = String(order.customerData?.phone || order.phone || '').replace(/\D/g, '');
                          const totalVal = Number(order.totalAmount || order.total || 0);
                          const remBalance =
                            Number(order.remainingBalance) > 0
                              ? Number(order.remainingBalance)
                              : totalVal >= 50000
                              ? totalVal - Math.ceil(totalVal * 0.20)
                              : totalVal;

                          // Estado siguiente en el ciclo de vida guiado
                          let nextAction = null;
                          if (order.status === 'placed') {
                            nextAction = { label: '✓ Confirmar', nextStatus: 'confirmed', bg: 'bg-blue-600 hover:bg-blue-700' };
                          } else if (order.status === 'confirmed' || order.status === 'EN_COLA') {
                            nextAction = { label: '🧵 A Taller', nextStatus: 'in_production', bg: 'bg-purple-600 hover:bg-purple-700' };
                          } else if (order.status === 'in_production') {
                            nextAction = { label: '🚚 Despachar', nextStatus: 'shipped', bg: 'bg-amber-600 hover:bg-amber-700' };
                          } else if (order.status === 'shipped') {
                            nextAction = { label: '📦 Entregado', nextStatus: 'delivered', bg: 'bg-emerald-600 hover:bg-emerald-700' };
                          }

                          return (
                            <tr key={order.id} className="hover:bg-[#1a1818] transition-colors">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-500/50 text-emerald-300 font-bold text-[10px]">
                                    #{index + 1} EN COLA
                                  </span>
                                  <button
                                    onClick={() => setSelectedOrderDetail(order)}
                                    className="text-left group cursor-pointer block"
                                    title="Ver ficha completa de la orden"
                                  >
                                    <strong className="text-white block font-bold group-hover:text-[#ffb4ab] transition-colors underline decoration-dotted">
                                      #{order.id}
                                    </strong>
                                  </button>
                                </div>
                                <span className="text-[10px] text-emerald-400 block mt-0.5">
                                  {order.trackingNumber || order.trackingCode || 'KURO-TRK-77X'}
                                </span>
                                {order.queuedAt && (
                                  <span className="text-[9px] text-neutral-500 block">
                                    Cola: {new Date(order.queuedAt).toLocaleString('es-CO')}
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="text-white font-bold">
                                  {order.customerData?.name || order.customerName || 'Cliente'}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  📱 {order.customerData?.phone || order.phone || 'N/A'}
                                </div>
                              </td>

                              <td className="p-3 max-w-xs text-neutral-300">
                                <span className="line-clamp-2">
                                  {order.customerData?.shippingAddress || order.address || 'Bogotá'}
                                </span>
                              </td>

                              <td className="p-3">
                                <strong className="text-white font-bold block">
                                  Total: {formatCOP(totalVal)}
                                </strong>
                                <span className="text-[10px] text-amber-300 font-bold block">
                                  Cobrar al entregar: {formatCOP(remBalance)}
                                </span>
                                {order.paymentReference && (
                                  <span className="text-[9px] text-emerald-400 block">
                                    ✓ Anticipo Ref: {order.paymentReference}
                                  </span>
                                )}
                              </td>

                              <td className="p-3">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  {/* Botón de acción rápida en 1 clic */}
                                  {nextAction && order.status !== 'cancelled' && (
                                    <button
                                      onClick={() => handleStatusChange(order.id, nextAction.nextStatus)}
                                      disabled={isUpdating}
                                      className={`px-2.5 py-1 text-white font-bold text-[10px] uppercase transition-all shadow ${nextAction.bg} disabled:opacity-50 shrink-0`}
                                    >
                                      {nextAction.label}
                                    </button>
                                  )}

                                  {/* Selector manual para cualquier estado */}
                                  <select
                                    value={order.status}
                                    disabled={isUpdating}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className="bg-[#211f1f] border border-[#5e3f3c] text-white px-2 py-1 font-mono text-xs focus:border-[#e0141f] outline-none cursor-pointer disabled:opacity-50"
                                  >
                                    {ORDER_STATUS_OPTIONS.map((opt) => (
                                      <option key={opt.value} value={opt.value} className="bg-[#141313]">
                                        {opt.label}
                                      </option>
                                    ))}
                                  </select>

                                  {isUpdating && (
                                    <RefreshCw className="w-3.5 h-3.5 text-[#e0141f] animate-spin" />
                                  )}
                                </div>
                              </td>

                              <td className="p-3 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {cleanPhone && (
                                    <a
                                      href={
                                        order.paymentStatus === 'ANTICIPO_VERIFICADO'
                                          ? generateAdminDepositNoticeWhatsAppUrl(order, 'CONFIRM')
                                          : buildWhatsAppUrl(cleanPhone, `Hola ${order.customerData?.name || order.customerName || 'Cliente'}, te escribimos de KuroPunk sobre tu orden #${order.id}`)
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-2 py-1 bg-emerald-950/80 border border-emerald-500/50 hover:bg-emerald-900 text-emerald-300 text-[10px] uppercase font-bold flex items-center gap-1"
                                      title="Enviar confirmación de pago aceptado o contactar por WhatsApp"
                                    >
                                      <MessageSquare className="w-3 h-3 fill-emerald-300" />
                                      <span className="hidden sm:inline">WhatsApp</span>
                                    </a>
                                  )}
                                  <button
                                    onClick={() => setSelectedOrderDetail(order)}
                                    className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] uppercase font-bold"
                                    title="Ver detalle completo"
                                  >
                                    Ficha
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOrder(order.id)}
                                    className="px-2 py-1 bg-red-950/80 border border-red-700/60 hover:bg-red-900 text-red-300 text-[10px] uppercase font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    title="Eliminar orden permanentemente"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MODAL DE PREVISUALIZACIÓN DE CAPTURA DE PAGO */}
          {previewProofUrl && (
            <div
              onClick={() => setPreviewProofUrl(null)}
              className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-[#141313] border-2 border-[#25D366] max-w-lg w-full p-4 space-y-3 font-mono text-xs"
              >
                <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-2">
                  <strong className="text-[#25D366] uppercase">Captura del Comprobante del Cliente</strong>
                  <button
                    type="button"
                    onClick={() => setPreviewProofUrl(null)}
                    className="p-1 text-neutral-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="max-h-[75vh] overflow-auto flex justify-center bg-black p-2">
                  <img src={previewProofUrl} alt="Comprobante de pago" className="max-w-full h-auto object-contain" />
                </div>
              </div>
            </div>
          )}

          {/* MODAL DETALLE DE ORDEN PARA EL ADMIN */}
          {selectedOrderDetail && (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-[#141313] border-2 border-[#e0141f] max-w-xl w-full p-6 shadow-2xl relative space-y-4 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-3">
                  <div>
                    <span className="text-[10px] text-[#ffb4ab] font-bold uppercase block">FICHA TÁCTICA DE ORDEN</span>
                    <h3 className="font-headline-md text-2xl text-white">#{selectedOrderDetail.id}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedOrderDetail(null)}
                    className="text-neutral-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 bg-[#1d1b1b] p-3 border border-[#5e3f3c]">
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block">Cliente</span>
                    <strong className="text-white text-sm block">{selectedOrderDetail.customerData?.name || selectedOrderDetail.customerName || 'Cliente'}</strong>
                    <span className="text-neutral-400">📱 {selectedOrderDetail.customerData?.phone || selectedOrderDetail.phone}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 text-[10px] uppercase block">Tracking Code</span>
                    <strong className="text-emerald-400 block">{selectedOrderDetail.trackingNumber || selectedOrderDetail.trackingCode}</strong>
                    <span className="text-[#ffb4ab] text-xs font-bold block pt-1">Total: {formatCOP(selectedOrderDetail.totalAmount || selectedOrderDetail.total)}</span>
                  </div>
                </div>

                {/* Desglose de Anticipo 20% y Saldo Restante 80% */}
                <div className="bg-black/60 p-3 border border-amber-500/40 grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase block">Anticipo Exacto</span>
                    <strong className="text-amber-400 text-xs">
                      {formatCOP(selectedOrderDetail.depositRequiredAmount || 0)}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase block">Ref. Bancaria</span>
                    <strong className="text-emerald-400 text-xs">
                      {selectedOrderDetail.paymentReference || 'N/A'}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-400 uppercase block">Saldo Entrega</span>
                    <strong className="text-white text-xs">
                      {formatCOP(selectedOrderDetail.remainingBalance ?? (selectedOrderDetail.totalAmount || selectedOrderDetail.total))}
                    </strong>
                  </div>
                </div>

                <div className="bg-[#1d1b1b] p-3 border border-[#5e3f3c] space-y-1">
                  <span className="text-neutral-500 text-[10px] uppercase block">Dirección de Despacho (Contraentrega)</span>
                  <p className="text-neutral-200">{selectedOrderDetail.customerData?.shippingAddress || selectedOrderDetail.address}</p>
                  {selectedOrderDetail.deliveryNotes && (
                    <p className="text-[#ffb4ab] text-[11px] pt-1">
                      <strong>Indicaciones:</strong> {selectedOrderDetail.deliveryNotes}
                    </p>
                  )}
                </div>

                <div>
                  <span className="text-neutral-400 text-[10px] uppercase block mb-2 font-bold">Piezas en la Orden</span>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(selectedOrderDetail.items || []).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-[#1b1919] border border-neutral-800">
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img src={item.image} alt={item.title} className="w-8 h-8 object-cover rounded" />
                          )}
                          <div>
                            <span className="text-white font-bold block">{item.title}</span>
                            <span className="text-neutral-400 text-[10px]">Cant: {item.quantity || 1} • {formatCOP(item.unitPrice || item.price)}</span>
                          </div>
                        </div>
                        <span className="text-[#ffb4ab] font-bold">{formatCOP((item.quantity || 1) * (item.unitPrice || item.price))}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones directo con el cliente / Eliminar */}
                <div className="flex gap-2 pt-2">
                  <a
                    href={buildWhatsAppUrl(selectedOrderDetail.customerData?.phone || selectedOrderDetail.phone || '', `Hola ${selectedOrderDetail.customerData?.name || selectedOrderDetail.customerName || 'Cliente'}, te escribimos del taller KuroPunk sobre tu pedido #${selectedOrderDetail.id}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 bg-[#25D366] hover:bg-[#1fa851] text-black font-bold uppercase flex items-center justify-center gap-2 shadow-lg text-xs"
                  >
                    <MessageSquare className="w-4 h-4 fill-black" />
                    <span>Escribir por WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(selectedOrderDetail.id)}
                    className="px-4 py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold uppercase flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                    title="Eliminar esta orden permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar Orden</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMISIONES Y CONTACTOS ENTRANTE */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#141313] border border-[#5e3f3c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-md text-2xl text-white uppercase">
                RADAR DE COMISIONES Y ENCARGOS 1-DE-1
              </h2>
              <p className="font-mono text-xs text-neutral-400">
                Solicitudes de piezas a medida, consultas de punto de cruz y mensajes directos recibidos desde la página de contacto.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-[#e0141f]/20 border border-[#e0141f]/40 text-[#ffb4ab] font-mono text-xs flex items-center space-x-2 shrink-0">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>TOTAL RECIBIDOS: {contactMessages.length}</span>
            </div>
          </div>

          {contactMessages.length === 0 ? (
            <div className="py-20 text-center bg-[#141313] border border-[#5e3f3c] font-mono text-xs text-neutral-400 space-y-2">
              <p className="text-sm text-[#ffb4ab]">NO HAY COMISIONES PENDIENTES</p>
              <p>Las nuevas solicitudes enviadas por los clientes aparecerán aquí automáticamente en tiempo real.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {contactMessages.map((msg) => {
                const dateStr = msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString('es-CO') : (msg.createdAt || 'Reciente');
                const hasPhone = Boolean(msg.phone && String(msg.phone).trim());
                const waUrl = hasPhone ? generateAdminToCustomerWhatsAppUrl(msg) : null;

                return (
                  <div key={msg.id} className="bg-[#141313] border-2 border-[#5e3f3c] hover:border-[#e0141f] p-5 space-y-4 font-mono text-xs transition-colors flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between border-b border-[#5e3f3c] pb-2">
                        <div>
                          <span className="text-[10px] text-[#ffb4ab] font-bold uppercase tracking-wider block">
                            {msg.typeLabel || (msg.type === 'commission' ? 'COMISIÓN 1-DE-1' : msg.type)}
                          </span>
                          <strong className="text-white text-base block font-headline-sm">{msg.name}</strong>
                        </div>
                        <span className="text-[10px] text-neutral-500">{dateStr}</span>
                      </div>

                      {/* Estimation details pills */}
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sizeLabel && (
                          <span className="px-2 py-0.5 bg-[#1d1b1b] border border-[#5e3f3c] text-neutral-300 text-[10px]">
                            📏 {msg.sizeLabel}
                          </span>
                        )}
                        {msg.hasPlatform !== undefined && (
                          <span className={`px-2 py-0.5 text-[10px] border ${msg.hasPlatform ? 'bg-[#e0141f]/20 border-[#e0141f] text-[#ffb4ab]' : 'bg-[#1d1b1b] border-[#5e3f3c] text-neutral-400'}`}>
                            {msg.hasPlatform ? '🪵 Con Base' : 'Portátil'}
                          </span>
                        )}
                        {msg.complexityLabel && (
                          <span className="px-2 py-0.5 bg-[#1d1b1b] border border-[#5e3f3c] text-neutral-300 text-[10px]">
                            ⚡ {msg.complexityLabel}
                          </span>
                        )}
                      </div>

                      {/* Estimated Price & Production Days */}
                      {(msg.estimatedPrice || msg.estimatedDays) && (
                        <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#1d1b1b] border border-[#363434]">
                          <div>
                            <span className="text-[9px] text-neutral-500 block uppercase">Estimación Base</span>
                            <span className="text-sm font-bold text-[#ffb4ab]">
                              {msg.estimatedPrice ? formatCOP(msg.estimatedPrice) : 'A definir'}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] text-neutral-500 block uppercase">Tiempo Taller</span>
                            <span className="text-xs font-bold text-white">
                              {msg.estimatedDays ? `${msg.estimatedDays} días hábiles` : 'A coordinar'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-neutral-300">
                        <p><strong className="text-neutral-500">Email:</strong> <a href={`mailto:${msg.email}`} className="text-[#ffb4ab] underline">{msg.email}</a></p>
                        {hasPhone && <p><strong className="text-neutral-500">WhatsApp / Móvil:</strong> <span className="text-white font-bold">{msg.phone}</span></p>}
                      </div>

                      <div className="bg-[#1d1b1b] p-3 border border-[#363434] text-neutral-200 whitespace-pre-wrap leading-relaxed">
                        <span className="text-[10px] text-neutral-500 uppercase block mb-1">Descripción / Requerimiento:</span>
                        "{msg.message || 'Sin descripción adicional'}"
                      </div>

                      {/* Photos if any */}
                      {Array.isArray(msg.images) && msg.images.length > 0 && (
                        <div>
                          <span className="text-[10px] text-neutral-500 uppercase block mb-1">Fotos de Referencia ({msg.images.length}):</span>
                          <div className="flex gap-2 flex-wrap">
                            {msg.images.map((imgUrl, i) => (
                              <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block w-14 h-14 border border-[#5e3f3c] hover:border-[#e0141f] overflow-hidden bg-black">
                                <img src={imgUrl} alt={`ref-${i}`} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions: Direct WhatsApp to customer & Email */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2 border-t border-[#363434]">
                      {hasPhone && waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-black font-bold uppercase flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          title="Contactar al cliente directamente por WhatsApp"
                        >
                          <MessageSquare className="w-4 h-4 fill-black" />
                          <span>Contactar al Cliente vía WhatsApp</span>
                        </a>
                      ) : (
                        <span className="py-2 px-3 bg-[#252222] text-neutral-500 text-center font-bold uppercase">
                          Sin teléfono registrado
                        </span>
                      )}
                      <a
                        href={`mailto:${msg.email}?subject=KuroPunk%20-%20Cotización%20de%20tu%20encargo&body=Hola%20${encodeURIComponent(msg.name)},%20te%20escribimos%20del%20taller%20KuroPunk...`}
                        className="py-2.5 px-3 bg-[#1d1b1b] hover:bg-[#252222] border border-[#5e3f3c] text-white text-center uppercase tracking-wider font-bold transition-colors"
                      >
                        Email
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: CRUD DE PRODUCTOS */}
      {activeTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-1 bg-[#141313] border-2 border-[#5e3f3c] p-6 self-start shadow-md">
            <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-3 mb-4">
              <h2 className="font-headline-md text-2xl text-white uppercase">
                {editingProduct ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
              </h2>
              {editingProduct && (
                <button
                  onClick={resetProductForm}
                  className="font-mono text-xs text-neutral-400 hover:text-white"
                >
                  CANCELAR
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 font-mono text-xs">
              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Título de la Pieza *
                </label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Ej: The Mechanic · Rogue Series"
                  className="w-full min-h-[44px] p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white text-base sm:text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Slug / ID Único
                </label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  placeholder="the-mechanic-v2"
                  className="w-full min-h-[44px] p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white text-base sm:text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Técnica Artesanal *
                </label>
                <select
                  value={formTechnique}
                  onChange={(e) => setFormTechnique(e.target.value)}
                  className="w-full min-h-[44px] p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white text-base sm:text-xs outline-none"
                >
                  <option value="amigurumi">Amigurumi (Coleccionable Físico)</option>
                  <option value="punto_cruz">Punto Cruz (Gráfico DMC / Kit)</option>
                  <option value="patron_pdf">Patrón PDF (Digital con HUD)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white text-base sm:text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Stock Disponible *
                  </label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full min-h-[44px] p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white text-base sm:text-xs outline-none"
                  />
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-neutral-400 uppercase mb-1.5">
                  Variantes de Tamaño Disponibles:
                </label>
                <div className="flex flex-wrap gap-2">
                  {['S', 'M', 'L', 'XXL'].map((sz) => {
                    const isSelected = formSizes.includes(sz);
                    return (
                      <button
                        type="button"
                        key={sz}
                        onClick={() => {
                          if (isSelected) {
                            setFormSizes(formSizes.filter((s) => s !== sz));
                          } else {
                            setFormSizes([...formSizes, sz]);
                          }
                        }}
                        className={`min-w-[44px] min-h-[44px] px-3.5 py-2 border font-bold uppercase flex items-center justify-center transition-colors active:scale-95 ${
                          isSelected
                            ? 'bg-[#e0141f] border-[#e0141f] text-white'
                            : 'bg-[#1d1b1b] border-[#5e3f3c] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Upload to Firebase Storage */}
              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Imágenes (Firebase Storage)
                </label>
                <div className="border-2 border-dashed border-[#5e3f3c] hover:border-[#ffb4ab] p-4 text-center cursor-pointer transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload className="w-6 h-6 text-neutral-400 mx-auto mb-2" />
                  <span className="text-neutral-300 block">
                    {uploadingImage ? 'Subiendo imagen...' : 'Toca para subir foto a Storage'}
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    PNG, JPG, WEBP hasta 10MB
                  </span>
                </div>

                {/* Progress bar if uploading */}
                {uploadingImage && (
                  <div className="mt-2">
                    <div className="flex justify-between text-[10px] text-[#ffb4ab] font-mono mb-1">
                      <span>SUBIENDO A STORAGE...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-neutral-800 h-1.5 overflow-hidden">
                      <div
                        className="bg-[#e0141f] h-full transition-all duration-150"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Manual URL input fallback */}
                <div className="mt-3 flex gap-2">
                  <input
                    type="url"
                    value={manualImageUrl}
                    onChange={(e) => setManualImageUrl(e.target.value)}
                    placeholder="O pega una URL directa de imagen (https://...)"
                    className="flex-1 p-2 bg-[#1d1b1b] border border-[#5e3f3c] text-white text-xs outline-none focus:border-[#e0141f]"
                  />
                  <button
                    type="button"
                    onClick={handleAddManualImage}
                    className="px-3 py-2 bg-neutral-800 hover:bg-[#e0141f] text-white text-xs font-mono uppercase transition-colors"
                  >
                    Agregar
                  </button>
                </div>

                {formImages.length > 0 && (
                  <div className="flex space-x-2 mt-3 overflow-x-auto">
                    {formImages.map((img, i) => (
                      <div key={i} className="relative group shrink-0">
                        <img
                          src={img}
                          alt="Preview"
                          className="w-14 h-14 object-cover border border-[#5e3f3c]"
                        />
                        <button
                          type="button"
                          onClick={() => setFormImages(formImages.filter((_, idx) => idx !== i))}
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Eliminar foto"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Descripción / Manifiesto
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles del hilado, hardware y acabado..."
                  className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 accent-[#e0141f]"
                />
                <label htmlFor="isActive" className="text-neutral-300 cursor-pointer">
                  Producto activo y visible en catálogo
                </label>
              </div>

              <button
                type="submit"
                disabled={savingProduct || uploadingImage}
                className="w-full py-3 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-headline-md text-lg uppercase tracking-wider transition-all flex items-center justify-center space-x-2 mt-4 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingProduct
                    ? 'GUARDANDO EN FIRESTORE...'
                    : uploadingImage
                    ? 'SUBIENDO IMAGEN...'
                    : editingProduct
                    ? 'ACTUALIZAR PIEZA'
                    : 'CREAR EN FIRESTORE'}
                </span>
              </button>
            </form>
          </div>

          {/* Catalog Table Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-4 bg-[#141313] border border-[#5e3f3c] flex justify-between items-center">
              <div>
                <h3 className="font-headline-md text-2xl text-white uppercase">
                  CATÁLOGO DE PRODUCTOS EN FIRESTORE
                </h3>
                <p className="font-mono text-xs text-neutral-400">
                  Total de ítems: {productsList.length}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSyncInitialCatalog}
                  disabled={syncingCatalog}
                  className="px-3 py-1.5 bg-[#e0141f]/20 hover:bg-[#e0141f]/40 border border-[#e0141f] text-[#ffb4ab] font-mono text-xs flex items-center space-x-1.5 transition-all disabled:opacity-50"
                  title="Sincronizar todos los productos base a Firebase Firestore"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncingCatalog ? 'animate-spin' : ''}`} />
                  <span>{syncingCatalog ? 'SUBIENDO...' : 'SINCRONIZAR A FIRESTORE'}</span>
                </button>
                <button
                  onClick={resetProductForm}
                  className="px-3 py-1.5 bg-[#e0141f] text-white font-mono text-xs uppercase flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>NUEVO</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productsList.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-[#141313] border border-[#5e3f3c] p-4 flex space-x-4 items-start hover:border-[#ffb4ab] transition-all"
                >
                  <img
                    src={prod.image || prod.imageUrl || prod.images?.[0]}
                    alt={prod.title}
                    className="w-20 h-20 object-cover border border-neutral-700 shrink-0 bg-neutral-900"
                  />
                  <div className="flex-1 min-w-0 font-mono">
                    <span className="text-[10px] text-[#ffb4ab] uppercase block">
                      {prod.technique || prod.type || 'amigurumi'} · Stock: {prod.stock ?? 5}
                    </span>
                    <h4 className="text-white font-bold text-sm truncate">{prod.title}</h4>
                    <p className="text-emerald-400 font-bold text-xs mt-1">
                      {formatCOP(prod.price)}
                    </p>

                    <div className="flex items-center space-x-2 mt-3 pt-2 border-t border-[#2b2a29]">
                      <button
                        onClick={() => handleEditProduct(prod)}
                        className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs flex items-center space-x-1"
                        title="Editar"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.title)}
                        className="p-1.5 bg-red-950 hover:bg-red-900 text-red-300 rounded text-xs flex items-center space-x-1"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Styled Confirmation Modal (No browser native "localhost dice" popups) */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        isDanger={confirmConfig.isDanger}
        isLoading={syncingCatalog}
        onConfirm={confirmConfig.onConfirm}
        onClose={closeConfirm}
      />
    </div>
  );
}
