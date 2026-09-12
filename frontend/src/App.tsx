import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { AuthProvider } from '@/app/providers/AuthContext';
import { SocketProvider } from '@/app/providers/SocketContext';
import { CartProvider } from '@/entities/cart/CartContext';
import { AppRouter } from '@/app/routers/AppRouter';
import { ScrollToTop } from '@/app/routers/ScrollToTop';
import '@/app/styles/index.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <CartProvider>
              <AppRouter />
            </CartProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
