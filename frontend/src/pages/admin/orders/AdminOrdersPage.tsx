import React, { useState, useEffect, useCallback } from 'react';
import { Search, Eye, CheckCircle2, AlertCircle, ShoppingBag, Filter, BellRing } from 'lucide-react';
import { orderApi } from '@/entities/order/api/orderApi';
import { Order, OrderStatus } from '@/shared/types';
import { formatCurrency, formatDate, getOrderStatusText, getOrderStatusColor, cleanProductName } from '@/shared/lib/formatters';
import { playNotificationSound } from '@/shared/lib/sound';
import { useSocket } from '@/app/providers/SocketContext';
import { OrderStatusTimeline } from '@/entities/order/ui/OrderStatusTimeline';
import { Button } from '@/shared/ui/Button';
import { Modal } from '@/shared/ui/Modal';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const AdminOrdersPage: React.FC = () => {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected order for detail & status update
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [newOrderAlert, setNewOrderAlert] = useState<string>('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await orderApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        limit: 50,
      });
      setOrders(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Fetch admin orders error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Realtime socket listener for admin
  useEffect(() => {
    if (!socket) return;

    const handleOrderCreated = (newOrder: Order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === newOrder._id);
        if (exists) return prev;
        return [newOrder, ...prev];
      });
      setTotal((prev) => prev + 1);
      playNotificationSound();
      const customerName = newOrder.customerInfo?.name || 'Khách hàng';
      setNewOrderAlert(`🔔 Đơn hàng mới #${newOrder.orderCode} từ ${customerName} (${formatCurrency(newOrder.totalAmount)})`);
      setTimeout(() => setNewOrderAlert(''), 8000);
    };

    const handleStatusUpdated = (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o))
      );
      setSelectedOrder((prev) => (prev?._id === updatedOrder._id ? updatedOrder : prev));
    };

    const handleOrderCancelled = (cancelledOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === cancelledOrder._id ? cancelledOrder : o))
      );
      setSelectedOrder((prev) => (prev?._id === cancelledOrder._id ? cancelledOrder : prev));
      playNotificationSound();
      setNewOrderAlert(`⚠️ Đơn hàng #${cancelledOrder.orderCode} vừa bị huỷ bởi khách hàng.`);
      setTimeout(() => setNewOrderAlert(''), 8000);
    };

    socket.on('order_created', handleOrderCreated);
    socket.on('order_status_updated', handleStatusUpdated);
    socket.on('order_cancelled', handleOrderCancelled);

    return () => {
      socket.off('order_created', handleOrderCreated);
      socket.off('order_status_updated', handleStatusUpdated);
      socket.off('order_cancelled', handleOrderCancelled);
    };
  }, [socket]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const updated = await orderApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }
      setActionSuccess(`Đã cập nhật trạng thái sang "${getOrderStatusText(newStatus)}"`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 text-gray-900 dark:text-white">
      {/* Realtime Alert banner for new orders */}
      {newOrderAlert && (
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md text-xs sm:text-sm font-bold flex items-center justify-between gap-2 animate-bounce-subtle">
          <div className="flex items-center gap-2.5">
            <BellRing size={18} className="animate-pulse" />
            <span>{newOrderAlert}</span>
          </div>
          <button
            type="button"
            onClick={() => setNewOrderAlert('')}
            className="text-white/80 hover:text-white text-xs px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 transition-colors"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Alert message */}
      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Filter controls */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="flex flex-col sm:flex-row flex-1 items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Tìm theo Mã đơn, tên khách, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="SHIPPING_TO_VN">Hàng đang về Việt Nam</option>
            <option value="IN_VN_WAREHOUSE">Đã về kho Việt Nam</option>
            <option value="SHIPPING">Vận chuyển</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
        </div>

        <div className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-slate-400 text-right sm:text-left">
          Tổng số: <strong className="text-blue-600 dark:text-blue-400">{total}</strong> đơn
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
        {loading ? (
          <LoadingSpinner text="Đang tải danh sách đơn hàng..." />
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-400 dark:text-slate-400 text-xs sm:text-sm">
            Không tìm thấy đơn hàng nào phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3">Tổng tiền</th>
                  <th className="py-3 px-3">Ngày đặt</th>
                  <th className="py-3 px-3">PT Thanh toán</th>
                  <th className="py-3 px-3">Trạng thái</th>
                  <th className="py-3 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {orders.map((ord) => {
                  const color = getOrderStatusColor(ord.status);
                  return (
                    <tr key={ord._id} className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="py-3.5 px-4 font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {ord.customerInfo?.name || (typeof ord.customer === 'object' ? ord.customer?.name : 'Khách')}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-slate-400">
                            {ord.customerInfo?.phone || (typeof ord.customer === 'object' ? ord.customer?.phone : '')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(ord.totalAmount)}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(ord.orderDate || ord.createdAt)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-semibold rounded text-[10px]">
                          {ord.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <select
                          value={ord.status}
                          disabled={updatingStatus}
                          onChange={(e) => handleUpdateStatus(ord._id, e.target.value as OrderStatus)}
                          className={`font-bold py-1 px-2.5 rounded-lg border text-xs cursor-pointer focus:outline-none transition-colors shadow-2xs ${color.bg} ${color.text} ${color.border}`}
                        >
                          <option value="PENDING" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1">Chờ xử lý</option>
                          <option value="SHIPPING_TO_VN" className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold py-1">Hàng đang về Việt Nam</option>
                          <option value="IN_VN_WAREHOUSE" className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold py-1">Đã về kho Việt Nam</option>
                          <option value="SHIPPING" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-1">Vận chuyển</option>
                          <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold py-1">Hoàn thành</option>
                          <option value="CANCELLED" className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold py-1">Đã huỷ</option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<Eye size={13} />}
                          onClick={() => setSelectedOrder(ord)}
                          className="text-xs py-1 px-2.5 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-650"
                        >
                          Chi tiết
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Chi Tiết & Cập Nhật Trạng Thái Đơn Hàng */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Chi tiết ${selectedOrder.orderCode}`}
          maxWidth="xl"
        >
          <div className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
            <div className="bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl border border-gray-100 dark:border-slate-700">
              <OrderStatusTimeline status={selectedOrder.status} />
            </div>

            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
              <span className="font-bold text-gray-900 dark:text-white text-xs">
                Cập nhật trạng thái:
              </span>

              <select
                value={selectedOrder.status}
                disabled={updatingStatus}
                onChange={(e) => handleUpdateStatus(selectedOrder._id, e.target.value as OrderStatus)}
                className="font-bold py-1.5 px-2.5 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs shadow-2xs focus:outline-none"
              >
                <option value="PENDING" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1">1. Chờ xử lý</option>
                <option value="SHIPPING_TO_VN" className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold py-1">2. Hàng đang về Việt Nam</option>
                <option value="IN_VN_WAREHOUSE" className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold py-1">3. Đã về kho Việt Nam</option>
                <option value="SHIPPING" className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-1">4. Vận chuyển</option>
                <option value="COMPLETED" className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold py-1">5. Hoàn thành</option>
                <option value="CANCELLED" className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold py-1">6. Đã huỷ</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-slate-800 p-3 rounded-2xl">
              <div>
                <p className="font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">Khách nhận:</p>
                <p className="font-bold text-gray-900 dark:text-white">{selectedOrder.customerInfo?.name}</p>
                <p className="text-gray-500 dark:text-slate-400">{selectedOrder.customerInfo?.phone}</p>
              </div>
              <div>
                <p className="font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">Địa chỉ:</p>
                <p className="text-gray-800 dark:text-slate-200">{selectedOrder.customerInfo?.address}</p>
              </div>
            </div>

            {/* Mặt hàng */}
            <div className="space-y-1.5">
              <p className="font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
                MẶT HÀNG ({selectedOrder.items.length})
              </p>
              <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-40 overflow-y-auto">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                        alt={item.name}
                        className="w-8 h-8 rounded-lg object-cover border border-gray-100 dark:border-slate-700"
                      />
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white truncate max-w-[150px] sm:max-w-none">{cleanProductName(item.name)}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                          {item.size && (
                            <span className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[9px] font-bold rounded">
                              Size: {item.size}
                            </span>
                          )}
                          {item.color && (
                            <span className="px-1.5 py-0.2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[9px] font-bold rounded">
                              Màu: {item.color}
                            </span>
                          )}
                          <p className="text-gray-400 dark:text-slate-400 text-[10px]">
                            {formatCurrency(item.price)} x {item.quantity}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{formatCurrency(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 dark:border-slate-700 pt-2 flex justify-between items-baseline text-sm">
              <span className="font-bold text-gray-800 dark:text-slate-200">Tổng tiền:</span>
              <span className="text-rose-600 dark:text-rose-400 font-black text-base">
                {formatCurrency(selectedOrder.totalAmount)}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
