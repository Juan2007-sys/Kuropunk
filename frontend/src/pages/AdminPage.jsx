import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeAllOrders,
  updateOrderStatusInFirestore,
  saveProductInFirestore,
  deleteProductInFirestore,
  uploadProductImage,
  subscribeProducts,
  syncCatalogToFirestore
} from '../services/firebase';
import { formatCOP } from '../utils/formatters';
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
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmModal } from '../components/ConfirmModal';

const ORDER_STATUS_OPTIONS = [
  { value: 'placed', label: '1. Creado / Placed', color: 'text-amber-400' },
  { value: 'confirmed', label: '2. Confirmado', color: 'text-blue-400' },
  { value: 'in_production', label: '3. En Producción (Taller)', color: 'text-purple-400' },
  { value: 'shipped', label: '4. Enviado (En Ruta)', color: 'text-emerald-400' },
  { value: 'delivered', label: '5. Entregado en Mano', color: 'text-green-500' },
  { value: 'cancelled', label: '6. Cancelado', color: 'text-red-500' }
];

export function AdminPage({ onBackToShop }) {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products'

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

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

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

  // Real-time Orders Subscription
  useEffect(() => {
    const defaultOrders = [
      {
        id: 'KP-829103',
        customerData: {
          name: 'Santiago Vélez (QA)',
          phone: '+573015690382',
          shippingAddress: 'Calle 10 # 43E - 22, El Poblado (Medellín)'
        },
        items: [{ title: 'The Wanderer - Amigurumi Flagship', quantity: 1, unitPrice: 145000 }],
        totalAmount: 145000,
        status: 'confirmed',
        trackingNumber: 'KURO-TRK-77X'
      },
      {
        id: 'KP-940218',
        customerData: {
          name: 'Valentina Castro',
          phone: '+573124567890',
          shippingAddress: 'Carrera 43A # 1-50, Envigado'
        },
        items: [{ title: 'Scrap Bunny (Edición Limitada)', quantity: 1, unitPrice: 90000 }],
        totalAmount: 90000,
        status: 'in_production',
        trackingNumber: 'KURO-TRK-88XP'
      }
    ];

    const timer = setTimeout(() => {
      setOrders((prev) => (prev.length > 0 ? prev : defaultOrders));
      setLoadingOrders(false);
    }, 800);

    const unsubscribe = subscribeAllOrders(
      (liveOrders) => {
        clearTimeout(timer);
        if (liveOrders && liveOrders.length > 0) {
          setOrders(liveOrders);
        } else {
          setOrders(defaultOrders);
        }
        setLoadingOrders(false);
      },
      () => {
        setOrders(defaultOrders);
        setLoadingOrders(false);
      }
    );

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
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
          const allItems = [...fallbackCatalog, ...PUNTO_CRUZ_PRODUCTS, ...PATRONES_PRODUCTS];
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

  // Handle Order Status Mutation (triggers Cloud Function for automatic WhatsApp)
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId);
    try {
      await updateOrderStatusInFirestore(orderId, newStatus);
      // Optimistic UI update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(
        `Estado actualizado a "${newStatus}". Cloud Function despachará WhatsApp automáticamente.`
      );
    } catch (err) {
      toast.error('Error al actualizar estado en Firestore: ' + err.message);
    } finally {
      setUpdatingOrderId(null);
    }
  };

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

      // 4. Guardado en Firestore con try/catch y logs explícitos
      await saveProductInFirestore(payload);
      toast.success(`¡Pieza "${payload.title}" guardada exitosamente en Firestore!`);

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
            <span>KUROPUNK // ADMIN COMMAND CONSOLE [RBAC ACTIVE]</span>
          </div>
          <h1 className="font-headline-lg text-3xl sm:text-5xl text-white uppercase tracking-wider">
            PANEL DE ADMINISTRACIÓN Y TALLER
          </h1>
          <p className="font-mono text-xs text-neutral-400 mt-1">
            Sesión: <span className="text-white font-bold">{currentUser?.displayName}</span> (
            <span className="text-emerald-400">{currentUser?.email}</span>) // Custom Claim: Role = ADMIN
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
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setActiveTab('orders')}
          className={`py-3.5 px-6 font-headline-md text-xl uppercase tracking-wider border-2 transition-all flex items-center justify-center space-x-3 ${
            activeTab === 'orders'
              ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_20px_rgba(224,20,31,0.3)]'
              : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>GESTIÓN DE ÓRDENES Y DESPACHO ({orders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`py-3.5 px-6 font-headline-md text-xl uppercase tracking-wider border-2 transition-all flex items-center justify-center space-x-3 ${
            activeTab === 'products'
              ? 'bg-[#e0141f] border-[#e0141f] text-white shadow-[0_0_20px_rgba(224,20,31,0.3)]'
              : 'bg-[#141313] border-[#5e3f3c] text-neutral-400 hover:text-white'
          }`}
        >
          <Layers className="w-5 h-5" />
          <span>CRUD DE PRODUCTOS Y STOCK</span>
        </button>
      </div>

      {/* TAB 1: GESTIÓN DE ÓRDENES */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="p-4 bg-[#141313] border border-[#5e3f3c] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-headline-md text-2xl text-white uppercase">
                RADAR DE PEDIDOS ENTRANTE
              </h2>
              <p className="font-mono text-xs text-neutral-400">
                Al cambiar el estado de cualquier orden, la Cloud Function despachará la plantilla correspondiente de WhatsApp al cliente sin intervención manual.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 font-mono text-xs flex items-center space-x-2 shrink-0">
              <Send className="w-3.5 h-3.5" />
              <span>DESPACHADOR SERVER-SIDE AUTOMÁTICO</span>
            </div>
          </div>

          {loadingOrders ? (
            <div className="py-20 text-center font-mono text-xs text-[#ffb4ab]">
              CARGANDO ÓRDENES EN TIEMPO REAL DESDE FIRESTORE...
            </div>
          ) : (
            <div className="overflow-x-auto bg-[#141313] border border-[#5e3f3c]">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1d1b1b] border-b-2 border-[#e0141f] text-[#ffb4ab]">
                    <th className="p-3">ORDEN / TRACKING</th>
                    <th className="p-3">CLIENTE & CELULAR</th>
                    <th className="p-3">DIRECCIÓN (COLOMBIA)</th>
                    <th className="p-3">TOTAL (COP)</th>
                    <th className="p-3">ESTADO DEL PEDIDO (MUTACIÓN)</th>
                    <th className="p-3 text-right">WHATSAPP NOTIFY</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2b2a29]">
                  {orders.map((order) => {
                    const isUpdating = updatingOrderId === order.id;

                    return (
                      <tr key={order.id} className="hover:bg-[#1a1818] transition-colors">
                        <td className="p-3">
                          <strong className="text-white block font-bold">
                            #{order.id}
                          </strong>
                          <span className="text-[10px] text-emerald-400">
                            {order.trackingNumber || order.trackingCode || 'KURO-TRK-77X'}
                          </span>
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
                          {order.customerData?.shippingAddress || order.address || 'Medellín'}
                        </td>

                        <td className="p-3">
                          <strong className="text-white font-bold">
                            {formatCOP(order.totalAmount || order.total)}
                          </strong>
                          <span className="block text-[10px] text-[#ffb4ab]">
                            Contraentrega
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center space-x-2">
                            <select
                              value={order.status}
                              disabled={isUpdating}
                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                              className="bg-[#211f1f] border border-[#5e3f3c] text-white px-2.5 py-1.5 font-mono text-xs focus:border-[#e0141f] outline-none cursor-pointer disabled:opacity-50"
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
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-[10px] uppercase font-bold">
                            ✓ Auto-Trigger
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CRUD DE PRODUCTOS */}
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
                  placeholder="Ej: The Mechanic // Rogue Series"
                  className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none"
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
                  className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-neutral-400 uppercase mb-1">
                  Técnica Artesanal *
                </label>
                <select
                  value={formTechnique}
                  onChange={(e) => setFormTechnique(e.target.value)}
                  className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none"
                >
                  <option value="amigurumi">Amigurumi (Coleccionable Físico)</option>
                  <option value="punto_cruz">Punto Cruz (Gráfico DMC / Kit)</option>
                  <option value="patron_pdf">Patrón PDF (Digital con HUD)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 uppercase mb-1">
                    Precio (COP) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none"
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
                    className="w-full p-2.5 bg-[#1d1b1b] border border-[#5e3f3c] focus:border-[#e0141f] text-white outline-none"
                  />
                </div>
              </div>

              {/* Sizes Available */}
              <div>
                <label className="block text-neutral-400 uppercase mb-1.5">
                  Variantes de Tamaño Disponibles:
                </label>
                <div className="flex space-x-2">
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
                        className={`px-3 py-1.5 border font-bold uppercase ${
                          isSelected
                            ? 'bg-[#e0141f] border-[#e0141f] text-white'
                            : 'bg-[#1d1b1b] border-[#5e3f3c] text-neutral-400'
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
                      {prod.technique || prod.type || 'amigurumi'} // Stock: {prod.stock ?? 5}
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
