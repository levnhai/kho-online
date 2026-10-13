import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { StoreLayout } from './StoreLayout';
import { AdminLayout } from './AdminLayout';

// Storefront Pages (Tải ngay để khách hàng truy cập tức thì)
import { HomePage } from '@/pages/home/HomePage';
import { ProductsPage } from '@/pages/products/ProductsPage';
import { ProductDetailPage } from '@/pages/product-detail/ProductDetailPage';
import { CartPage } from '@/pages/cart/CartPage';
import { CheckoutPage } from '@/pages/checkout/CheckoutPage';
import { AccountPage } from '@/pages/account/AccountPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Admin Pages (Code Splitting qua React.lazy - Giảm dung lượng tải trang chủ ban đầu)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/dashboard/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
);
const AdminProductsPage = lazy(() =>
  import('@/pages/admin/products/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
);
const AdminImportsPage = lazy(() =>
  import('@/pages/admin/imports/AdminImportsPage').then((m) => ({ default: m.AdminImportsPage })),
);
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/categories/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })),
);
const AdminColorsPage = lazy(() =>
  import('@/pages/admin/colors/AdminColorsPage').then((m) => ({ default: m.AdminColorsPage })),
);
const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/orders/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
);
const AdminCustomersPage = lazy(() =>
  import('@/pages/admin/customers/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })),
);
const AdminStatisticsPage = lazy(() =>
  import('@/pages/admin/statistics/AdminStatisticsPage').then((m) => ({ default: m.AdminStatisticsPage })),
);

const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

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

      {/* PAGE 2: QUẢN TRỊ ADMIN (/admin - Tách chunk tải theo nhu cầu) */}
      <Route
        path="/admin"
        element={
          <Suspense fallback={<AdminLoadingFallback />}>
            <AdminLayout />
          </Suspense>
        }
      >
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
