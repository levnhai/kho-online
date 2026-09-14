import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/shared/types';

export const getCartItemPrice = (item: CartItem): number => {
  if (item.selectedOption && item.product.sellingOptions && item.product.sellingOptions.length > 0) {
    const optObj = item.product.sellingOptions.find((o) => o.name === item.selectedOption);
    if (optObj) {
      return optObj.price;
    }
  }
  if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
    const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
    if (sizeObj) {
      return sizeObj.price;
    }
  }
  return item.product.price;
};

export const getCartItemOriginalPrice = (item: CartItem): number => {
  return getCartItemPrice(item);
};

export const getCartItemMaxStock = (_item: CartItem): number => {
  return 9999;
};

interface CartContextType {
  items: CartItem[];
  addToCart: (
    product: Product,
    quantity?: number,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => void;
  removeFromCart: (
    productId: string,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => void;
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

  const addToCart = (
    product: Product,
    quantity = 1,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => {
    const activeOption =
      selectedOption ||
      (product.sellingOptions && product.sellingOptions.length > 0
        ? product.sellingOptions[0].name
        : undefined);
    const activeSize =
      selectedSize ||
      (product.sizes && product.sizes.length > 0 ? product.sizes[0].name : undefined);
    const activeColor =
      selectedColor ||
      (product.colors && product.colors.length > 0 ? product.colors[0] : undefined);

    setItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product._id === product._id &&
          (item.selectedOption || '') === (activeOption || '') &&
          (item.selectedSize || '') === (activeSize || '') &&
          (item.selectedColor || '') === (activeColor || ''),
      );

      if (existingIndex > -1) {
        return prev.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + quantity } : item,
        );
      }

      return [
        ...prev,
        {
          product,
          quantity,
          selectedOption: activeOption,
          selectedSize: activeSize,
          selectedColor: activeColor,
        },
      ];
    });
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, selectedSize, selectedColor, selectedOption);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (
          item.product._id === productId &&
          (item.selectedOption || '') === (selectedOption || '') &&
          (item.selectedSize || '') === (selectedSize || '') &&
          (item.selectedColor || '') === (selectedColor || '')
        ) {
          return { ...item, quantity };
        }
        return item;
      }),
    );
  };

  const removeFromCart = (
    productId: string,
    selectedSize?: string,
    selectedColor?: string,
    selectedOption?: string,
  ) => {
    setItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.product._id === productId &&
            (item.selectedOption || '') === (selectedOption || '') &&
            (item.selectedSize || '') === (selectedSize || '') &&
            (item.selectedColor || '') === (selectedColor || '')
          ),
      ),
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
