import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Filter,
  BellRing,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Trash2,
  MessageSquare,
  Truck,
  PlusCircle,
  PackageCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { orderApi } from "@/entities/order/api/orderApi";
import { Order, OrderStatus } from "@/shared/types";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getDeliveryBatchStatusText,
  getDeliveryBatchStatusColor,
  getPaymentMethodText,
  cleanProductName,
} from "@/shared/lib/formatters";
import { playNotificationSound } from "@/shared/lib/sound";
import { useSocket } from "@/app/providers/SocketContext";
import { OrderStatusTimeline } from "@/entities/order/ui/OrderStatusTimeline";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";
import { getImageUrl, handleImageError } from "@/shared/lib/imageHelper";

const getOrderItemCode = (item: any): string => {
  if (item.productCode) return item.productCode;
  if (typeof item.product === "object" && item.product?.code)
    return item.product.code;
  return "";
};

const getOrderItemsSummary = (order: Order) => {
  if (!order.items || order.items.length === 0) return [];
  return order.items.map((it) => ({
    code: getOrderItemCode(it) || "-",
    quantity: it.quantity || 1,
    name: it.name,
    size: it.size,
    color: it.color,
  }));
};

export const AdminOrdersPage: React.FC = () => {
  const { socket } = useSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Selected order for detail & status update
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [adminNoteText, setAdminNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionSuccess, setActionSuccess] = useState("");
  const [newOrderAlert, setNewOrderAlert] = useState<string>("");

  // Partial Delivery States
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryItemsInput, setDeliveryItemsInput] = useState<
    Record<number, number>
  >({});
  const [deliveryStatus, setDeliveryStatus] = useState("DELIVERED");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [savingDelivery, setSavingDelivery] = useState(false);
  const [updatingBatchStatus, setUpdatingBatchStatus] = useState<number | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      setAdminNoteText(selectedOrder.adminNote || "");
      setShowDeliveryForm(false);
    } else {
      setAdminNoteText("");
      setShowDeliveryForm(false);
    }
  }, [selectedOrder]);

  const getItemDeliveredQty = (order: Order, itemIdx: number) => {
    if (!order.deliveries || order.deliveries.length === 0) return 0;
    const targetItem = order.items[itemIdx];
    if (!targetItem) return 0;

    let delivered = 0;
    order.deliveries.forEach((batch) => {
      batch.items?.forEach((bi) => {
        const matchProduct =
          (bi.product &&
            targetItem.product &&
            String(bi.product) ===
              String(
                typeof targetItem.product === "object"
                  ? (targetItem.product as any)._id
                  : targetItem.product,
              )) ||
          (bi.productCode &&
            targetItem.productCode &&
            bi.productCode === targetItem.productCode) ||
          (bi.name === targetItem.name &&
            bi.size === targetItem.size &&
            bi.color === targetItem.color);
        if (matchProduct) {
          delivered += Number(bi.quantity) || 0;
        }
      });
    });
    return delivered;
  };

  const handleOpenDeliveryForm = () => {
    if (!selectedOrder) return;
    const initialQuantities: Record<number, number> = {};

    selectedOrder.items.forEach((it, idx) => {
      const delivered = getItemDeliveredQty(selectedOrder, idx);
      const remaining = Math.max(0, (it.quantity || 1) - delivered);
      initialQuantities[idx] = remaining;
    });

    setDeliveryItemsInput(initialQuantities);
    setDeliveryStatus("DELIVERED");
    setDeliveryNote("");
    setShowDeliveryForm(true);
  };

  const handleQuantityInputChange = (
    idx: number,
    val: number,
    maxVal: number,
  ) => {
    const clamped = Math.max(0, Math.min(maxVal, val));
    const nextInputs = { ...deliveryItemsInput, [idx]: clamped };
    setDeliveryItemsInput(nextInputs);
  };

  const handleAddDeliveryBatch = async () => {
    if (!selectedOrder) return;

    const itemsToDeliver = selectedOrder.items
      .map((it, idx) => ({
        product:
          typeof it.product === "object" ? (it.product as any)._id : it.product,
        productCode:
          it.productCode ||
          (typeof it.product === "object" ? (it.product as any).code : ""),
        name: it.name,
        sellingOption: it.sellingOption,
        size: it.size,
        color: it.color,
        price: it.price,
        quantity: Number(deliveryItemsInput[idx]) || 0,
        image: it.image,
      }))
      .filter((it) => it.quantity > 0);

    if (itemsToDeliver.length === 0) {
      alert("Vui lòng nhập số lượng xuất hàng lớn hơn 0");
      return;
    }

    setSavingDelivery(true);
    try {
      const updated = await orderApi.addDeliveryBatch(selectedOrder._id, {
        items: itemsToDeliver,
        status: deliveryStatus,
        note: deliveryNote,
      });
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      setShowDeliveryForm(false);
      setActionSuccess("Đã tạo phiếu xuất đợt giao hàng thành công!");
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (err: any) {
      alert(err.message || "Tạo phiếu xuất đợt thất bại");
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleUpdateDeliveryBatchStatus = async (
    batchIndex: number,
    newStatus: string,
  ) => {
    if (!selectedOrder) return;
    setUpdatingBatchStatus(batchIndex);
    try {
      const updated = await orderApi.updateDeliveryBatchStatus(
        selectedOrder._id,
        batchIndex,
        { status: newStatus },
      );
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      setActionSuccess(`Đã cập nhật trạng thái Đợt ${batchIndex}!`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Cập nhật trạng thái đợt thất bại");
    } finally {
      setUpdatingBatchStatus(null);
    }
  };

  const handleDeleteDeliveryBatch = async (batchIndex: number) => {
    if (!selectedOrder) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa Đợt ${batchIndex} không?`))
      return;

    try {
      const updated = await orderApi.deleteDeliveryBatch(
        selectedOrder._id,
        batchIndex,
      );
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      setActionSuccess(`Đã xóa Đợt ${batchIndex} thành công`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Xóa đợt giao thất bại");
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedOrder) return;
    setSavingNote(true);
    try {
      const updated = await orderApi.updateAdminNote(
        selectedOrder._id,
        adminNoteText,
      );
      setSelectedOrder(updated);
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o)),
      );
      setActionSuccess("Đã lưu ghi chú gửi khách hàng thành công!");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Lưu ghi chú thất bại");
    } finally {
      setSavingNote(false);
    }
  };

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
      console.error("Fetch admin orders error:", err);
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
      const customerName = newOrder.customerInfo?.name || "Khách hàng";
      setNewOrderAlert(
        `🔔 Đơn hàng mới #${newOrder.orderCode} từ ${customerName} (${formatCurrency(newOrder.totalAmount)})`,
      );
      setTimeout(() => setNewOrderAlert(""), 8000);
    };

    const handleStatusUpdated = (updatedOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === updatedOrder._id ? updatedOrder : o)),
      );
      setSelectedOrder((prev) =>
        prev?._id === updatedOrder._id ? updatedOrder : prev,
      );
    };

    const handleOrderCancelled = (cancelledOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === cancelledOrder._id ? cancelledOrder : o)),
      );
      setSelectedOrder((prev) =>
        prev?._id === cancelledOrder._id ? cancelledOrder : prev,
      );
      playNotificationSound();
      setNewOrderAlert(
        `⚠️ Đơn hàng #${cancelledOrder.orderCode} vừa bị huỷ bởi khách hàng.`,
      );
      setTimeout(() => setNewOrderAlert(""), 8000);
    };

    socket.on("order_created", handleOrderCreated);
    socket.on("order_status_updated", handleStatusUpdated);
    socket.on("order_cancelled", handleOrderCancelled);

    return () => {
      socket.off("order_created", handleOrderCreated);
      socket.off("order_status_updated", handleStatusUpdated);
      socket.off("order_cancelled", handleOrderCancelled);
    };
  }, [socket]);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    setUpdatingStatus(true);
    try {
      const updated = await orderApi.updateStatus(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }
      setActionSuccess(
        `Đã cập nhật trạng thái sang "${getOrderStatusText(newStatus)}"`,
      );
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Cập nhật trạng thái thất bại");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, orderCode: string) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng ${orderCode}?`,
      )
    ) {
      return;
    }
    try {
      await orderApi.deleteOrder(orderId);
      setOrders((prev) => prev.filter((o) => o._id !== orderId));
      setTotal((prev) => Math.max(0, prev - 1));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(null);
      }
      setActionSuccess(`Đã xóa đơn hàng ${orderCode} thành công`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Xóa đơn hàng thất bại");
    }
  };

  const handleClearAllOrders = async () => {
    const confirmed = window.confirm(
      "⚠️ BẠN CÓ CHẮC CHẮN MUỐN XÓA TOÀN BỘ ĐƠN HÀNG THỬ NGHIỆM KHÔNG?\n\n- Toàn bộ danh sách đơn hàng sẽ bị xóa.\n- Doanh thu và lượt bán sẽ được reset về 0.",
    );
    if (!confirmed) return;

    setClearing(true);
    try {
      const res = await orderApi.clearAllOrders();
      setOrders([]);
      setTotal(0);
      setSelectedOrder(null);
      setActionSuccess(
        res?.message || "Đã xóa toàn bộ đơn hàng test thành công",
      );
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      alert(err.message || "Xóa đơn hàng thất bại");
    } finally {
      setClearing(false);
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
            onClick={() => setNewOrderAlert("")}
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
              placeholder="Tìm theo Mã đơn, Mã SP, tên khách, SĐT..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs"
            />
            <Search
              size={14}
              className="absolute left-2.5 top-2.5 text-gray-400"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 text-xs border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none shadow-2xs cursor-pointer font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="SHIPPING_TO_VN">Hàng đang về Việt Nam</option>
            <option value="IN_VN_WAREHOUSE">Đã về kho Việt Nam</option>
            <option value="SHIPPING">Vận chuyển</option>
            <option value="PARTIAL_DELIVERED">Giao một phần</option>
            <option value="COMPLETED">Hoàn thành</option>
            <option value="CANCELLED">Đã huỷ</option>
          </select>
        </div>

        <div className="flex items-center gap-3 justify-between sm:justify-end">
          <div className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-slate-400">
            Tổng số:{" "}
            <strong className="text-blue-600 dark:text-blue-400">
              {total}
            </strong>{" "}
            đơn
          </div>
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
            <table className="w-full text-left text-xs min-w-[820px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Mã đơn</th>
                  <th className="py-3 px-3">Mã SP</th>
                  <th className="py-3 px-3">Khách hàng</th>
                  <th className="py-3 px-3 text-center">Số lượng</th>
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
                  const itemsSummary = getOrderItemsSummary(ord);
                  const totalQuantity = ord.items
                    ? ord.items.reduce((sum, it) => sum + (it.quantity || 1), 0)
                    : 0;
                  const deliveredQty = ord.totalDeliveredQuantity || 0;
                  const isPartial =
                    deliveredQty > 0 && deliveredQty < totalQuantity;

                  return (
                    <tr
                      key={ord._id}
                      className="hover:bg-gray-50/60 dark:hover:bg-slate-700/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-extrabold text-blue-600 dark:text-blue-400 text-xs sm:text-sm">
                        {ord.orderCode}
                      </td>
                      <td className="py-3.5 px-3">
                        {itemsSummary.length === 0 ? (
                          <span className="text-gray-400 dark:text-slate-500 font-mono text-xs">
                            -
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1 items-center max-w-[150px]">
                            {itemsSummary.map((it, idx) => (
                              <span
                                key={idx}
                                className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600/80 shadow-2xs inline-flex items-center gap-1"
                                title={`${it.name} ${it.size ? `(${it.size})` : ""} - SL: ${it.quantity}`}
                              >
                                <span>{it.code}</span>
                                {it.quantity > 1 && (
                                  <span className="text-blue-600 dark:text-blue-400 font-extrabold text-[10px]">
                                    x{it.quantity}
                                  </span>
                                )}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-gray-900 dark:text-white">
                            {ord.customerInfo?.name ||
                              (typeof ord.customer === "object"
                                ? ord.customer?.name
                                : "Khách")}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-slate-400">
                            {ord.customerInfo?.phone ||
                              (typeof ord.customer === "object"
                                ? ord.customer?.phone
                                : "")}
                          </span>
                          {ord.adminNote && (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-medium max-w-[150px] truncate border border-amber-200 dark:border-amber-800/60 shadow-2xs"
                              title={`Ghi chú gửi khách: ${ord.adminNote}`}
                            >
                              <MessageSquare
                                size={10}
                                className="flex-shrink-0 text-amber-600 dark:text-amber-400"
                              />
                              <span className="truncate">{ord.adminNote}</span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        {isPartial ? (
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 font-extrabold text-xs border border-amber-300 dark:border-amber-700 shadow-2xs">
                              {deliveredQty}/{totalQuantity}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-700/80 text-gray-900 dark:text-white font-extrabold text-xs border border-slate-200 dark:border-slate-600 shadow-2xs">
                            {totalQuantity}
                          </span>
                        )}
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
                          onChange={(e) =>
                            handleUpdateStatus(
                              ord._id,
                              e.target.value as OrderStatus,
                            )
                          }
                          className={`font-bold py-1 px-2.5 rounded-lg border text-xs cursor-pointer focus:outline-none transition-colors shadow-2xs ${color.bg} ${color.text} ${color.border}`}
                        >
                          <option
                            value="PENDING"
                            className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1"
                          >
                            Chờ xử lý
                          </option>
                          <option
                            value="CONFIRMED"
                            className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold py-1"
                          >
                            Đã xác nhận
                          </option>
                          <option
                            value="SHIPPING_TO_VN"
                            className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold py-1"
                          >
                            Hàng đang về Việt Nam
                          </option>
                          <option
                            value="IN_VN_WAREHOUSE"
                            className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold py-1"
                          >
                            Đã về kho Việt Nam
                          </option>
                          <option
                            value="SHIPPING"
                            className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-1"
                          >
                            Vận chuyển
                          </option>
                          <option
                            value="PARTIAL_DELIVERED"
                            className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1"
                          >
                            Giao một phần
                          </option>
                          <option
                            value="COMPLETED"
                            className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold py-1"
                          >
                            Hoàn thành
                          </option>
                          <option
                            value="CANCELLED"
                            className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold py-1"
                          >
                            Đã huỷ
                          </option>
                        </select>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            className="text-xs py-1 px-2 font-bold cursor-pointer"
                            onClick={() => setSelectedOrder(ord)}
                          >
                            <Eye size={12} />
                            <span>Chi tiết</span>
                          </Button>
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteOrder(ord._id, ord.orderCode)
                            }
                            className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Xóa đơn hàng này"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
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
      {selectedOrder &&
        (() => {
          const orderTotalQty = selectedOrder.items.reduce(
            (s, it) => s + (it.quantity || 1),
            0,
          );
          const orderDeliveredQty =
            selectedOrder.totalDeliveredQuantity ||
            selectedOrder.deliveries?.reduce(
              (s, d) => s + (d.totalQuantity || 0),
              0,
            ) ||
            0;
          const remainingTotalQty = Math.max(
            0,
            orderTotalQty - orderDeliveredQty,
          );
          const progressPercent = Math.min(
            100,
            Math.round((orderDeliveredQty / Math.max(1, orderTotalQty)) * 100),
          );

          return (
            <Modal
              isOpen={!!selectedOrder}
              onClose={() => setSelectedOrder(null)}
              title={`Chi tiết ${selectedOrder.orderCode.startsWith("#") ? selectedOrder.orderCode : `#${selectedOrder.orderCode}`}`}
              maxWidth="xl"
            >
              <div className="space-y-4 text-xs max-h-[78vh] overflow-y-auto pr-1">
                <OrderStatusTimeline status={selectedOrder.status} />

                {/* Thanh cập nhật trạng thái đơn hàng */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/60 dark:to-indigo-950/60 border border-blue-200 dark:border-blue-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
                  <span className="font-extrabold text-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                    Cập nhật trạng thái đơn hàng:
                  </span>

                  <select
                    value={selectedOrder.status}
                    disabled={updatingStatus}
                    onChange={(e) =>
                      handleUpdateStatus(
                        selectedOrder._id,
                        e.target.value as OrderStatus,
                      )
                    }
                    className="font-bold py-2 px-3 rounded-xl border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 text-xs shadow-xs focus:outline-none cursor-pointer"
                  >
                    <option
                      value="PENDING"
                      className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1"
                    >
                      1. Chờ xử lý
                    </option>
                    <option
                      value="CONFIRMED"
                      className="bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 font-bold py-1"
                    >
                      2. Đã xác nhận
                    </option>
                    <option
                      value="SHIPPING_TO_VN"
                      className="bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 font-bold py-1"
                    >
                      3. Hàng đang về Việt Nam
                    </option>
                    <option
                      value="IN_VN_WAREHOUSE"
                      className="bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 font-bold py-1"
                    >
                      4. Đã về kho Việt Nam
                    </option>
                    <option
                      value="SHIPPING"
                      className="bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold py-1"
                    >
                      5. Vận chuyển
                    </option>
                    <option
                      value="PARTIAL_DELIVERED"
                      className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-bold py-1"
                    >
                      6. Giao một phần
                    </option>
                    <option
                      value="COMPLETED"
                      className="bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 font-bold py-1"
                    >
                      7. Hoàn thành
                    </option>
                    <option
                      value="CANCELLED"
                      className="bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 font-bold py-1"
                    >
                      8. Đã huỷ
                    </option>
                  </select>
                </div>

                {/* KHỐI QUẢN LÝ TIẾN ĐỘ & CÁC ĐỢT GIAO HÀNG (PARTIAL DELIVERY) */}
                <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/90 dark:to-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <Truck size={16} />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-gray-900 dark:text-white text-xs sm:text-sm">
                          TIẾN ĐỘ XUẤT TRẢ HÀNG (GIAO THEO ĐỢT)
                        </h4>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400">
                          Theo dõi và xuất trả hàng từng phần cho khách
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-xl text-xs font-black border shadow-2xs ${
                        orderDeliveredQty >= orderTotalQty
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : orderDeliveredQty > 0
                            ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600"
                      }`}
                    >
                      Đã trả: {orderDeliveredQty} / {orderTotalQty} SP (
                      {progressPercent}%)
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progressPercent >= 100
                          ? "bg-emerald-500"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Danh sách các đợt đã giao */}
                  {selectedOrder.deliveries &&
                    selectedOrder.deliveries.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <p className="font-bold text-gray-700 dark:text-slate-300 text-[11px] uppercase tracking-wider">
                          LỊCH SỬ CÁC ĐỢT ĐÃ XUẤT (
                          {selectedOrder.deliveries.length} ĐỢT):
                        </p>
                        <div className="space-y-2">
                          {selectedOrder.deliveries.map((batch) => {
                            const bColor = getDeliveryBatchStatusColor(batch.status);
                            const isUpdating = updatingBatchStatus === batch.batchIndex;

                            return (
                              <div
                                key={batch.batchIndex}
                                className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                              >
                                <div className="space-y-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-black text-blue-600 dark:text-blue-400 text-xs">
                                      Đợt {batch.batchIndex}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      •
                                    </span>
                                    <span className="text-gray-500 dark:text-slate-400 text-[11px]">
                                      {formatDate(batch.deliveredAt)}
                                    </span>

                                    {/* Trạng thái đợt */}
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${bColor.bg} ${bColor.text} ${bColor.border}`}
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                      <span>{getDeliveryBatchStatusText(batch.status)}</span>
                                    </span>
                                  </div>

                                  {/* Danh sách món trong đợt này */}
                                  <div className="text-[11px] text-gray-700 dark:text-slate-300 flex flex-wrap gap-x-3 gap-y-1 pt-0.5">
                                    {batch.items?.map((bi, bIdx) => (
                                      <span
                                        key={bIdx}
                                        className="inline-flex items-center gap-1 font-medium"
                                      >
                                        <span>
                                          • {bi.name}{" "}
                                          {bi.size ? `(${bi.size})` : ""}:
                                        </span>
                                        <strong className="text-blue-600 dark:text-blue-400">
                                          x{bi.quantity}
                                        </strong>
                                      </span>
                                    ))}
                                  </div>

                                  {batch.note && (
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                      Ghi chú: "{batch.note}"
                                    </p>
                                  )}
                                </div>

                                {/* Đổi trạng thái đợt & Nút xoá */}
                                <div className="flex items-center gap-2 justify-end flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-800">
                                  <select
                                    value={batch.status || "DELIVERED"}
                                    disabled={isUpdating}
                                    onChange={(e) =>
                                      handleUpdateDeliveryBatchStatus(
                                        batch.batchIndex,
                                        e.target.value,
                                      )
                                    }
                                    className="text-[11px] font-bold py-1 px-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-blue-500 cursor-pointer"
                                  >
                                    <option value="DELIVERED">✓ Đã nhận hàng</option>
                                    <option value="SHIPPING">🚚 Đang giao hàng</option>
                                    <option value="PREPARING">📦 Đang chuẩn bị</option>
                                    <option value="FAILED">✕ Giao thất bại</option>
                                  </select>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteDeliveryBatch(batch.batchIndex)
                                    }
                                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                    title={`Xóa Đợt ${batch.batchIndex}`}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                  {/* Khu vực Hàng còn nợ & Nút mở Form xuất hàng */}
                  {remainingTotalQty > 0 ? (
                    !showDeliveryForm ? (
                      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/60 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/80 dark:border-amber-900/50">
                        <div className="text-xs">
                          <span className="font-bold text-amber-900 dark:text-amber-300">
                            Còn nợ {remainingTotalQty} sản phẩm chưa xuất trả
                          </span>
                          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                            Hàng về kho có thể bấm xuất trả tiếp đợt{" "}
                            {(selectedOrder.deliveries?.length || 0) + 1}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={handleOpenDeliveryForm}
                          className="text-xs py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer whitespace-nowrap flex items-center gap-1.5"
                        >
                          <PlusCircle size={14} />
                          <span>
                            Xuất hàng đợt{" "}
                            {(selectedOrder.deliveries?.length || 0) + 1}
                          </span>
                        </Button>
                      </div>
                    ) : (
                      /* FORM XUẤT HÀNG ĐỢT TIẾP THEO */
                      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-xl border-2 border-blue-500/80 space-y-3 shadow-md animate-fade-in">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
                          <span className="font-black text-blue-600 dark:text-blue-400 text-xs sm:text-sm flex items-center gap-1.5">
                            <PackageCheck size={16} />
                            TẠO PHIẾU XUẤT ĐỢT{" "}
                            {(selectedOrder.deliveries?.length || 0) + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowDeliveryForm(false)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        {/* Danh sách SP chọn số lượng xuất */}
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-700 dark:text-slate-300 uppercase">
                            Chọn số lượng xuất đợt này:
                          </label>
                          <div className="space-y-1.5">
                            {selectedOrder.items.map((it, idx) => {
                              const delivered = getItemDeliveredQty(
                                selectedOrder,
                                idx,
                              );
                              const maxAvailable = Math.max(
                                0,
                                (it.quantity || 1) - delivered,
                              );
                              const currentInput =
                                deliveryItemsInput[idx] !== undefined
                                  ? deliveryItemsInput[idx]
                                  : maxAvailable;

                              return (
                                <div
                                  key={idx}
                                  className="p-2.5 bg-gray-50 dark:bg-slate-800/80 rounded-xl border border-gray-200/80 dark:border-slate-700 flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                                      {cleanProductName(it.name)}
                                    </p>
                                    <p className="text-[10px] text-gray-500 dark:text-slate-400">
                                      Đặt: {it.quantity} | Đã trả: {delivered} |
                                      Còn nợ:{" "}
                                      <strong className="text-rose-600 dark:text-rose-400">
                                        {maxAvailable}
                                      </strong>
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <span className="text-xs text-gray-500">
                                      Xuất:
                                    </span>
                                    <input
                                      type="number"
                                      min={0}
                                      max={maxAvailable}
                                      value={currentInput}
                                      onChange={(e) =>
                                        handleQuantityInputChange(
                                          idx,
                                          Number(e.target.value),
                                          maxAvailable,
                                        )
                                      }
                                      className="w-16 text-center py-1 px-2 border border-blue-400 rounded-lg font-black text-xs bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <span className="text-[11px] text-gray-400">
                                      / {maxAvailable}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Trạng thái đợt giao & Ghi chú đợt giao */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                          <div className="sm:col-span-1">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-1">
                              Trạng thái đợt này
                            </label>
                            <select
                              value={deliveryStatus}
                              onChange={(e) => setDeliveryStatus(e.target.value)}
                              className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-bold cursor-pointer"
                            >
                              <option value="DELIVERED">✓ Đã nhận hàng</option>
                              <option value="SHIPPING">🚚 Đang giao hàng</option>
                              <option value="PREPARING">📦 Đang chuẩn bị</option>
                              <option value="FAILED">✕ Giao thất bại</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-[11px] font-semibold text-gray-700 dark:text-slate-300 block mb-1">
                              Ghi chú đợt giao
                            </label>
                            <input
                              type="text"
                              placeholder="Ví dụ: Giao trước 5 cái hàng có sẵn, 5 cái còn lại đang về..."
                              value={deliveryNote}
                              onChange={(e) => setDeliveryNote(e.target.value)}
                              className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-slate-500"
                            />
                          </div>
                        </div>

                        {/* Nút hành động */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => setShowDeliveryForm(false)}
                            className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 font-bold text-xs hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={savingDelivery}
                            onClick={handleAddDeliveryBatch}
                            className="text-xs py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                          >
                            {savingDelivery ? "Đang xuất hàng..." : "Xác nhận"}
                          </Button>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs text-center flex items-center justify-center gap-1.5">
                      <CheckCircle2 size={16} />
                      <span>
                        Đã xuất trả đầy đủ {orderTotalQty} / {orderTotalQty} sản
                        phẩm cho đơn hàng này!
                      </span>
                    </div>
                  )}
                </div>

                {/* Ghi chú của Admin / Shop gửi Khách Hàng (Admin Note) */}
                <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold text-xs">
                      <MessageSquare
                        size={15}
                        className="text-amber-600 dark:text-amber-400"
                      />
                      <span>Admin note</span>
                    </div>
                  </div>
                  <textarea
                    rows={2}
                    value={adminNoteText}
                    onChange={(e) => setAdminNoteText(e.target.value)}
                    placeholder="Ví dụ: Đơn hàng dự kiến về kho ngày 18/09, shop gửi tặng bạn món quà nhỏ nhé..."
                    className="w-full text-xs p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-gray-400 dark:placeholder-slate-500 shadow-2xs resize-y"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-gray-500 dark:text-slate-400 italic truncate max-w-[280px]">
                      {selectedOrder.adminNote
                        ? `Đã lưu: "${selectedOrder.adminNote}"`
                        : "Chưa có ghi chú"}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      disabled={
                        savingNote ||
                        adminNoteText.trim() ===
                          (selectedOrder.adminNote || "").trim()
                      }
                      onClick={handleSaveAdminNote}
                      className="text-xs py-1.5 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {savingNote ? "Đang lưu..." : "Lưu ghi chú"}
                    </Button>
                  </div>
                </div>

                {/* Thông tin đơn hàng tóm tắt */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/80 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Calendar size={14} className="text-blue-500" />
                    <span>
                      Ngày đặt:{" "}
                      <strong>
                        {formatDate(
                          selectedOrder.orderDate ||
                            (selectedOrder as any).createdAt,
                        )}
                      </strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CreditCard size={14} className="text-emerald-500" />
                    <span>
                      PTTT:{" "}
                      <strong className="uppercase">
                        {getPaymentMethodText(selectedOrder.paymentMethod)}
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Thông tin khách hàng & Địa chỉ */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <User size={12} className="text-blue-500" />
                      <span>Khách hàng nhận</span>
                    </div>
                    <p className="font-extrabold text-gray-900 dark:text-white text-sm">
                      {selectedOrder.customerInfo?.name ||
                        (typeof selectedOrder.customer === "object"
                          ? (selectedOrder.customer as any)?.name
                          : "Khách hàng")}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 font-medium">
                      SĐT:{" "}
                      {selectedOrder.customerInfo?.phone ||
                        (typeof selectedOrder.customer === "object"
                          ? (selectedOrder.customer as any)?.phone
                          : "Chưa có")}
                    </p>
                  </div>

                  <div className="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-400 font-bold uppercase tracking-wider text-[10px]">
                      <MapPin size={12} className="text-rose-500" />
                      <span>Địa chỉ nhận hàng</span>
                    </div>
                    <p className="text-gray-800 dark:text-slate-200 font-medium leading-relaxed">
                      {selectedOrder.customerInfo?.address || "Chưa cung cấp"}
                    </p>
                    {selectedOrder.customerInfo?.note && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 italic pt-0.5">
                        Ghi chú: {selectedOrder.customerInfo.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mặt hàng */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/80 p-3.5 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700/80 pb-2">
                    <p className="font-bold text-gray-900 dark:text-white text-xs uppercase tracking-wider">
                      SẢN PHẨM ĐƠN HÀNG ({selectedOrder.items.length})
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-slate-700/70">
                    {selectedOrder.items.map((item, idx) => {
                      const pCode = getOrderItemCode(item);
                      return (
                        <div
                          key={idx}
                          className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={getImageUrl(item.image)}
                              alt={item.name}
                              onError={handleImageError}
                              className="w-12 h-12 rounded-xl object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0 shadow-2xs"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-gray-900 dark:text-white text-xs truncate">
                                {cleanProductName(item.name)}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                {pCode && (
                                  <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600/80 rounded-md font-mono font-bold text-[10px]">
                                    Mã SP: {pCode}
                                  </span>
                                )}
                                {item.sellingOption && (
                                  <span className="px-2 py-0.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 rounded-md font-bold text-[10px]">
                                    {item.sellingOption}
                                  </span>
                                )}
                                {item.size && (
                                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80 rounded-md font-bold text-[10px]">
                                    Size: {item.size}
                                  </span>
                                )}
                                {item.color && (
                                  <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 rounded-md font-bold text-[10px]">
                                    Màu: {item.color}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-400 dark:text-gray-400 text-[11px] mt-1">
                                {formatCurrency(item.price)} × {item.quantity}
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="font-extrabold text-gray-900 dark:text-white text-sm block">
                              {formatCurrency(
                                item.total || item.price * item.quantity,
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chi phí thanh toán */}
                <div className="bg-gray-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700/80 space-y-2">
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>Tạm tính hàng hoá:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(
                        selectedOrder.subtotal ||
                          selectedOrder.items.reduce(
                            (s, it) => s + (it.total || it.price * it.quantity),
                            0,
                          ),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                    <span>Phí vận chuyển:</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {!selectedOrder.shippingFee ||
                      selectedOrder.shippingFee === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          Miễn phí
                        </span>
                      ) : (
                        formatCurrency(selectedOrder.shippingFee)
                      )}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-slate-700 pt-2 flex justify-between items-baseline">
                    <span className="font-extrabold text-gray-900 dark:text-white text-sm">
                      Tổng cộng đơn hàng:
                    </span>
                    <span className="text-rose-600 dark:text-rose-400 text-lg sm:text-xl font-black">
                      {formatCurrency(selectedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </Modal>
          );
        })()}
    </div>
  );
};

export default AdminOrdersPage;
