import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/shared/types';

export const getCartItemPrice = (item: CartItem): number => {
  if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
    const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
    if (sizeObj) {
      return sizeObj.salePrice && sizeObj.salePrice > 0 ? sizeObj.salePrice : sizeObj.price;
    }
  }
  return item.product.salePrice && item.product.salePrice > 0 ? item.product.salePrice : item.product.price;
};

export const getCartItemOriginalPrice = (item: CartItem): number => {
  if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
    const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
    if (sizeObj) {
      return sizeObj.price;
    }
  }
  return item.product.price;
};

export const getCartItemMaxStock = (item: CartItem): number => {
  if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
    const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
    if (sizeObj && sizeObj.stock !== undefined && sizeObj.stock > 0) {
      return sizeObj.stock;
    }
  }
  return item.product.stock;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  removeFromCart: (productId: string, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('kho_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('kho_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    // Nếu sản phẩm có sizes mà chưa truyền selectedSize, tự động lấy size đầu tiên
    const activeSize = selectedSize || (product.sizes && product.sizes.length > 0 ? product.sizes[0].name : undefined);
    // Nếu sản phẩm có colors mà chưa truyền selectedColor, tự động lấy color đầu tiên
    const activeColor = selectedColor || (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product._id === product._id &&
          (item.selectedSize || '') === (activeSize || '') &&
          (item.selectedColor || '') === (activeColor || '')
      );

      if (existingIndex > -1) {
        const existing = prev[existingIndex];
        const maxStock = getCartItemMaxStock(existing);
        const newQty = Math.min(existing.quantity + quantity, maxStock || 99);
        return prev.map((item, idx) => (idx === existingIndex ? { ...item, quantity: newQty } : item));
      }

      const tempItem: CartItem = { product, quantity, selectedSize: activeSize, selectedColor: activeColor };
      const maxStock = getCartItemMaxStock(tempItem);
      return [
        ...prev,
        { product, quantity: Math.min(quantity, maxStock || 99), selectedSize: activeSize, selectedColor: activeColor },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.product._id === productId &&
          (item.selectedSize || '') === (selectedSize || '') &&
          (item.selectedColor || '') === (selectedColor || '')
        ) {
          const maxStock = getCartItemMaxStock(item);
          const validQty = Math.min(quantity, maxStock || 99);
          return { ...item, quantity: validQty };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string, selectedSize?: string, selectedColor?: string) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product._id === productId &&
            (item.selectedSize || '') === (selectedSize || '') &&
            (item.selectedColor || '') === (selectedColor || '')
          )
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = items.reduce((sum, item) => sum + getCartItemPrice(item) * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        totalCount,
        totalAmount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
