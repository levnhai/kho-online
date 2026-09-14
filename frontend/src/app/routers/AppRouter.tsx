import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreLayout } from './StoreLayout';
import { AdminLayout } from './AdminLayout';

// Storefront Pages
import { HomePage } from '@/pages/home/HomePage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { ProductDetailPage } from '@/pages/product-detail/ProductDetailPage';
import { CartPage } from '@/pages/cart/CartPage';
import { CheckoutPage } from '@/pages/checkout/CheckoutPage';
import { AccountPage } from '@/pages/account/AccountPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Admin Pages
import { AdminDashboardPage } from '@/pages/admin/dashboard/AdminDashboardPage';
import { AdminProductsPage } from '@/pages/admin/products/AdminProductsPage';
import { AdminImportsPage } from '@/pages/admin/imports/AdminImportsPage';
import { AdminCategoriesPage } from '@/pages/admin/categories/AdminCategoriesPage';
import { AdminColorsPage } from '@/pages/admin/colors/AdminColorsPage';
import { AdminOrdersPage } from '@/pages/admin/orders/AdminOrdersPage';
import { AdminCustomersPage } from '@/pages/admin/customers/AdminCustomersPage';
import { AdminStatisticsPage } from '@/pages/admin/statistics/AdminStatisticsPage';

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* PAGE 1: KHÁCH HÀNG (Storefront) */}
      <Route element={<StoreLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/account" element={<AccountPage />} />
      </Route>

      {/* AUTH PAGES (Không có Header / Footer chính) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* PAGE 2: QUẢN TRỊ ADMIN (/admin) */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="imports" element={<AdminImportsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="colors" element={<AdminColorsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="statistics" element={<AdminStatisticsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
