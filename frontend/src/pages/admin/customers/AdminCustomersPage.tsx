import React, { useState, useEffect, useCallback } from 'react';
import { Search, UserCheck, UserX, CheckCircle2 } from 'lucide-react';
import { userApi } from '@/entities/user/api/userApi';
import { User } from '@/shared/types';
import { formatDate } from '@/shared/lib/formatters';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getCustomers(search || undefined);
      setCustomers(data);
    } catch (err) {
      console.error('Fetch customers error:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const toggleStatus = async (c: User) => {
    const newStatus = c.status === 'blocked' ? 'active' : 'blocked';
    const actionName = newStatus === 'active' ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Bạn có chắc muốn ${actionName} tài khoản "${c.name}"?`)) {
      return;
    }

    try {
      await userApi.updateStatus(c._id, newStatus);
      setCustomers((prev) =>
        prev.map((item) => (item._id === c._id ? { ...item, status: newStatus } : item))
      );
      setActionSuccess(`Đã ${actionName} tài khoản thành công!`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-gray-900 dark:text-white">
      {/* Alert message */}
      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo Tên, Email, hoặc Số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
        </div>

        <div className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 text-right sm:text-left">
          Tổng số: <strong className="text-blue-600 dark:text-blue-400">{customers.length}</strong> khách hàng
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách khách hàng..." />
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-400 text-xs sm:text-sm">
            Không tìm thấy khách hàng nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-3">Số điện thoại</th>
                  <th className="py-3 px-3">Địa chỉ</th>
                  <th className="py-3 px-3">Ngày đăng ký</th>
                  <th className="py-3 px-3 text-center">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {customers.map((c) => {
                  const isBlocked = c.status === 'blocked';
                  return (
                    <tr key={c._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {c.name?.[0]?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[130px] sm:max-w-none">{c.name}</p>
                            <p className="text-gray-400 dark:text-slate-400 text-[11px] truncate max-w-[130px] sm:max-w-none">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-gray-700 dark:text-gray-300">
                        {c.phone || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-slate-300 max-w-[120px] truncate">
                        {c.address || 'Chưa cập nhật'}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {c.createdAt ? formatDate(c.createdAt) : 'N/A'}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isBlocked
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {isBlocked ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => toggleStatus(c)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 ${
                            isBlocked
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
                          }`}
                        >
                          {isBlocked ? (
                            <>
                              <UserCheck size={13} />
                              <span>Mở</span>
                            </>
                          ) : (
                            <>
                              <UserX size={13} />
                              <span>Khóa</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
