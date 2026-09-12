import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '@/widgets/header/Header';
import { Footer } from '@/widgets/footer/Footer';
import { ZaloButton } from '@/widgets/zalo-button';
import { useTheme } from '@/app/providers/ThemeContext';

export const StoreLayout: React.FC = () => {
  const { isDark } = useTheme();
  return (
    <div className={`min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-slate-100 font-sans transition-colors ${isDark ? 'dark' : ''}`}>
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ZaloButton />
    </div>
  );
};
