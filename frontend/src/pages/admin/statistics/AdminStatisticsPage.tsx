import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, TrendingUp, DollarSign, PackageCheck, Calendar, Trash2, CheckCircle2 } from 'lucide-react';
import { statApi } from '@/entities/statistics/api/statApi';
import { orderApi } from '@/entities/order/api/orderApi';
import { formatCurrency } from '@/shared/lib/formatters';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { Button } from '@/shared/ui/Button';

export const AdminStatisticsPage: React.FC = () => {
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'year'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchStats = useCallback(() => {
    setLoading(true);
    statApi
      .getSalesReport(range)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleClearAllTestData = async () => {
    const confirmed = window.confirm(
      '⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ ĐƠN HÀNG THỬ NGHIỆM KHÔNG?\n\n- Toàn bộ đơn hàng sẽ được xóa vĩnh viễn.\n- Doanh thu và số lượt bán của các sản phẩm sẽ được reset về 0 để chuẩn bị bán hàng thật.'
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await orderApi.clearAllOrders();
      setSuccessMsg(res?.message || 'Đã xóa toàn bộ đơn hàng test và làm mới số liệu thống kê về 0 thành công!');
      fetchStats();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Xóa dữ liệu test thất bại');
    } finally {
      setClearing(false);
    }
  };

  const rangeButtons = [
    { label: 'Hôm nay', value: 'today' },
    { label: 'Tuần này', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Năm nay', value: 'year' },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Alert thành công */}
      {successMsg && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Range filter buttons & Reset data button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
          <Calendar size={16} className="text-blue-600 dark:text-blue-400" />
          <span>Khoảng thời gian:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
          <div className="grid grid-cols-2 sm:flex gap-1.5 sm:gap-2">
            {rangeButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setRange(btn.value as any)}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all text-center cursor-pointer ${
                  range === btn.value
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <Button
            type="button"
            variant="danger"
            size="sm"
            loading={clearing}
            icon={<Trash2 size={14} />}
            onClick={handleClearAllTestData}
            className="text-xs py-1.5 px-3 font-bold cursor-pointer"
            title="Xóa toàn bộ các đơn hàng thử nghiệm và đưa thống kê về 0"
          >
            Xóa dữ liệu test
          </Button>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Đang tính toán số liệu thống kê..." />
      ) : (
        <>
          {/* 2 Thẻ tổng kết doanh thu và đơn hàng theo kỳ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                  DOANH THU ({rangeButtons.find((b) => b.value === range)?.label})
                </span>
                <p className="text-xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">
                  {formatCurrency(data?.revenue || 0)}
                </p>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 inline-block">
                  Tổng đơn hàng hợp lệ
                </span>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <DollarSign size={24} />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
              <div>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-400">
                  SỐ ĐƠN ({rangeButtons.find((b) => b.value === range)?.label})
                </span>
                <p className="text-xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-1">
                  {data?.orderCount || 0} đơn
                </p>
                <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 inline-block">
                  Đã tiếp nhận và xử lý
                </span>
              </div>
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <PackageCheck size={24} />
              </div>
            </div>
          </div>

          {/* BẢNG THỐNG KÊ SẢN PHẨM ĐÃ BÁN */}
          <div className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-base">
                  MẶT HÀNG ĐÃ BÁN RA ({rangeButtons.find((b) => b.value === range)?.label})
                </h3>
              </div>
            </div>

            {(!data?.productSalesList || data.productSalesList.length === 0) ? (
              <p className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs sm:text-sm">
                Không có dữ liệu bán hàng trong khoảng thời gian này.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[450px]">
                  <thead>
                    <tr className="bg-gray-50/80 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4 w-12">Hạng</th>
                      <th className="py-2.5 px-3">Tên Sản phẩm</th>
                      <th className="py-2.5 px-3 text-center">Đã bán</th>
                      <th className="py-2.5 px-4 text-right">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {data.productSalesList.map((item: any, idx: number) => {
                      const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
                      return (
                        <tr key={idx} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                          <td className="py-3 px-4 font-black text-gray-700 dark:text-gray-300">
                            {medal}
                          </td>
                          <td className="py-3 px-3 font-bold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
                            {item.name}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold rounded text-[11px]">
                              {item.sold} chiếc
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                            {formatCurrency(item.revenue)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
