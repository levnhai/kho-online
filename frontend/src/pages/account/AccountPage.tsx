import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  User as UserIcon,
  Package,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Calendar,
  MapPin,
  CreditCard,
  ShoppingBag,
  Search,
  Filter,
  RotateCcw,
  XCircle,
  Tag,
  Palette,
} from "lucide-react";
import { useAuth } from "@/app/providers/AuthContext";
import { useSocket } from "@/app/providers/SocketContext";
import { useCart } from "@/entities/cart/CartContext";
import { userApi } from "@/entities/user/api/userApi";
import { orderApi } from "@/entities/order/api/orderApi";
import { OrderStatusTimeline } from "@/entities/order/ui/OrderStatusTimeline";
import { Order } from "@/shared/types";
import {
  formatCurrency,
  formatDate,
  getOrderStatusText,
  getOrderStatusColor,
  getPaymentMethodText,
  cleanProductName,
} from "@/shared/lib/formatters";
import { getImageUrl, handleImageError } from "@/shared/lib/imageHelper";
import { playNotificationSound } from "@/shared/lib/sound";
import { Button } from "@/shared/ui/Button";
import { Input } from "@/shared/ui/Input";
import { Modal } from "@/shared/ui/Modal";
import { LoadingSpinner } from "@/shared/ui/LoadingSpinner";

const ORDER_STATUS_TABS = [
  { key: "ALL", label: "Tất cả" },
  { key: "PENDING", label: "Xử lý" },
  { key: "CONFIRMED", label: "xác nhận" },
  { key: "SHIPPING_TO_VN", label: "Đang về Việt Nam" },
  { key: "IN_VN_WAREHOUSE", label: "Kho Việt Nam" },
  { key: "SHIPPING", label: "Vận chuyển" },
  { key: "COMPLETED", label: "Hoàn thành" },
  { key: "CANCELLED", label: "Đã huỷ" },
];

export const AccountPage: React.FC = () => {
  const { user, updateUser, logout, isAuthenticated, loading } = useAuth();
  const { socket } = useSocket();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentTab = searchParams.get("tab") || "profile";

  // Profile form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(
    null,
  );
  const [realtimeNotification, setRealtimeNotification] = useState<string>("");

  useEffect(() => {
    if (loading) return; // Đợi nạp xong auth session từ storage/profile
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user, isAuthenticated, loading, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      setOrdersLoading(true);
      orderApi
        .getMyOrders()
        .then(setOrders)
        .catch(console.error)
        .finally(() => setOrdersLoading(false));
    }
  }, [isAuthenticated]);

  // Realtime socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdated = (updatedOrder: Order) => {
      setOrders((prev) => {
        const exists = prev.some((o) => o._id === updatedOrder._id);
        if (exists) {
          return prev.map((o) =>
            o._id === updatedOrder._id ? updatedOrder : o,
          );
        }
        return [updatedOrder, ...prev];
      });

      setSelectedOrder((prev) =>
        prev?._id === updatedOrder._id ? updatedOrder : prev,
      );
      playNotificationSound();
      setRealtimeNotification(
        `Đơn hàng #${updatedOrder.orderCode} vừa được cập nhật sang: "${getOrderStatusText(updatedOrder.status)}"`,
      );
      setTimeout(() => setRealtimeNotification(""), 6000);
    };

    const handleOrderCancelled = (cancelledOrder: Order) => {
      setOrders((prev) =>
        prev.map((o) => (o._id === cancelledOrder._id ? cancelledOrder : o)),
      );
      setSelectedOrder((prev) =>
        prev?._id === cancelledOrder._id ? cancelledOrder : prev,
      );
    };

    socket.on("order_status_updated", handleStatusUpdated);
    socket.on("order_cancelled", handleOrderCancelled);

    return () => {
      socket.off("order_status_updated", handleStatusUpdated);
      socket.off("order_cancelled", handleOrderCancelled);
    };
  }, [socket]);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesStatus =
        statusFilter === "ALL" || ord.status === statusFilter;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        ord.orderCode.toLowerCase().includes(q) ||
        ord.items.some(
          (it) =>
            it.name.toLowerCase().includes(q) ||
            (it.productCode && it.productCode.toLowerCase().includes(q)) ||
            (typeof it.product === 'object' &&
              it.product?.code &&
              it.product.code.toLowerCase().includes(q))
        );
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const getStatusCount = (statusKey: string) => {
    if (statusKey === "ALL") return orders.length;
    return orders.filter((o) => o.status === statusKey).length;
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này không?")) {
      return;
    }
    setCancellingOrderId(orderId);
    try {
      const updated = await orderApi.cancelMyOrder(orderId);
      setOrders((prev) => prev.map((o) => (o._id === orderId ? updated : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder(updated);
      }
    } catch (err: any) {
      alert(err.message || "Huỷ đơn hàng không thành công");
    } finally {
      setCancellingOrderId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (password && password !== confirmPassword) {
      setProfileError("Mật khẩu mới và xác nhận mật khẩu không khớp");
      return;
    }

    setProfileLoading(true);
    try {
      const updateData: any = { name, phone, address };
      if (password) updateData.password = password;

      const updated = await userApi.updateProfile(updateData);
      updateUser(updated);
      setProfileSuccess("Cập nhật thông tin tài khoản thành công!");
      setPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setProfileError(err.message || "Cập nhật thất bại");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setSearchParams({ tab });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-16">
        <LoadingSpinner text="Đang tải dữ liệu tài khoản..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 sm:py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <h1 className="hidden sm:block text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4 sm:mb-8">
          TÀI KHOẢN CỦA TÔI
        </h1>

        {/* Mobile Horizontal Tabs */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 no-scrollbar">
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === "profile"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
            }`}
          >
            <UserIcon size={14} />
            <span>Thông tin cá nhân</span>
          </button>
          <button
            onClick={() => handleTabChange("orders")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              currentTab === "orders"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-700"
            }`}
          >
            <Package size={14} />
            <span>
              Đơn hàng của tôi {orders.length > 0 ? `(${orders.length})` : ""}
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Desktop Left Sidebar */}
          <div className="hidden lg:block lg:col-span-3 bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-2 transition-colors">
            <div className="flex items-center gap-3 p-3 pb-5 border-b border-gray-100 dark:border-slate-700">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-black text-lg">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleTabChange("profile")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                currentTab === "profile"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <UserIcon size={18} />
              <span>Thông tin cá nhân</span>
            </button>

            <button
              onClick={() => handleTabChange("orders")}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-semibold transition-all text-left ${
                currentTab === "orders"
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <Package size={18} />
                <span>
                  Đơn hàng của tôi{" "}
                  {orders.length > 0 ? `(${orders.length})` : ""}
                </span>
              </div>
            </button>

            <div className="pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                onClick={() => {
                  logout();
                  navigate("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all text-left"
              >
                <LogOut size={18} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm transition-colors">
            {currentTab === "profile" ? (
              <form
                onSubmit={handleUpdateProfile}
                className="space-y-4 sm:space-y-6 max-w-2xl"
              >
                <div className="pb-3 border-b border-gray-100 dark:border-slate-700">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Hồ sơ cá nhân
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Quản lý thông tin hồ sơ và mật khẩu tài khoản
                  </p>
                </div>

                {profileSuccess && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 size={16} />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 rounded-xl text-xs font-semibold border border-rose-200 dark:border-rose-900/50">
                    <AlertCircle size={16} />
                    <span>{profileError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <Input
                    label="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Email (Không thể thay đổi)"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />

                <Input
                  label="Địa chỉ giao hàng mặc định"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nhập số nhà, tên đường..."
                />

                <div className="pt-3 border-t border-gray-100 dark:border-slate-700">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <KeyRound
                      size={16}
                      className="text-blue-600 dark:text-blue-400"
                    />
                    <span>Đổi mật khẩu (Bỏ trống nếu không muốn đổi)</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Input
                      type={showPassword ? "text" : "password"}
                      label="Mật khẩu mới"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ít nhất 6 ký tự"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer transition-colors p-1"
                          tabIndex={-1}
                          title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      label="Xác nhận mật khẩu mới"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Nhập lại mật khẩu mới"
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer transition-colors p-1"
                          tabIndex={-1}
                          title={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  loading={profileLoading}
                  className="w-full sm:w-auto font-bold px-8 shadow-md shadow-blue-600/25"
                >
                  Lưu thay đổi
                </Button>
              </form>
            ) : (
              <div>
                <div className="pb-3 border-b border-gray-100 dark:border-slate-700 mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                    Lịch sử đơn hàng{" "}
                    {orders.length > 0 ? `(${orders.length})` : ""}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Theo dõi trạng thái và chi tiết các đơn hàng bạn đã đặt
                  </p>
                </div>

                {realtimeNotification && (
                  <div className="mb-4 p-3.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-2xl border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center gap-2.5 shadow-xs">
                    <CheckCircle2
                      size={18}
                      className="text-blue-600 dark:text-blue-400 flex-shrink-0"
                    />
                    <span>{realtimeNotification}</span>
                  </div>
                )}

                {/* Status Filter Tabs & Search Bar */}
                <div className="space-y-3 mb-6">
                  {/* Status Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {ORDER_STATUS_TABS.map((tab) => {
                      const count = getStatusCount(tab.key);
                      const isActive = statusFilter === tab.key;
                      return (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setStatusFilter(tab.key)}
                          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                              : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/80 border border-gray-200 dark:border-slate-700 shadow-2xs'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {count > 0 && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-600'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search bar if has orders */}
                  {orders.length > 0 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm kiếm theo mã đơn hàng (#DH...) hoặc tên sản phẩm..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-2.5 text-xs border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-900 dark:text-white rounded-2xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none placeholder-gray-400 dark:placeholder-slate-400 shadow-2xs transition-all"
                      />
                      <Search size={15} className="absolute left-3 top-3 text-gray-400" />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-2.5 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {ordersLoading ? (
                  <LoadingSpinner text="Đang tải danh sách đơn hàng..." />
                ) : orders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-900/30 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 flex items-center justify-center mx-auto mb-3">
                      <ShoppingBag size={32} />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-base">Chưa có đơn hàng nào</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 max-w-sm mx-auto">
                      Bạn chưa đặt đơn hàng nào tại CHANG. Hãy khám phá và chọn ngay sản phẩm ưng ý nhé!
                    </p>
                    <Link to="/products" className="inline-block mt-4">
                      <Button variant="primary" size="sm" className="font-bold px-4 py-2">
                        Khám phá sản phẩm
                      </Button>
                    </Link>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-gray-200 dark:border-slate-700">
                    <Package size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-700 dark:text-gray-300 font-bold text-sm">
                      Không tìm thấy đơn hàng nào phù hợp với bộ lọc
                    </p>
                    <p className="text-gray-400 text-xs mt-1">
                      Thử chọn tab trạng thái khác hoặc xoá từ khoá tìm kiếm
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 text-xs font-semibold"
                      onClick={() => {
                        setStatusFilter('ALL');
                        setSearchQuery('');
                      }}
                    >
                      Xem tất cả đơn hàng
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-5">
                    {filteredOrders.map((ord) => {
                      const color = getOrderStatusColor(ord.status);
                      const totalQuantity = ord.items.reduce((sum, it) => sum + it.quantity, 0);

                      const handleRepurchase = () => {
                        ord.items.forEach((it) => {
                          addToCart(
                            {
                              _id: typeof it.product === 'object' ? (it.product as any)._id : it.product,
                              name: it.name,
                              price: it.price,
                              images: [it.image],
                              stock: 99,
                            } as any,
                            it.quantity,
                            it.size,
                            it.color
                          );
                        });
                        navigate('/cart');
                      };

                      return (
                        <div
                          key={ord._id}
                          className="group border border-gray-100 dark:border-slate-700/70 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:border-blue-400/50 dark:hover:border-blue-500/40 hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800/90 shadow-xs space-y-4"
                        >
                          {/* 1. Header Đơn Hàng */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-gray-100 dark:border-slate-700/70">
                            {/* Trái: Mã đơn & Ngày tạo */}
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center flex-shrink-0 shadow-2xs">
                                <ShoppingBag size={15} />
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm tracking-wide font-mono">
                                  {ord.orderCode?.startsWith('#') ? ord.orderCode : `#${ord.orderCode}`}
                                </span>
                                <span className="text-gray-300 dark:text-slate-600">•</span>
                                <span className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 font-medium">
                                  <Calendar size={12} className="text-gray-400" />
                                  {formatDate(ord.orderDate || ord.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Phải: Phương thức thanh toán & Trạng thái đơn */}
                            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-medium bg-gray-100 dark:bg-slate-700/70 text-gray-600 dark:text-gray-300 border border-gray-200/70 dark:border-slate-600/60">
                                <CreditCard size={11} className="text-gray-400 dark:text-gray-400" />
                                <span>{getPaymentMethodText(ord.paymentMethod)}</span>
                              </span>

                              <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold border shadow-2xs ${color.bg} ${color.text} ${color.border}`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                                <span>{getOrderStatusText(ord.status)}</span>
                              </span>
                            </div>
                          </div>

                          {/* 2. Danh sách sản phẩm */}
                          <div className="space-y-2.5">
                            {ord.items.map((item, idx) => {
                              const productId = typeof item.product === 'object' ? (item.product as any)?._id : item.product;
                              const displayName = cleanProductName(item.name);
                              return (
                                <div
                                  key={idx}
                                  className="p-3 bg-gray-50/70 dark:bg-slate-900/40 hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-colors rounded-2xl border border-gray-100 dark:border-slate-800/70 flex items-center gap-3 sm:gap-4"
                                >
                                  {/* Ảnh sản phẩm */}
                                  <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border border-gray-200/70 dark:border-slate-700/80 flex-shrink-0 shadow-2xs">
                                    <img
                                      src={getImageUrl(item.image)}
                                      alt={displayName}
                                      onError={handleImageError}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                  </div>

                                  {/* Thông tin sản phẩm */}
                                  <div className="flex-1 min-w-0">
                                    {productId ? (
                                      <Link
                                        to={`/products/${productId}`}
                                        className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1 transition-colors block"
                                      >
                                        {displayName}
                                      </Link>
                                    ) : (
                                      <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                                        {displayName}
                                      </p>
                                    )}

                                    {/* Nhãn phân loại & Số lượng */}
                                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                      {(item.productCode || (typeof item.product === 'object' && item.product?.code)) && (
                                        <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-md font-mono font-bold text-[10px]">
                                          Mã SP: {item.productCode || (typeof item.product === 'object' && item.product?.code)}
                                        </span>
                                      )}
                                      {item.sellingOption && (
                                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 rounded-md font-semibold text-[10px]">
                                          {item.sellingOption}
                                        </span>
                                      )}
                                      {item.size && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 rounded-md font-semibold text-[10px]">
                                          <Tag size={9} />
                                          <span>{item.size}</span>
                                        </span>
                                      )}
                                      {item.color && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 rounded-md font-semibold text-[10px]">
                                          <Palette size={9} />
                                          <span>{item.color}</span>
                                        </span>
                                      )}
                                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-200/80 dark:border-slate-700 rounded-md font-bold text-[10px]">
                                        x{item.quantity}
                                      </span>
                                    </div>

                                    <p className="text-gray-400 dark:text-gray-500 text-[11px] mt-1 font-medium">
                                      Đơn giá: {formatCurrency(item.price)}
                                    </p>
                                  </div>

                                  {/* Thành tiền */}
                                  <div className="text-right flex-shrink-0 pl-2">
                                    <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white block">
                                      {formatCurrency(item.total || item.price * item.quantity)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* 3. Dòng thông tin giao hàng */}
                          <div className="bg-gray-50/60 dark:bg-slate-900/30 px-3 py-2 rounded-xl border border-gray-100 dark:border-slate-800/60 flex items-start gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 min-w-0">
                            <MapPin size={14} className="text-rose-500 flex-shrink-0 mt-0.5" />
                            <div className="truncate">
                              <span>Giao tới: </span>
                              <strong className="text-gray-800 dark:text-gray-200 font-semibold">{ord.customerInfo?.name}</strong>
                              <span className="text-gray-500 dark:text-gray-400"> ({ord.customerInfo?.phone})</span>
                              <span className="text-gray-400 dark:text-gray-500"> - </span>
                              <span>{ord.customerInfo?.address}</span>
                            </div>
                          </div>

                          {/* 4. Footer: Tổng tiền & Các nút hành động */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-slate-700/70">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                Tổng thanh toán:
                              </span>
                              <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400">
                                {formatCurrency(ord.totalAmount)}
                              </span>
                              {ord.shippingFee !== undefined && ord.shippingFee > 0 && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                                  (Gồm {formatCurrency(ord.shippingFee)} ship)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 justify-end flex-wrap">
                              {ord.status === 'PENDING' && (
                                <button
                                  type="button"
                                  onClick={() => handleCancelOrder(ord._id)}
                                  disabled={cancellingOrderId === ord._id}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200/80 dark:border-rose-900/60 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs active:scale-95"
                                >
                                  <XCircle size={13} />
                                  <span>{cancellingOrderId === ord._id ? 'Đang huỷ...' : 'Huỷ đơn'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={handleRepurchase}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-slate-700/80 hover:bg-gray-200 dark:hover:bg-slate-700 border border-gray-200/80 dark:border-slate-600/70 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                              >
                                <RotateCcw size={13} />
                                <span>Mua lại</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setSelectedOrder(ord)}
                                className="px-4 py-1.5 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 transition-all shadow-xs shadow-blue-500/25 flex items-center gap-1.5 cursor-pointer"
                              >
                                <Eye size={13} />
                                <span>Chi tiết</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal Chi tiết đơn hàng */}
        {selectedOrder && (
          <Modal
            isOpen={!!selectedOrder}
            onClose={() => setSelectedOrder(null)}
            title={`Chi tiết ${selectedOrder.orderCode.startsWith("#") ? selectedOrder.orderCode : `#${selectedOrder.orderCode}`}`}
            size="2xl"
          >
            <div className="space-y-4 sm:space-y-5">
              {/* Header: Badge Trạng thái & Ngày & PTTT */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getOrderStatusColor(selectedOrder.status).bg} ${getOrderStatusColor(selectedOrder.status).text} ${getOrderStatusColor(selectedOrder.status).border}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                    <span>{getOrderStatusText(selectedOrder.status)}</span>
                  </span>
                  <span className="text-gray-300 dark:text-slate-600">•</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(selectedOrder.orderDate || selectedOrder.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 font-semibold bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-gray-200/80 dark:border-slate-700">
                  <CreditCard size={13} />
                  <span>{getPaymentMethodText(selectedOrder.paymentMethod)}</span>
                </div>
              </div>

              {/* Progress Timeline */}
              {selectedOrder.status !== "CANCELLED" && (
                <div className="py-1">
                  <OrderStatusTimeline status={selectedOrder.status} />
                </div>
              )}

              {/* Thông tin giao hàng */}
              <div className="p-3.5 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 text-xs space-y-1.5">
                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                  <MapPin size={14} className="text-rose-500" />
                  Thông tin nhận hàng
                </h4>
                <div className="text-gray-700 dark:text-gray-300 pl-5 space-y-0.5">
                  <p>
                    <strong>Người nhận:</strong> {selectedOrder.customerInfo?.name} (
                    {selectedOrder.customerInfo?.phone})
                  </p>
                  <p>
                    <strong>Địa chỉ:</strong> {selectedOrder.customerInfo?.address}
                  </p>
                  {selectedOrder.customerInfo?.note && (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                      <strong>Ghi chú:</strong> "{selectedOrder.customerInfo.note}"
                    </p>
                  )}
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wider">
                  Sản phẩm ({selectedOrder.items?.length || 0})
                </h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any, idx: number) => {
                    const displayName = cleanProductName(item.name);
                    return (
                      <div
                        key={idx}
                        className="p-3 bg-white dark:bg-slate-800/80 rounded-2xl border border-gray-100 dark:border-slate-700/80 flex items-center gap-3 sm:gap-4 shadow-2xs"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 border border-gray-200/80 dark:border-slate-700 flex-shrink-0">
                          <img
                            src={getImageUrl(item.image)}
                            alt={displayName}
                            onError={handleImageError}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                            {displayName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {(item.productCode || (typeof item.product === 'object' && item.product?.code)) && (
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-[10px] font-mono font-bold border border-slate-200 dark:border-slate-600">
                                Mã SP: {item.productCode || (typeof item.product === 'object' && item.product?.code)}
                              </span>
                            )}
                            {item.sellingOption && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800/60">
                                {item.sellingOption}
                              </span>
                            )}
                            {item.size && (
                              <span className="px-1.5 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 rounded text-[10px] font-semibold border border-sky-200 dark:border-sky-800/60">
                                Size: {item.size}
                              </span>
                            )}
                            {item.color && (
                              <span className="px-1.5 py-0.5 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded text-[10px] font-semibold border border-purple-200 dark:border-purple-800/60">
                                {item.color}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold border border-gray-200 dark:border-slate-600">
                              x{item.quantity}
                            </span>
                          </div>
                          <p className="text-gray-400 dark:text-gray-400 text-[10px] sm:text-[11px] mt-1 font-medium">
                            Đơn giá: {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white block">
                            {formatCurrency(item.total || item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tổng kết tiền */}
              <div className="p-3.5 bg-gray-50/80 dark:bg-slate-900/50 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between text-gray-500 dark:text-gray-400 text-xs">
                  <span>Tiền hàng:</span>
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
                    {!selectedOrder.shippingFee || selectedOrder.shippingFee === 0 ? (
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
                    Tổng thanh toán:
                  </span>
                  <span className="text-rose-600 dark:text-rose-400 text-lg sm:text-xl font-black">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Nút hủy đơn (nếu trạng thái PENDING) */}
              {selectedOrder.status === "PENDING" && (
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="danger"
                    size="sm"
                    loading={cancellingOrderId === selectedOrder._id}
                    icon={<XCircle size={15} />}
                    onClick={() => handleCancelOrder(selectedOrder._id)}
                    className="text-xs font-bold py-2 px-4 shadow-sm"
                  >
                    Huỷ đơn hàng này
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
