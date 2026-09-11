import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/app/providers/ThemeContext';
import { AuthProvider } from '@/app/providers/AuthContext';
import { CartProvider } from '@/entities/cart/CartContext';
import { AppRouter } from '@/app/routers/AppRouter';
import '@/app/styles/index.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <AppRouter />
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
