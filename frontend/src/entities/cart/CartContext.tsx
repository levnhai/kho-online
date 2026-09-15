import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem, Product } from '@/shared/types';
import { productApi } from '@/entities/product/api/productApi';
import { useSocket } from '@/app/providers/SocketContext';

export const getCartItemPrice = (item: CartItem): number => {
  const isSet = Boolean(item.selectedOption && item.product.sellingOptions && item.product.sellingOptions.length > 0);
  
  if (isSet && item.selectedOption) {
    if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
      const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
      if (
        sizeObj?.optionPrices &&
        sizeObj.optionPrices[item.selectedOption] !== undefined &&
        sizeObj.optionPrices[item.selectedOption] > 0
      ) {
        return sizeObj.optionPrices[item.selectedOption];
      }
    }

    const optObj = item.product.sellingOptions?.find((o) => o.name === item.selectedOption);
    if (optObj) {
      return optObj.price;
    }
  }

  if (item.selectedSize && item.product.sizes && item.product.sizes.length > 0) {
    const sizeObj = item.product.sizes.find((s) => s.name === item.selectedSize);
    if (sizeObj && sizeObj.price > 0) {
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

export interface PriceChangeNotice {
  productId: string;
  name: string;
  oldPrice: number;
  newPrice: number;
}

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
  syncCartPrices: () => Promise<PriceChangeNotice[]>;
  totalCount: number;
  totalAmount: number;
  isSyncing: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useSocket();
  const [isSyncing, setIsSyncing] = useState(false);
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

  // Hàm đồng bộ thông tin và giá sản phẩm mới nhất từ Server
  const syncCartPrices = useCallback(async (): Promise<PriceChangeNotice[]> => {
    if (items.length === 0) return [];

    const productIds = Array.from(new Set(items.map((i) => String(i.product._id)).filter(Boolean)));
    if (productIds.length === 0) return [];

    setIsSyncing(true);
    const notices: PriceChangeNotice[] = [];

    try {
      const latestProducts = await productApi.getBatch(productIds);
      const productMap = new Map<string, Product>();
      latestProducts.forEach((p) => productMap.set(String(p._id), p));

      setItems((prevItems) => {
        return prevItems.map((item) => {
          const latest = productMap.get(String(item.product._id));
          if (!latest) return item;

          const oldPrice = getCartItemPrice(item);
          const updatedItem: CartItem = {
            ...item,
            product: latest,
          };
          const newPrice = getCartItemPrice(updatedItem);

          if (oldPrice !== newPrice) {
            notices.push({
              productId: latest._id,
              name: latest.name,
              oldPrice,
              newPrice,
            });
          }

          return updatedItem;
        });
      });
    } catch (err) {
      console.error('Lỗi khi đồng bộ giá giỏ hàng:', err);
    } finally {
      setIsSyncing(false);
    }

    return notices;
  }, [items]);

  // Tự động kiểm tra giá khi khởi chạy
  useEffect(() => {
    if (items.length > 0) {
      syncCartPrices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lắng nghe sự kiện Realtime Socket khi Admin cập nhật sản phẩm
  useEffect(() => {
    if (!socket) return;

    const handleProductUpdated = (updatedProduct: Product) => {
      if (!updatedProduct || !updatedProduct._id) return;
      const targetId = String(updatedProduct._id);

      setItems((prevItems) => {
        const hasItem = prevItems.some((i) => String(i.product._id) === targetId);
        if (!hasItem) return prevItems;

        return prevItems.map((item) => {
          if (String(item.product._id) === targetId) {
            return {
              ...item,
              product: updatedProduct,
            };
          }
          return item;
        });
      });
    };

    const handleProductDeleted = (data: { productId: string }) => {
      if (!data?.productId) return;
      const targetId = String(data.productId);
      setItems((prevItems) => prevItems.filter((i) => String(i.product._id) !== targetId));
    };

    socket.on('PRODUCT_UPDATED', handleProductUpdated);
    socket.on('product_updated', handleProductUpdated);
    socket.on('PRODUCT_DELETED', handleProductDeleted);
    socket.on('product_deleted', handleProductDeleted);

    return () => {
      socket.off('PRODUCT_UPDATED', handleProductUpdated);
      socket.off('product_updated', handleProductUpdated);
      socket.off('PRODUCT_DELETED', handleProductDeleted);
      socket.off('product_deleted', handleProductDeleted);
    };
  }, [socket]);

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
        syncCartPrices,
        totalCount,
        totalAmount,
        isSyncing,
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
