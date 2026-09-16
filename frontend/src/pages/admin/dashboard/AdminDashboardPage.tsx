import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Eye,
  RefreshCw,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
} from "lucide-react";
import { statApi } from "@/entities/statistics/api/statApi";
import { DashboardData } from "@/entities/statistics/model/types";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
} from "@/shared/lib/formatters";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { Button } from "@/shared/ui/Button";
import { getImageUrl, handleImageError } from "@/shared/lib/imageHelper";

type TimeRange = "today" | "7days" | "month" | "year";

const TIME_RANGES: { key: TimeRange; label: string; shortLabel: string }[] = [
  { key: "today", label: "Hôm nay", shortLabel: "Hôm nay" },
  { key: "7days", label: "7 ngày qua", shortLabel: "7 ngày" },
  { key: "month", label: "Tháng này", shortLabel: "Tháng" },
  { key: "year", label: "Năm nay", shortLabel: "Năm" },
];

export const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("7days");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(
    async (rangeToFetch: TimeRange = selectedRange, isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const res = await statApi.getDashboard({ range: rangeToFetch });
        setData(res);
      } catch (err: any) {
        console.error("Fetch dashboard error:", err);
        setError(err.message || "Không thể tải dữ liệu thống kê");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [selectedRange],
  );

  useEffect(() => {
    fetchDashboardData(selectedRange);
  }, [selectedRange]);

  const handleRangeChange = (range: TimeRange) => {
    if (range === selectedRange) return;
    setSelectedRange(range);
  };

  if (loading && !data) {
    return (
      <div className="py-12 flex items-center justify-center">
        <LoadingSpinner text="Đang tải dữ liệu tổng quan quản trị..." />
      </div>
    );
  }

  if (error && !data) {
    const isUnauthorized =
      error.toLowerCase().includes("unauthorized") ||
      error.toLowerCase().includes("tài khoản");
    return (
      <div className="p-6 text-center bg-white dark:bg-slate-800 rounded-2xl border border-rose-150 dark:border-rose-900/40 shadow-sm space-y-3 max-w-md mx-auto my-8">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle size={20} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            {isUnauthorized
              ? "Phiên đăng nhập đã hết hạn"
              : "Lỗi nạp dữ liệu Dashboard"}
          </h3>
          <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isUnauthorized
              ? "Dữ liệu phiên làm việc không còn hiệu lực do cơ sở dữ liệu vừa được làm mới. Vui lòng đăng nhập lại với tài khoản Admin."
              : error}
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 pt-1">
          {isUnauthorized ? (
            <Link to="/login">
              <Button
                variant="primary"
                size="sm"
                className="text-xs py-1.5 px-3"
              >
                Đăng nhập lại ngay
              </Button>
            </Link>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => fetchDashboardData(selectedRange)}
              className="text-xs py-1.5 px-3"
            >
              Thử lại
            </Button>
          )}
        </div>
      </div>
    );
  }

  const { metrics, topSelling, recentOrders, revenueChart, rangeLabel } =
    data || {
      rangeLabel: "7 ngày qua",
      metrics: {
        totalProducts: 0,
        totalOrders: 0,
        allTimeOrders: 0,
        totalCustomers: 0,
        allTimeCustomers: 0,
        totalRevenue: 0,
        allTimeRevenue: 0,
      },
      topSelling: [],
      recentOrders: [],
      revenueChart: [],
    };

  const maxRevenue = Math.max(
    ...(revenueChart?.map((c) => c.revenue) || [1]),
    1,
  );

  return (
    <div className="space-y-4 text-gray-900 dark:text-white pb-4">
      {/* Top Header Actions & Time Range Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/50">
            <Sparkles size={13} />
            Hệ thống ổn định
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          {/* Pills Tabs for Range */}
          <div className="inline-flex p-1 bg-gray-100/90 dark:bg-slate-900/90 rounded-xl border border-gray-200/60 dark:border-slate-700/80 shadow-inner">
            {TIME_RANGES.map((item) => {
              const isActive = selectedRange === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleRangeChange(item.key)}
                  className={`px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-lg transition-all duration-200 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-blue-600 text-white shadow-xs font-bold"
                      : "text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/50 dark:hover:bg-slate-800/50"
                  }`}
                >
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => fetchDashboardData(selectedRange, true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-gray-50 dark:bg-slate-900 border border-gray-200/80 dark:border-slate-700 shadow-2xs transition-all active:scale-95 disabled:opacity-50 flex-shrink-0"
            title="Làm mới dữ liệu"
          >
            <RefreshCw
              size={13}
              className={refreshing ? "animate-spin text-blue-600" : ""}
            />
            <span className="hidden sm:inline">
              {refreshing ? "Cập nhật..." : "Làm mới"}
            </span>
          </button>
        </div>
      </div>

      {/* 4 Thẻ chỉ số: 2 Cột trên Mobile, 4 Cột trên Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* SẢN PHẨM */}
        <Link
          to="/admin/products"
          className="group bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-all hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-xs"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Sản phẩm
            </span>
            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 leading-none">
              {metrics.totalProducts}
            </p>
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 inline-flex items-center gap-0.5">
              Đang bán
              <ArrowRight
                size={9}
                className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
              />
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Package size={16} />
          </div>
        </Link>

        {/* ĐƠN HÀNG */}
        <Link
          to="/admin/orders"
          className="group bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-all hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-xs"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Đơn hàng
            </span>
            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 leading-none">
              {metrics.totalOrders}
            </p>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 inline-flex items-center gap-0.5">
              {metrics.allTimeOrders
                ? `Tổng: ${metrics.allTimeOrders} đơn`
                : "Xem tất cả"}
              <ArrowRight
                size={9}
                className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
              />
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <ShoppingBag size={16} />
          </div>
        </Link>

        {/* KHÁCH HÀNG */}
        <Link
          to="/admin/customers"
          className="group bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-all hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-xs"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Khách hàng
            </span>
            <p className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white mt-0.5 leading-none">
              {metrics.totalCustomers}
            </p>
            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1 inline-flex items-center gap-0.5">
              Thành viên
              <ArrowRight
                size={9}
                className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
              />
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <Users size={16} />
          </div>
        </Link>

        {/* DOANH THU */}
        <Link
          to="/admin/statistics"
          className="group bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex items-center justify-between transition-all hover:border-rose-300 dark:hover:border-rose-700 hover:shadow-xs"
        >
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
              Doanh thu
            </span>
            <p className="text-base sm:text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5 leading-none truncate max-w-[120px] sm:max-w-none">
              {formatCurrency(metrics.totalRevenue)}
            </p>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1 inline-flex items-center gap-0.5">
              {metrics.allTimeRevenue
                ? `Tổng: ${formatCurrency(metrics.allTimeRevenue)}`
                : "Chi tiết"}
              <ArrowRight
                size={9}
                className="opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all"
              />
            </span>
          </div>
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
            <DollarSign size={16} />
          </div>
        </Link>
      </div>

      {/* Biểu đồ doanh thu & Top bán chạy */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 items-start">
        {/* Biểu đồ Doanh thu */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-white text-xs sm:text-sm uppercase tracking-wide">
              <TrendingUp
                size={15}
                className="text-blue-600 dark:text-blue-400"
              />
              <span>DOANH THU {rangeLabel?.toUpperCase() || "7 NGÀY QUA"}</span>
            </div>
            <Link
              to="/admin/statistics"
              className="text-[10px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Báo cáo chi tiết &rarr;
            </Link>
          </div>

          {revenueChart && revenueChart.length > 0 ? (
            <div className="h-40 sm:h-48 flex items-end justify-between gap-1 sm:gap-2.5 pt-6 px-1">
              {revenueChart.map((item, i) => {
                const heightPercent =
                  item.revenue > 0
                    ? Math.max(
                        14,
                        Math.round((item.revenue / maxRevenue) * 100),
                      )
                    : 6;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                  >
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-11 opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-lg flex flex-col items-center border border-slate-700 dark:border-slate-200">
                      <span className="text-amber-300 dark:text-amber-700">
                        {item.date}
                      </span>
                      <span className="font-extrabold">
                        {formatCurrency(item.revenue)}
                      </span>
                      <span className="text-[9px] font-normal text-slate-300 dark:text-slate-600">
                        {item.orders} đơn hàng
                      </span>
                    </div>
                    {/* Bar */}
                    <div
                      className={`w-full rounded-t-md sm:rounded-t-lg transition-all duration-300 ${
                        item.revenue > 0
                          ? "bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 shadow-2xs"
                          : "bg-gray-100 dark:bg-slate-700/60"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-[9px] sm:text-[10px] font-medium text-gray-500 dark:text-slate-400 mt-2 text-center truncate max-w-[55px] sm:max-w-none">
                      {item.date}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-xs text-gray-400 dark:text-slate-500">
              Chưa có dữ liệu thống kê trong khoảng thời gian này.
            </div>
          )}
        </div>

        {/* TOP SẢN PHẨM BÁN CHẠY */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-2.5 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-700">
            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
              TOP BÁN CHẠY
            </h3>
            <span className="text-[10px] text-gray-400 dark:text-slate-400">
              Số lượng bán
            </span>
          </div>

          {topSelling && topSelling.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-slate-700 space-y-0.5">
              {topSelling.map((sp: any, idx: number) => {
                const medals = ["🥇", "🥈", "🥉", "4.", "5."];
                return (
                  <div
                    key={sp._id}
                    className="pt-2 pb-1.5 flex items-center justify-between gap-2 text-xs hover:bg-gray-50/50 dark:hover:bg-slate-750 rounded-lg px-1 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold w-4 text-center text-gray-700 dark:text-gray-300 flex-shrink-0">
                        {medals[idx]}
                      </span>
                      <img
                        src={getImageUrl(sp.images?.[0])}
                        alt={sp.name}
                        onError={handleImageError}
                        className="w-7 h-7 rounded-lg object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className="font-semibold text-gray-900 dark:text-white truncate text-[11px]"
                          title={sp.name}
                        >
                          {sp.name}
                        </p>
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          {formatCurrency(sp.price)}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded whitespace-nowrap">
                      {sp.soldCount || 0} SP
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
              Chưa có dữ liệu sản phẩm bán chạy.
            </div>
          )}
        </div>
      </div>

      {/* Đơn hàng mới nhất */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-1.5">
            <Clock size={15} className="text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
              ĐƠN HÀNG VỪA ĐẶT
            </h3>
          </div>
          <Link
            to="/admin/orders"
            className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <span>Tất cả đơn hàng</span>
            <ArrowRight size={11} />
          </Link>
        </div>

        {recentOrders && recentOrders.length > 0 ? (
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2 px-3">Mã đơn</th>
                    <th className="py-2 px-3">Khách hàng</th>
                    <th className="py-2 px-3">Tổng tiền</th>
                    <th className="py-2 px-3">Thời gian</th>
                    <th className="py-2 px-3">Trạng thái</th>
                    <th className="py-2 px-3 text-right">Xem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {recentOrders.map((ord: any) => {
                    const color = getOrderStatusColor(ord.status);
                    const customerName =
                      ord.customerInfo?.name ||
                      (typeof ord.customer === "object"
                        ? ord.customer?.name
                        : "Khách vãng lai");
                    return (
                      <tr
                        key={ord._id}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-xs">
                          {ord.orderCode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-gray-900 dark:text-white truncate max-w-[130px] text-xs">
                          {customerName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap text-xs">
                          {formatCurrency(ord.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3 text-gray-400 dark:text-slate-400 whitespace-nowrap text-[10px]">
                          {formatDate(ord.orderDate || ord.createdAt)}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[9px] border ${color.bg} ${color.text} ${color.border}`}
                          >
                            {getOrderStatusText(ord.status)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Link to="/admin/orders">
                            <button className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors">
                              <Eye size={13} />
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
        ) : (
          <div className="py-6 text-center text-xs text-gray-400 dark:text-slate-500">
            Chưa có đơn hàng nào vừa đặt.
          </div>
        )}
      </div>
    </div>
  );
};
