import React, { createContext, useContext, useState, useEffect } from 'react';
import { PRODUCTS } from '../data/products';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  // Pre-load default cart items
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('vandal_stitch_cart');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Sanitizar ítems legacy con precios en USD o shorthand (< 1000 COP) y filtrar productos inactivos
        return parsed
          .filter(item => {
            const found = PRODUCTS.find(p => p.id === item.id);
            // Si el producto está en el catálogo y está desactivado, eliminarlo del carrito
            if (found && found.isActive === false) return false;
            // Si es un mock legacy desconocido, removerlo
            if (!found) return false;
            return true;
          })
          .map(item => {
            let price = Number(item.price);
            if (price > 0 && price < 1000) {
              price = price * 1000;
            }
            return {
              ...item,
              price: price || 50000
            };
          });
      } catch (e) { console.error(e); }
    }
    return [];
  });

  // Persistent Wishlist
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

  useEffect(() => {
    localStorage.setItem('vandal_stitch_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('vandal_stitch_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const showToast = (message, type = "info") => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage((current) => (current?.id === Date.now() ? null : current));
    }, 3500);
  };

  const toggleWishlist = (productId, productTitle = "PRODUCT") => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        showToast(`[REMOVIDO] ${productTitle.toUpperCase()} DE FAVORITOS`, "info");
        return prev.filter((id) => id !== productId);
      } else {
        showToast(`[GUARDADO] ${productTitle.toUpperCase()} EN ARSENAL FAVORITO`, "success");
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId) => wishlist.includes(productId);

  const addToCart = (product, quantity = 1, options = {}) => {
    let safePrice = Number(product.price);
    if (safePrice > 0 && safePrice < 1000) {
      safePrice = safePrice * 1000;
    }
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        updated[existingIndex].price = safePrice;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: product.id,
            title: product.title,
            price: safePrice,
            color: options.color || "Asphalt",
            size: options.size || product.size || "MED",
            quantity: quantity,
            image: product.image
          }
        ];
      }
    });
    showToast(`[+${quantity}] ${product.title.toUpperCase()} AGREGADO AL CARRITO`, "success");
    setIsCartOpen(true);
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
    showToast(`ITEM REMOVIDO DEL CARRITO`, "warning");
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        totalItems,
        subtotal,
        toastMessage,
        setToastMessage,
        showToast,
        wishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
