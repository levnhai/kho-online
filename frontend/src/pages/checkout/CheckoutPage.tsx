import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  ArrowRight,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  ShoppingBag,
  MapPin,
  Clock,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { useCart, getCartItemPrice } from '@/entities/cart/CartContext';
import { orderApi } from '@/entities/order/api/orderApi';
import { userApi } from '@/entities/user/api/userApi';
import { formatCurrency } from '@/shared/lib/formatters';
import { getImageUrl, handleImageError } from '@/shared/lib/imageHelper';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { PaymentMethod } from '@/shared/types';

interface SavedAddressItem {
  address: string;
  name?: string;
  phone?: string;
  updatedAt?: string;
}

const STORAGE_LAST_SHIPPING = 'kho_online_last_shipping';
const STORAGE_SAVED_ADDRESSES = 'kho_online_address_history';

export const CheckoutPage: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { items, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  const [saveInfo, setSaveInfo] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState<{ orderCode: string; orderCodes?: string[] } | null>(null);

  // Load thông tin và lịch sử địa chỉ
  useEffect(() => {
    let localHistory: SavedAddressItem[] = [];
    try {
      const rawHistory = localStorage.getItem(STORAGE_SAVED_ADDRESSES);
      if (rawHistory) {
        localHistory = JSON.parse(rawHistory);
      }
    } catch {
      localHistory = [];
    }

    let lastShipping: any = null;
    try {
      const rawLast = localStorage.getItem(STORAGE_LAST_SHIPPING);
      if (rawLast) {
        lastShipping = JSON.parse(rawLast);
      }
    } catch {
      lastShipping = null;
    }

    // Ưu tiên nạp từ thông tin user -> sau đó nạp từ last shipping
    const initialName = user?.name || lastShipping?.name || '';
    const initialPhone = user?.phone || lastShipping?.phone || '';
    const initialAddress = user?.address || lastShipping?.address || '';

    if (initialName) setName(initialName);
    if (initialPhone) setPhone(initialPhone);
    if (initialAddress) setAddress(initialAddress);

    // Nếu user đã có địa chỉ trong profile mà chưa có trong history, thêm vào đầu
    if (user?.address && !localHistory.some((item) => item.address.trim().toLowerCase() === user.address?.trim().toLowerCase())) {
      localHistory.unshift({
        address: user.address,
        name: user.name || '',
        phone: user.phone || '',
        updatedAt: new Date().toISOString(),
      });
    }

    setSavedAddresses(localHistory);
  }, [user]);

  // Xóa 1 địa chỉ khỏi lịch sử
  const handleRemoveSavedAddress = (addrToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedAddresses.filter((item) => item.address !== addrToRemove);
    setSavedAddresses(updated);
    localStorage.setItem(STORAGE_SAVED_ADDRESSES, JSON.stringify(updated));
  };

  // Áp dụng địa chỉ từ lịch sử
  const handleSelectAddress = (item: SavedAddressItem) => {
    setAddress(item.address);
    if (item.name && !name) setName(item.name);
    if (item.phone && !phone) setPhone(item.phone);
  };

  // Nếu auth đang khởi tạo: Hiển thị spinner thay vì báo chưa đăng nhập
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center py-16 px-4 transition-colors">
        <LoadingSpinner text="Đang tải thông tin đặt hàng..." />
      </div>
    );
  }

  // Nếu chưa đăng nhập: Yêu cầu đăng nhập theo đúng đề bài
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center py-16 px-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Bạn cần đăng nhập để tiếp tục đặt hàng.
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vui lòng đăng nhập vào tài khoản của bạn hoặc đăng ký tài khoản mới để CHANG phục vụ bạn tốt nhất.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/login"
              state={{ from: { pathname: '/checkout' }, notice: 'Bạn cần đăng nhập để tiếp tục đặt hàng.' }}
            >
              <Button variant="primary" size="lg" className="w-full font-bold">
                Đăng nhập
              </Button>
            </Link>
            <Link
              to="/register"
              state={{ from: { pathname: '/checkout' } }}
            >
              <Button variant="outline" size="lg" className="w-full font-semibold">
                Đăng ký tài khoản
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Nếu giỏ hàng trống và chưa đặt thành công
  if (items.length === 0 && !orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center py-16 px-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <ShoppingBag size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Giỏ hàng của bạn đang trống</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Vui lòng chọn thêm sản phẩm trước khi chuyển tới bước thanh toán.
          </p>
          <Link to="/products">
            <Button variant="primary" size="lg" className="w-full">
              Khám phá sản phẩm
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Màn hình hiển thị khi ĐẶT HÀNG THÀNH CÔNG
  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-16 px-4 flex items-center justify-center transition-colors">
        <div className="max-w-lg w-full bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-gray-100 dark:border-slate-700 shadow-xl text-center space-y-6 animate-scale-up">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 size={48} />
          </div>

          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              🎉 Đặt hàng thành công!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Cảm ơn bạn đã mua hàng tại hệ thống CHANG. Đơn hàng của bạn đã được ghi nhận và đang chờ xác nhận.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Link to="/account?tab=orders">
              <Button variant="primary" size="md" className="w-full font-bold">
                Theo dõi đơn hàng
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="secondary" size="md" className="w-full font-semibold">
                Tiếp tục mua hàng
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const shippingFee = 0;
  const grandTotal = totalAmount;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setError('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderData = {
        customerInfo: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          note: note.trim(),
        },
        items: items.map((item) => ({
          product: item.product._id,
          name: item.product.name,
          sellingOption: item.selectedOption || '',
          size: item.selectedSize || '',
          color: item.selectedColor || '',
          quantity: item.quantity,
          price: getCartItemPrice(item),
          image: item.product.images?.[0] || '',
        })),
        paymentMethod,
      };

      const res = await orderApi.create(orderData);

      // Lưu thông tin giao hàng & lịch sử địa chỉ cho lần sau
      if (saveInfo) {
        try {
          const currentShipping = {
            name: name.trim(),
            phone: phone.trim(),
            address: address.trim(),
          };
          localStorage.setItem(STORAGE_LAST_SHIPPING, JSON.stringify(currentShipping));

          const rawHistory = localStorage.getItem(STORAGE_SAVED_ADDRESSES);
          let prevList: SavedAddressItem[] = rawHistory ? JSON.parse(rawHistory) : [];
          
          // Lọc bỏ địa chỉ trùng lặp và đưa địa chỉ hiện tại lên đầu
          prevList = prevList.filter(
            (item) => item.address.trim().toLowerCase() !== address.trim().toLowerCase()
          );
          prevList.unshift({
            address: address.trim(),
            name: name.trim(),
            phone: phone.trim(),
            updatedAt: new Date().toISOString(),
          });

          // Tối đa 5 địa chỉ gần nhất
          const finalHistory = prevList.slice(0, 5);
          localStorage.setItem(STORAGE_SAVED_ADDRESSES, JSON.stringify(finalHistory));
          setSavedAddresses(finalHistory);

          // Cập nhật thông tin profile của User nếu đang đăng nhập
          if (user) {
            userApi.updateProfile({
              name: name.trim(),
              phone: phone.trim(),
              address: address.trim(),
            }).catch(() => {});
          }
        } catch (storageErr) {
          console.warn('Không thể lưu thông tin vào localStorage:', storageErr);
        }
      }

      clearCart();
      setOrderSuccess({
        orderCode: res.orderCode,
        orderCodes: res.orderCodes || (res.orderCode ? [res.orderCode] : []),
      });
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi tạo đơn hàng, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-8">
          TIẾN HÀNH ĐẶT HÀNG
        </h1>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Customer Information & Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* THÔNG TIN ĐẶT HÀNG */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm space-y-5 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  THÔNG TIN ĐẶT HÀNG
                </h3>
                {savedAddresses.length > 0 && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                    <Sparkles size={13} />
                    Đã lưu {savedAddresses.length} địa chỉ
                  </span>
                )}
              </div>

              {error && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ và tên người nhận *"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Input
                  label="Số điện thoại liên hệ *"
                  placeholder="09xxxxxxxx"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Input
                  label="Địa chỉ giao hàng chi tiết *"
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                />

                {/* Danh sách lịch sử địa chỉ đã dùng gần đây */}
                {savedAddresses.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <Clock size={13} className="text-blue-500" />
                      <span>Địa chỉ đã dùng gần đây (bấm để chọn nhanh):</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {savedAddresses.map((item, idx) => {
                        const isCurrent = address.trim().toLowerCase() === item.address.trim().toLowerCase();
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectAddress(item)}
                            role="button"
                            title="Bấm để tự động điền địa chỉ này"
                            className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-400 dark:border-blue-600 shadow-sm ring-1 ring-blue-400/30'
                                : 'bg-gray-50 dark:bg-slate-700/60 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <MapPin size={13} className={isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'} />
                            <span className="max-w-[200px] sm:max-w-[280px] truncate">{item.address}</span>
                            <button
                              type="button"
                              onClick={(e) => handleRemoveSavedAddress(item.address, e)}
                              title="Xóa khỏi lịch sử"
                              className="ml-1 p-0.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Checkbox lưu thông tin */}
                <label className="flex items-center gap-2 cursor-pointer pt-2 select-none">
                  <input
                    type="checkbox"
                    checked={saveInfo}
                    onChange={(e) => setSaveInfo(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700"
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                    <Sparkles size={13} className="text-amber-500" />
                    Tự động lưu thông tin giao hàng cho các lần mua sau
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ghi chú cho đơn vị vận chuyển (tùy chọn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Giao vào giờ hành chính, gọi trước khi giao 15 phút..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* PHƯƠNG THỨC THANH TOÁN */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 transition-colors">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
                PHƯƠNG THỨC THANH TOÁN
              </h3>

              <div className="space-y-3">
                {/* COD */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-500'
                      : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value="COD"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-sm">
                      <Banknote size={18} className="text-emerald-600 dark:text-emerald-400" />
                      <span>Thanh toán khi nhận hàng (COD)</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Khách hàng kiểm tra hàng và thanh toán tiền mặt trực tiếp cho nhân viên giao hàng.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Action */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-slate-700 shadow-sm space-y-6 transition-colors">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              SẢN PHẨM ĐẶT MUA
            </h3>

            {/* Items list */}
            <div className="divide-y divide-gray-100 dark:divide-slate-700 max-h-80 overflow-y-auto pr-2 space-y-2">
              {items.map((item) => {
                const price = getCartItemPrice(item);
                const itemKey = `${item.product._id}-${item.selectedSize || 'default'}-${item.selectedColor || 'default'}`;
                return (
                  <div key={itemKey} className="pt-2 flex items-center gap-3">
                    <img
                      src={getImageUrl(item.product.images?.[0])}
                      alt={item.product.name}
                      onError={handleImageError}
                      className="w-12 h-12 rounded-lg object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.product.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-0.5">
                        {item.selectedOption && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200 dark:border-teal-800">
                            {item.selectedOption}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                            Màu: {item.selectedColor}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        x{item.quantity} · {formatCurrency(price)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
                      {formatCurrency(price * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {shippingFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Miễn phí</span>
                  ) : (
                    formatCurrency(shippingFee)
                  )}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="font-extrabold text-gray-900 dark:text-white text-base">Tổng cộng:</span>
                <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              className="w-full font-bold shadow-xl shadow-blue-600/25 py-3.5 text-base"
              icon={<ArrowRight size={18} />}
            >
              ĐẶT HÀNG NGAY
            </Button>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span>Giao dịch an toàn & bảo mật tuyệt đối</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
