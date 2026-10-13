import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { apiCache } from '@/shared/lib/apiCache';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export const useSocket = () => useContext(SocketContext);

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    try {
      const url = new URL(apiUrl, window.location.origin);
      return url.origin;
    } catch {
      return apiUrl;
    }
  }
  return window.location.hostname === 'localhost' ? 'http://localhost:5000' : window.location.origin;
};

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      withCredentials: true,
    });

    newSocket.on('connect', () => {
      console.log('⚡ Socket.IO Connected:', newSocket.id);
      setIsConnected(true);

      if (isAuthenticated && user) {
        newSocket.emit('join_room', {
          userId: (user as any).id || user._id,
          role: user.role,
        });
      }
    });

    newSocket.on('disconnect', () => {
      console.log('⚡ Socket.IO Disconnected');
      setIsConnected(false);
    });

    // Tự động dọn dẹp cache khi nhận tín hiệu cập nhật realtime từ Socket (hỗ trợ cả snake_case và UPPERCASE)
    const handleOrderCacheInvalidate = () => {
      apiCache.invalidate('/orders');
      apiCache.invalidate('/statistics');
    };

    const handleProductCacheInvalidate = () => {
      apiCache.invalidate('/products');
      apiCache.invalidate('/statistics');
    };

    newSocket.on('order_created', handleOrderCacheInvalidate);
    newSocket.on('ORDER_CREATED', handleOrderCacheInvalidate);

    newSocket.on('order_status_updated', handleOrderCacheInvalidate);
    newSocket.on('ORDER_STATUS_UPDATED', handleOrderCacheInvalidate);

    newSocket.on('order_cancelled', handleOrderCacheInvalidate);
    newSocket.on('ORDER_CANCELLED', handleOrderCacheInvalidate);

    newSocket.on('product_updated', handleProductCacheInvalidate);
    newSocket.on('PRODUCT_UPDATED', handleProductCacheInvalidate);

    newSocket.on('product_deleted', handleProductCacheInvalidate);
    newSocket.on('PRODUCT_DELETED', handleProductCacheInvalidate);

    setSocket(newSocket);

    return () => {
      newSocket.off('order_created', handleOrderCacheInvalidate);
      newSocket.off('ORDER_CREATED', handleOrderCacheInvalidate);
      newSocket.off('order_status_updated', handleOrderCacheInvalidate);
      newSocket.off('ORDER_STATUS_UPDATED', handleOrderCacheInvalidate);
      newSocket.off('order_cancelled', handleOrderCacheInvalidate);
      newSocket.off('ORDER_CANCELLED', handleOrderCacheInvalidate);
      newSocket.off('product_updated', handleProductCacheInvalidate);
      newSocket.off('PRODUCT_UPDATED', handleProductCacheInvalidate);
      newSocket.off('product_deleted', handleProductCacheInvalidate);
      newSocket.off('PRODUCT_DELETED', handleProductCacheInvalidate);
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (socket && isConnected && isAuthenticated && user) {
      socket.emit('join_room', {
        userId: (user as any).id || user._id,
        role: user.role,
      });
    }
  }, [socket, isConnected, isAuthenticated, user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
