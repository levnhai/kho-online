import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from '@/widgets/admin-sidebar/AdminSidebar';
import { AdminHeader } from '@/widgets/admin-header/AdminHeader';
import { useAuth } from '@/app/providers/AuthContext';
import { useTheme } from '@/app/providers/ThemeContext';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminLayout: React.FC = () => {
  const { user, loading, isAdmin, isAuthenticated } = useAuth();
  const { isDark } = useTheme();
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <LoadingSpinner text="Đang kiểm tra quyền quản trị..." />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
        }}
        replace
      />
    );
  }

  // Determine Title based on pathname
  let title = 'Dashboard Tổng Quan';
  let subtitle = 'Theo dõi các chỉ số kinh doanh và hoạt động của KHO Online';

  if (location.pathname.includes('/admin/products')) {
    title = 'Quản Lý Sản Phẩm';
    subtitle = 'Danh sách, cập nhật thông tin và điều chỉnh tồn kho sản phẩm';
  } else if (location.pathname.includes('/admin/imports')) {
    title = 'Quản Lý Nhập Hàng';
    subtitle = 'Quản lý phiếu nhập kho, theo dõi nguồn hàng và cập nhật tiến trình';
  } else if (location.pathname.includes('/admin/categories')) {
    title = 'Quản Lý Thể Loại';
    subtitle = 'Cấu hình và phân nhóm danh mục hàng hoá';
  } else if (location.pathname.includes('/admin/orders')) {
    title = 'Quản Lý Đơn Hàng';
    subtitle = 'Kiểm duyệt và cập nhật tiến trình giao hàng cho khách';
  } else if (location.pathname.includes('/admin/customers')) {
    title = 'Quản Lý Khách Hàng';
    subtitle = 'Danh sách tài khoản và kiểm soát quyền truy cập thành viên';
  } else if (location.pathname.includes('/admin/statistics')) {
    title = 'Báo Cáo & Thống Kê Bán Hàng';
    subtitle = 'Phân tích doanh thu và các mặt hàng bán chạy nhất';
  }

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 transition-colors ${isDark ? 'dark' : ''}`}>
      <AdminSidebar
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          onToggleSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        <main className="flex-1 p-3 sm:p-5 lg:p-6 w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
