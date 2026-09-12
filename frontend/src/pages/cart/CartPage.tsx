import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useCart, getCartItemPrice, getCartItemMaxStock } from '@/entities/cart/CartContext';
import { formatCurrency } from '@/shared/lib/formatters';
import { Button } from '@/shared/ui/Button';

export const CartPage: React.FC = () => {
  const { items, updateQuantity, removeFromCart, totalAmount, clearCart } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-12 px-4 transition-colors">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag size={32} />
            </div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Giỏ hàng của bạn đang trống</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6 text-xs">
              Bạn chưa thêm sản phẩm nào vào giỏ hàng. Hãy khám phá ngay hàng ngàn sản phẩm công nghệ tuyệt vời tại KHO!
            </p>
            <Link to="/products">
              <Button variant="primary" size="md" icon={<ArrowRight size={16} />}>
                Khám phá sản phẩm ngay
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-6 sm:py-10 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
              GIỎ HÀNG
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-0.5">
              Bạn đang có <strong>{items.length}</strong> mặt hàng trong giỏ
            </p>
          </div>

          <button
            onClick={clearCart}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
          >
            <Trash2 size={13} />
            <span>Xóa tất cả</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Cart Items (Card view on Mobile, Table view on Desktop) */}
          <div className="lg:col-span-8 space-y-3">
            {/* MOBILE CARD VIEW */}
            <div className="block md:hidden space-y-3">
              {items.map((item) => {
                const price = getCartItemPrice(item);
                const itemTotal = price * item.quantity;
                const maxStock = getCartItemMaxStock(item);
                const itemKey = `${item.product._id}-${item.selectedSize || 'default'}`;

                return (
                  <div
                    key={itemKey}
                    className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-xs flex gap-3 relative"
                  >
                    <img
                      src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&q=80'}
                      alt={item.product.name}
                      className="w-20 h-20 rounded-xl object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 pr-6">
                          <Link
                            to={`/products/${item.product._id}`}
                            className="font-bold text-gray-900 dark:text-white text-xs line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            {item.product.name}
                          </Link>
                        </div>
                        {item.selectedSize && (
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            Phiên bản: {item.selectedSize}
                          </span>
                        )}
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1">
                          {formatCurrency(price)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-900 overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.selectedSize)}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900 dark:text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.selectedSize)}
                            disabled={item.quantity >= maxStock}
                            className="p-1.5 text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                          {formatCurrency(itemTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => removeFromCart(item.product._id, item.selectedSize)}
                      className="absolute top-2.5 right-2.5 p-1 text-gray-400 dark:text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP TABLE VIEW */}
            <div className="hidden md:block bg-white dark:bg-slate-800 rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden transition-colors">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-900/60 border-b border-gray-100 dark:border-slate-700 text-xs font-bold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <th className="py-4 px-6">Sản phẩm</th>
                    <th className="py-4 px-4">Đơn giá</th>
                    <th className="py-4 px-4 text-center">Số lượng</th>
                    <th className="py-4 px-4 text-right">Thành tiền</th>
                    <th className="py-4 px-4 text-center">Xóa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {items.map((item) => {
                    const price = getCartItemPrice(item);
                    const itemTotal = price * item.quantity;
                    const maxStock = getCartItemMaxStock(item);
                    const itemKey = `${item.product._id}-${item.selectedSize || 'default'}`;

                    return (
                      <tr key={itemKey} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80'}
                              alt={item.product.name}
                              className="w-16 h-16 rounded-xl object-cover border border-gray-100 dark:border-slate-700 flex-shrink-0"
                            />
                            <div>
                              <Link
                                to={`/products/${item.product._id}`}
                                className="font-bold text-gray-900 dark:text-white text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2"
                              >
                                {item.product.name}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-400 dark:text-gray-400 font-mono">
                                  Mã: {item.product.code}
                                </span>
                                {item.selectedSize && (
                                  <span className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[11px] font-bold">
                                    Size: {item.selectedSize}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(price)}
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center">
                            <div className="flex items-center border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50/80 dark:bg-slate-700/60 overflow-hidden shadow-2xs">
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.selectedSize)}
                                className="p-1.5 text-gray-500 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 transition-colors"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-9 text-center text-xs font-bold text-gray-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.selectedSize)}
                                disabled={item.quantity >= maxStock}
                                className="p-1.5 text-gray-500 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-600 disabled:opacity-30 transition-colors"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 text-sm font-bold text-rose-600 dark:text-rose-400 text-right whitespace-nowrap">
                          {formatCurrency(itemTotal)}
                        </td>

                        <td className="py-4 px-4 text-center">
                          <button
                            onClick={() => removeFromCart(item.product._id, item.selectedSize)}
                            className="p-2 text-gray-400 hover:text-rose-600 dark:text-gray-400 dark:hover:text-rose-400 rounded-lg transition-colors"
                            title="Xóa sản phẩm"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2">
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowLeft size={14} />
                <span>Tiếp tục mua hàng</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Order Summary & Checkout Button */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-gray-100 dark:border-slate-700 shadow-sm space-y-5 text-gray-900 dark:text-white">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
              TÓM TẮT ĐƠN HÀNG
            </h3>

            <div className="space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-slate-300">
                <span>Phí vận chuyển:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {totalAmount >= 5000000 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">Miễn phí</span>
                  ) : (
                    formatCurrency(30000)
                  )}
                </span>
              </div>
              <div className="border-t border-gray-100 dark:border-slate-700 pt-3 flex justify-between items-baseline">
                <span className="font-bold text-gray-900 dark:text-white">Tổng cộng:</span>
                <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(totalAmount + (totalAmount >= 5000000 ? 0 : 30000))}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/checkout')}
              className="w-full font-bold shadow-lg shadow-blue-600/25 py-3 text-sm sm:text-base"
              icon={<ArrowRight size={18} />}
            >
              TIẾN HÀNH ĐẶT HÀNG
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
