import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { statApi } from '@/entities/statistics/api/statApi';
import { formatCurrency, formatDate, getOrderStatusText, getOrderStatusColor } from '@/shared/lib/formatters';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statApi
      .getDashboard()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner text="Đang tải dữ liệu tổng quan..." />;
  }

  const { metrics, topSelling, recentOrders, revenueChart } = data || {
    metrics: { totalProducts: 0, totalOrders: 0, totalCustomers: 0, totalRevenue: 0 },
    topSelling: [],
    recentOrders: [],
    revenueChart: [],
  };

  const maxRevenue = Math.max(...(revenueChart?.map((c: any) => c.revenue) || [1]), 1);

  return (
    <div className="space-y-4 sm:space-y-8 text-gray-900 dark:text-white">
      {/* 4 Thẻ chỉ số: 2 Cột trên Mobile, 4 Cột trên Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* SẢN PHẨM */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              SẢN PHẨM
            </span>
            <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.totalProducts}
            </p>
            <span className="text-[10px] sm:text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 inline-block">
              Đang bán
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
            <Package size={20} />
          </div>
        </div>

        {/* ĐƠN HÀNG */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              ĐƠN HÀNG
            </span>
            <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.totalOrders}
            </p>
            <span className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 inline-block">
              Toàn hệ thống
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={20} />
          </div>
        </div>

        {/* KHÁCH HÀNG */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              KHÁCH HÀNG
            </span>
            <p className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.totalCustomers}
            </p>
            <span className="text-[10px] sm:text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5 inline-block">
              Thành viên
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Users size={20} />
          </div>
        </div>

        {/* DOANH THU */}
        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-colors">
          <div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
              DOANH THU
            </span>
            <p className="text-base sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 truncate max-w-[110px] sm:max-w-none">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <span className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 inline-block">
              Tổng tích luỹ
            </span>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
            <DollarSign size={20} />
          </div>
        </div>
      </div>

      {/* Biểu đồ doanh thu & Top bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Biểu đồ Doanh thu */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-base">
              <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
              <span>DOANH THU 7 NGÀY QUA</span>
            </div>
            <Link to="/admin/statistics" className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
              Báo cáo
            </Link>
          </div>

          <div className="h-48 sm:h-64 flex items-end justify-between gap-1.5 sm:gap-3 pt-6 px-1">
            {revenueChart?.map((item: any, i: number) => {
              const heightPercent = Math.max(8, Math.round((item.revenue / maxRevenue) * 100));
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="absolute -top-9 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-10 shadow-md">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-lg sm:rounded-t-xl transition-all duration-500"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-slate-400 mt-1.5">
                    {item.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOP SẢN PHẨM BÁN CHẠY */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base">TOP BÁN CHẠY</h3>
            <span className="text-[11px] text-gray-400 dark:text-slate-400">Số lượng bán</span>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-slate-700 space-y-1">
            {topSelling?.map((sp: any, idx: number) => {
              const medals = ['🥇', '🥈', '🥉', '4.', '5.'];
              return (
                <div key={sp._id} className="pt-2.5 pb-2 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-black w-5 text-center text-gray-700 dark:text-gray-300 flex-shrink-0">
                      {medals[idx]}
                    </span>
                    <img
                      src={sp.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                      alt={sp.name}
                      className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0"
                    />
                    <span className="font-bold text-gray-900 dark:text-white truncate" title={sp.name}>
                      {sp.name}
                    </span>
                  </div>
                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded-md whitespace-nowrap">
                    {sp.soldCount || 0} SP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Đơn hàng mới nhất */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
          <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base">ĐƠN HÀNG VỪA ĐẶT</h3>
          <Link to="/admin/orders" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            <span>Tất cả</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="inline-block min-w-full align-middle px-4 sm:px-0">
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Mã đơn</th>
                  <th className="py-2.5 px-3">Khách hàng</th>
                  <th className="py-2.5 px-3">Tổng tiền</th>
                  <th className="py-2.5 px-3">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Xem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {recentOrders?.map((ord: any) => {
                  const color = getOrderStatusColor(ord.status);
                  return (
                    <tr key={ord._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3 px-3 font-bold text-blue-600 dark:text-blue-400">{ord.orderCode}</td>
                      <td className="py-3 px-3 font-semibold text-gray-900 dark:text-white truncate max-w-[110px]">
                        {ord.customerInfo?.name || ord.customer?.name}
                      </td>
                      <td className="py-3 px-3 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] border ${color.bg} ${color.text} ${color.border}`}>
                          {getOrderStatusText(ord.status)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link to="/admin/orders">
                          <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded">
                            <Eye size={15} />
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
