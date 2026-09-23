import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  UserCheck,
  UserX,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit2,
  RotateCw,
  X,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Package,
  ShoppingBag,
  CreditCard,
  Check,
  Clock,
  ExternalLink,
} from "lucide-react";
import { userApi } from "@/entities/user/api/userApi";
import { orderApi } from "@/entities/order/api/orderApi";
import { User, Order } from "@/shared/types";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
} from "@/shared/lib/formatters";
import { getImageUrl, handleImageError } from "@/shared/lib/imageHelper";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

export const AdminCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  // Drawer chi tiết khách hàng
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Modal sửa thông tin khách hàng
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await userApi.getCustomers(search || undefined);
      setCustomers(data);
    } catch (err) {
      console.error("Fetch customers error:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Lấy danh sách đơn hàng của khách hàng đang chọn
  const fetchCustomerOrders = useCallback(async (customerId: string) => {
    setLoadingOrders(true);
    try {
      const res = await orderApi.getAll({
        customerId,
        limit: 100,
      });
      setCustomerOrders(res.items || []);
    } catch (err) {
      console.error("Fetch customer orders error:", err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const handleOpenDetail = (customer: User) => {
    setSelectedCustomer(customer);
    fetchCustomerOrders(customer._id);
  };

  const handleCloseDetail = () => {
    setSelectedCustomer(null);
    setCustomerOrders([]);
  };

  const handleOpenEdit = () => {
    if (!selectedCustomer) return;
    setEditName(selectedCustomer.name || "");
    setEditPhone(selectedCustomer.phone || "");
    setEditEmail(selectedCustomer.email || "");
    setEditAddress(selectedCustomer.address || "");
    setEditError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    if (!editName.trim() || !editPhone.trim()) {
      setEditError("Vui lòng nhập đầy đủ Tên và Số điện thoại");
      return;
    }

    setSavingEdit(true);
    setEditError("");
    try {
      const updated = await userApi.updateCustomer(selectedCustomer._id, {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim() || undefined,
        address: editAddress.trim() || undefined,
      });

      // Cập nhật selectedCustomer và danh sách khách hàng
      setSelectedCustomer(updated);
      setCustomers((prev) =>
        prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)),
      );

      setIsEditModalOpen(false);
      setActionSuccess("Cập nhật thông tin khách hàng thành công!");
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      setEditError(err.message || "Cập nhật thông tin thất bại");
    } finally {
      setSavingEdit(false);
    }
  };

  const toggleStatus = async (c: User, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newStatus = c.status === "blocked" ? "active" : "blocked";
    const actionName = newStatus === "active" ? "mở khóa" : "khóa";
    if (
      !window.confirm(`Bạn có chắc muốn ${actionName} tài khoản "${c.name}"?`)
    ) {
      return;
    }

    try {
      await userApi.updateStatus(c._id, newStatus);
      setCustomers((prev) =>
        prev.map((item) =>
          item._id === c._id ? { ...item, status: newStatus } : item,
        ),
      );
      if (selectedCustomer && selectedCustomer._id === c._id) {
        setSelectedCustomer({ ...selectedCustomer, status: newStatus });
      }
      setActionSuccess(`Đã ${actionName} tài khoản thành công!`);
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.message || "Cập nhật trạng thái thất bại");
    }
  };

  // Tính toán các chỉ số thống kê từ lịch sử mua hàng của khách
  const totalOrdersCount = customerOrders.length;
  const validOrders = customerOrders.filter((o) => o.status !== "CANCELLED");
  const totalSpending = validOrders.reduce(
    (sum, o) => sum + (o.totalAmount || 0),
    0,
  );
  const totalPaid = validOrders.reduce(
    (sum, o) => sum + (o.paidAmount || (o.status === "COMPLETED" ? o.totalAmount : 0)),
    0,
  );
  const totalDebt = Math.max(0, totalSpending - totalPaid);

  const latestOrder = customerOrders.length > 0 ? customerOrders[0] : null;
  const latestOrderDate = latestOrder
    ? formatDate(latestOrder.createdAt || latestOrder.orderDate)
    : "Chưa có";

  return (
    <div className="space-y-4 sm:space-y-6 text-gray-900 dark:text-white">
      {/* Alert message */}
      {actionSuccess && (
        <div className="p-3 sm:p-4 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3 sm:p-4 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2 animate-shake shadow-2xs">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header controls */}
      <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 transition-colors">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Tìm theo Tên, Email, hoặc Số điện thoại..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-xl focus:border-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs font-medium"
          />
          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
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
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="bg-slate-100/80 dark:bg-slate-900/90 text-gray-600 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/80 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">
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
                  const isBlocked = c.status === "blocked";
                  const isSelected = selectedCustomer?._id === c._id;

                  return (
                    <tr
                      key={c._id}
                      onClick={() => handleOpenDetail(c)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-blue-50/70 dark:bg-blue-950/40"
                          : "hover:bg-gray-50/80 dark:hover:bg-slate-700/40"
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-2xs">
                            {c.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate max-w-[140px] sm:max-w-none text-xs">
                              {c.name}
                            </p>
                            <p className="text-gray-400 dark:text-slate-400 text-[11px] truncate max-w-[140px] sm:max-w-none">
                              {c.email || "Chưa có email"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-gray-700 dark:text-gray-300 text-xs">
                        {c.phone || "Chưa cập nhật"}
                      </td>
                      <td className="py-3.5 px-3 text-gray-600 dark:text-slate-300 max-w-[140px] truncate text-xs">
                        {c.address || "Chưa cập nhật"}
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                        {c.createdAt ? formatDate(c.createdAt) : "N/A"}
                      </td>
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            isBlocked
                              ? "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          }`}
                        >
                          {isBlocked ? "Đã khóa" : "Hoạt động"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(c);
                          }}
                          className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Xem chi tiết và lịch sử mua hàng"
                        >
                          <Eye size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => toggleStatus(c, e)}
                          className={`px-2 py-1 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer ${
                            isBlocked
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
                              : "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                          }`}
                          title={isBlocked ? "Mở khóa tài khoản" : "Khóa tài khoản"}
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

      {/* ======================================================== */}
      {/* DRAWER / MODAL CHI TIẾT KHÁCH HÀNG & LỊCH SỬ MUA HÀNG */}
      {/* ======================================================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
          {/* Backdrop click to close */}
          <div
            className="flex-1 cursor-pointer"
            onClick={handleCloseDetail}
          />

          {/* Drawer Container */}
          <div className="w-full max-w-xl bg-slate-900 text-white h-full shadow-2xl flex flex-col border-l border-slate-800 animate-slide-in-right overflow-hidden">
            {/* Header Drawer */}
            <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-emerald-500/20 shrink-0">
                  {selectedCustomer.name?.[0]?.toUpperCase() || "K"}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      {selectedCustomer.name}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-950/80 text-teal-400 border border-teal-800/60 shadow-2xs">
                      Lẻ
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">
                    Mã khách:{" "}
                    <span className="text-slate-300 font-bold uppercase">
                      {selectedCustomer._id.slice(-6)}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Header */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => fetchCustomerOrders(selectedCustomer._id)}
                  disabled={loadingOrders}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Làm mới lịch sử đơn hàng"
                >
                  <RotateCw
                    size={16}
                    className={loadingOrders ? "animate-spin text-blue-400" : ""}
                  />
                </button>

                <button
                  type="button"
                  onClick={handleOpenEdit}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-300 hover:text-teal-200 rounded-xl text-xs font-bold transition-all border border-slate-700 cursor-pointer shadow-2xs"
                >
                  <Edit2 size={13} />
                  <span>Sửa</span>
                </button>

                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
                  title="Đóng"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar">
              {/* 3 Thẻ Thống Kê Tài Chính (Tổng hàng, Công nợ, Đã thu về) */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                {/* 1. TỔNG HÀNG */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    TỔNG HÀNG
                  </span>
                  <div className="my-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-white block">
                      {formatCurrency(totalSpending)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {totalOrdersCount} đơn
                  </span>
                </div>

                {/* 2. CÔNG NỢ */}
                <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-wider">
                    CÔNG NỢ
                  </span>
                  <div className="my-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-rose-500 block">
                      {formatCurrency(totalDebt)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    {totalDebt > 0 ? "Chưa thanh toán" : "Đã thanh toán hết"}
                  </span>
                </div>

                {/* 3. ĐÃ THU VỀ */}
                <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    ĐÃ THU VỀ
                  </span>
                  <div className="my-1.5">
                    <span className="text-sm sm:text-base font-extrabold text-emerald-400 block">
                      {formatCurrency(totalPaid)}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400">
                    Thực nhận
                  </span>
                </div>
              </div>

              {/* THÔNG TIN LIÊN LẠC & GIAO HÀNG */}
              <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-3.5 sm:p-4 space-y-2.5">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  THÔNG TIN LIÊN LẠC & GIAO HÀNG
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5 text-gray-300">
                    <MapPin size={15} className="text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-gray-400">Địa chỉ: </span>
                      <strong className="text-white font-semibold">
                        {selectedCustomer.address || "Chưa cập nhật địa chỉ"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Phone size={15} className="text-blue-400 shrink-0" />
                    <div>
                      <span className="text-gray-400">Số điện thoại: </span>
                      <strong className="font-mono text-white">
                        {selectedCustomer.phone || "Chưa cập nhật"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Mail size={15} className="text-purple-400 shrink-0" />
                    <div>
                      <span className="text-gray-400">Email: </span>
                      <strong className="text-white">
                        {selectedCustomer.email || "Chưa cập nhật"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Calendar size={15} className="text-amber-400 shrink-0" />
                    <div>
                      <span className="text-gray-400">Ngày đăng ký: </span>
                      <strong className="text-white">
                        {selectedCustomer.createdAt
                          ? formatDate(selectedCustomer.createdAt)
                          : "N/A"}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* LỊCH SỬ MUA HÀNG */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <Package size={16} className="text-emerald-400" />
                    <span>
                      LỊCH SỬ MUA HÀNG ({customerOrders.length} ĐƠN)
                    </span>
                  </h4>
                  <span className="text-[11px] text-gray-400 font-medium">
                    Gần nhất: {latestOrderDate}
                  </span>
                </div>

                {loadingOrders ? (
                  <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800">
                    <LoadingSpinner text="Đang tải lịch sử đơn hàng..." />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="p-8 text-center bg-slate-800/30 rounded-2xl border border-slate-800 text-gray-400 text-xs">
                    <ShoppingBag size={28} className="mx-auto mb-2 opacity-40 text-gray-500" />
                    <span>Khách hàng này chưa có đơn hàng nào trong hệ thống.</span>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {customerOrders.map((order) => {
                      const statusColor = getOrderStatusColor(order.status);
                      const statusText = getOrderStatusText(order.status);
                      const orderDate = formatDate(
                        order.createdAt || order.orderDate,
                      );
                      const paid = order.paidAmount || (order.status === "COMPLETED" ? order.totalAmount : 0);
                      const debt = Math.max(0, order.totalAmount - paid);

                      return (
                        <div
                          key={order._id}
                          className="bg-slate-800/50 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-3.5 transition-all space-y-2.5 shadow-xs"
                        >
                          {/* Hàng 1: Mã đơn, Trạng thái, Tổng tiền */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono font-bold text-white text-xs tracking-wide">
                                {order.orderCode}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusColor.bg} ${statusColor.text} ${statusColor.border}`}
                              >
                                {statusText}
                              </span>
                            </div>

                            <span className="font-extrabold text-sm text-white whitespace-nowrap">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>

                          {/* Hàng 2: Tóm tắt các món trong đơn */}
                          <div className="space-y-1 py-1 border-y border-slate-800/60">
                            {order.items?.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-xs text-gray-300 gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {item.image ? (
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={item.name}
                                      onError={handleImageError}
                                      className="w-6 h-6 rounded object-cover border border-slate-700 shrink-0"
                                    />
                                  ) : (
                                    <div className="w-6 h-6 rounded bg-slate-700 shrink-0 flex items-center justify-center text-[10px]">
                                      📦
                                    </div>
                                  )}
                                  <span className="truncate text-gray-200 font-medium text-[11px] sm:text-xs">
                                    {item.name}
                                  </span>
                                  {(item.size || item.color || item.sellingOption) && (
                                    <span className="text-[10px] text-gray-400 shrink-0">
                                      ({[item.sellingOption, item.size, item.color].filter(Boolean).join(" - ")})
                                    </span>
                                  )}
                                </div>
                                <span className="text-[11px] text-gray-400 shrink-0 font-semibold">
                                  x{item.quantity}
                                </span>
                              </div>
                            ))}
                          </div>

                          {/* Hàng 3: Thời gian, Đã thu, Nợ */}
                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-gray-400 flex items-center gap-1">
                              <Clock size={12} />
                              <span>{orderDate}</span>
                            </span>

                            <div className="flex items-center gap-3 font-semibold text-[11px]">
                              <span className="text-emerald-400">
                                Đã thu: {formatCurrency(paid)}
                              </span>
                              <span className={debt > 0 ? "text-rose-400" : "text-gray-400"}>
                                Nợ: {formatCurrency(debt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CHỈNH SỬA THÔNG TIN KHÁCH HÀNG */}
      {/* ======================================================== */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Chỉnh sửa thông tin khách hàng"
        size="md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle size={15} />
              <span>{editError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Tên khách hàng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Nhập họ tên khách hàng..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Số điện thoại <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="Nhập số điện thoại..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-mono font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="Nhập địa chỉ email..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
              Địa chỉ giao hàng
            </label>
            <textarea
              rows={2}
              value={editAddress}
              onChange={(e) => setEditAddress(e.target.value)}
              placeholder="Nhập địa chỉ nhận hàng của khách..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 font-medium resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={savingEdit}
              className="font-bold shadow-xs px-4"
            >
              LƯU THAY ĐỔI
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
