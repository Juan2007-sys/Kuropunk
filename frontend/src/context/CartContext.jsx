import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PRODUCTS } from '../data/products';

const CartContext = createContext(null);
const CartActionsContext = createContext(null);
const ToastContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('vandal_stitch_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed
          .filter(item => {
            const found = PRODUCTS.find(p => p.id === item.id);
            if (found && (found.isActive === false || (typeof found.stock === 'number' && found.stock <= 0))) {
              return false;
            }
            if (!found && typeof item.stock === 'number' && item.stock <= 0) {
              return false;
            }
            return true;
          })
          .map(item => {
            const found = PRODUCTS.find(p => p.id === item.id);
            let price = Number(item.price);
            if (price > 0 && price < 1000) {
              price = price * 1000;
            }
            const maxStock = typeof found?.stock === 'number' ? found.stock : item.stock;
            const safeQty = typeof maxStock === 'number'
              ? Math.min(Math.max(1, Number(item.quantity) || 1), maxStock)
              : Math.max(1, Number(item.quantity) || 1);
            return {
              ...item,
              title: found?.title || String(item.title || '').replace(/\s*\/\/\s*/g, ' · '),
              quantity: safeQty,
              ...(typeof maxStock === 'number' ? { stock: maxStock } : {}),
              price: price || 50000
            };
          });
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('vandal_stitch_wishlist');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.filter(id => {
          const found = PRODUCTS.find(p => p.id === id);
          return found && found.isActive !== false;
        });
      } catch (e) { console.error(e); }
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const cartRef = useRef(cart);
  cartRef.current = cart;

  const toastTimerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('vandal_stitch_cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('vandal_stitch_wishlist', JSON.stringify(wishlist));
    } catch {}
  }, [wishlist]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const showToast = useCallback((message, type = "info") => {
    const toastId = Date.now();
    setToastMessage({ message, type, id: toastId });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage((current) => (current?.id === toastId ? null : current));
      toastTimerRef.current = null;
    }, 3500);
  }, []);

  const toggleWishlist = useCallback((productId, productTitle = "PRODUCT") => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast(`[REMOVIDO] ${productTitle.toUpperCase()} DE FAVORITOS`, "info");
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`[GUARDADO] ${productTitle.toUpperCase()} EN ARSENAL FAVORITO`, "success");
        return [...prev, productId];
      }
    });
  }, [showToast]);

  const isInWishlist = useCallback((productId) => wishlist.includes(productId), [wishlist]);

  const getProductMaxStock = useCallback((productOrId, fallbackStock) => {
    if (typeof productOrId === 'object' && productOrId !== null && typeof productOrId.stock === 'number') {
      return productOrId.stock;
    }
    const id = typeof productOrId === 'object' && productOrId !== null ? productOrId.id : productOrId;
    const found = PRODUCTS.find((p) => p.id === id);
    if (typeof found?.stock === 'number') return found.stock;
    return typeof fallbackStock === 'number' ? fallbackStock : null;
  }, []);

  const addToCart = useCallback((product, quantity = 1, options = {}) => {
    let safePrice = Number(product.price);
    if (safePrice > 0 && safePrice < 1000) {
      safePrice = safePrice * 1000;
    }

    const requestedQty = Math.max(1, Number(quantity) || 1);
    const maxStock = getProductMaxStock(product);

    if (maxStock !== null && maxStock <= 0) {
      showToast(`"${product.title.toUpperCase()}" ESTÁ AGOTADO`, "warning");
      return;
    }

    const existingItem = cartRef.current.find((item) => item.id === product.id);
    const currentQty = existingItem ? existingItem.quantity : 0;

    if (maxStock !== null && currentQty >= maxStock) {
      showToast(
        `STOCK MÁXIMO ALCANZADO: SOLO HAY ${maxStock} UNIDAD${maxStock === 1 ? '' : 'ES'} DE ${product.title.toUpperCase()}`,
        "warning"
      );
      setIsCartOpen(true);
      return;
    }

    const addedQty = maxStock !== null ? Math.min(requestedQty, maxStock - currentQty) : requestedQty;

    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        return prev.map((item, idx) => {
          if (idx !== existingIndex) return item;
          const itemMaxStock = maxStock ?? getProductMaxStock(item.id, item.stock);
          const nextQty = itemMaxStock !== null
            ? Math.min(item.quantity + requestedQty, itemMaxStock)
            : item.quantity + requestedQty;
          return {
            ...item,
            quantity: nextQty,
            price: safePrice,
            ...(itemMaxStock !== null ? { stock: itemMaxStock } : {}),
          };
        });
      }
      const initialQty = maxStock !== null ? Math.min(requestedQty, maxStock) : requestedQty;
      return [
        ...prev,
        {
          id: product.id,
          title: product.title,
          price: safePrice,
          color: options.color || "Asphalt",
          size: options.size || product.size || "MED",
          quantity: initialQty,
          ...(maxStock !== null ? { stock: maxStock } : {}),
          image: product.image || product.imageUrl || (product.images && product.images[0]) || ''
        }
      ];
    });

    if (maxStock !== null && addedQty < requestedQty) {
      showToast(
        `SOLO SE AGREGARON ${addedQty} UNIDAD${addedQty === 1 ? '' : 'ES'} (MÁX. ${maxStock} EN STOCK)`,
        "warning"
      );
    } else {
      showToast(`[+${addedQty}] ${product.title.toUpperCase()} AGREGADO AL CARRITO`, "success");
    }
    setIsCartOpen(true);
  }, [getProductMaxStock, showToast]);

  const removeFromCart = useCallback((productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast(`ITEM REMOVIDO DEL CARRITO`, "warning");
  }, [showToast]);

  const updateQuantity = useCallback((productId, delta) => {
    const target = cartRef.current.find((item) => item.id === productId);
    if (target && delta > 0) {
      const maxStock = getProductMaxStock(productId, target.stock);
      if (maxStock !== null && target.quantity >= maxStock) {
        showToast(
          `STOCK MÁXIMO DISPONIBLE: ${maxStock} UNIDAD${maxStock === 1 ? '' : 'ES'}`,
          "warning"
        );
        return;
      }
    }

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const maxStock = getProductMaxStock(productId, item.stock);
            const rawQty = item.quantity + delta;
            if (rawQty <= 0) return null;
            const clampedQty = maxStock !== null ? Math.min(rawQty, maxStock) : rawQty;
            return {
              ...item,
              quantity: clampedQty,
              ...(maxStock !== null ? { stock: maxStock } : {}),
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  }, [getProductMaxStock, showToast]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const totalItems = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  // Isolated actions object (stable references across cart/toast changes)
  const actionsValue = useMemo(() => ({
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    setIsCartOpen,
    showToast,
    toggleWishlist,
  }), [addToCart, removeFromCart, updateQuantity, clearCart, showToast, toggleWishlist]);

  // Isolated toast state (only Toast component subscribes, preventing app-wide re-renders)
  const toastValue = useMemo(() => ({
    toastMessage,
    setToastMessage,
    showToast,
  }), [toastMessage, showToast]);

  // Full cart state (without toastMessage, so toasts never trigger consumers to re-render)
  const cartValue = useMemo(() => ({
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    setIsCartOpen,
    totalItems,
    subtotal,
    showToast,
    wishlist,
    toggleWishlist,
    isInWishlist,
  }), [
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isCartOpen,
    totalItems,
    subtotal,
    showToast,
    wishlist,
    toggleWishlist,
    isInWishlist,
  ]);

  return (
    <ToastContext.Provider value={toastValue}>
      <CartActionsContext.Provider value={actionsValue}>
        <CartContext.Provider value={cartValue}>
          {children}
        </CartContext.Provider>
      </CartActionsContext.Provider>
    </ToastContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

export const useCartActions = () => {
  const context = useContext(CartActionsContext);
  if (!context) throw new Error("useCartActions must be used within a CartProvider");
  return context;
};

export const useToastState = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToastState must be used within a CartProvider");
  return context;
};
