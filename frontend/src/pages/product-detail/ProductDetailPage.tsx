import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart,
  Zap,
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  CheckCircle2,
  Minus,
  Plus,
  ArrowLeft,
  Boxes,
} from 'lucide-react';
import { productApi } from '@/entities/product/api/productApi';
import { useCart } from '@/entities/cart/CartContext';
import { Product } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { getImageUrl } from '@/shared/lib/imageHelper';
import { Button } from '@/shared/ui/Button';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';
import { ProductImageGallery } from '@/features/product-gallery';

// Lấy danh sách ảnh thực tế của sản phẩm (không thêm ảnh giả định)
const getDisplayImages = (product: Product): string[] => {
  const images = Array.isArray(product.images)
    ? product.images.filter(Boolean).map((img) => getImageUrl(img))
    : [];
  if (images.length > 0) {
    return images;
  }
  if (product.image) {
    return [getImageUrl(product.image)];
  }
  return [];
};

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedMessage, setAddedMessage] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi
      .getById(id)
      .then((data) => {
        setProduct(data);
        if (data?.sellingOptions && data.sellingOptions.length > 0) {
          setSelectedOption(data.sellingOptions[0].name);
        } else {
          setSelectedOption('');
        }
        if (data?.sizes && data.sizes.length > 0) {
          setSelectedSize(data.sizes[0].name);
        } else {
          setSelectedSize('');
        }
        if (data?.colors && data.colors.length > 0) {
          setSelectedColor(data.colors[0]);
        } else {
          setSelectedColor('');
        }
      })
      .catch((err) => {
        console.error('Fetch product detail error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <LoadingSpinner text="Đang tải chi tiết sản phẩm..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Không tìm thấy sản phẩm!</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-4">Sản phẩm này có thể đã bị xóa hoặc không tồn tại.</p>
        <Link to="/products">
          <Button variant="primary">Quay lại danh sách</Button>
        </Link>
      </div>
    );
  }

  // Tính giá và tồn kho dựa trên Hình thức mua (Selling Option) hoặc Size đang chọn
  const isSetProduct = Boolean(product.sellingOptions && product.sellingOptions.length > 0);
  const activeOptionObj = isSetProduct ? product.sellingOptions?.find((o) => o.name === selectedOption) : null;
  const activeSizeObj = product.sizes?.find((s) => s.name === selectedSize);

  let currentPrice = product.price;
  if (isSetProduct) {
    if (
      selectedOption &&
      activeSizeObj?.optionPrices &&
      activeSizeObj.optionPrices[selectedOption] !== undefined &&
      activeSizeObj.optionPrices[selectedOption] > 0
    ) {
      currentPrice = activeSizeObj.optionPrices[selectedOption];
    } else if (activeOptionObj) {
      currentPrice = activeOptionObj.price;
    }
  } else {
    currentPrice = activeSizeObj && activeSizeObj.price > 0 ? activeSizeObj.price : product.price;
  }

  const currentStock = activeSizeObj?.stock ?? (product.stock !== undefined ? product.stock : 999);
  const categoryName = typeof product.category === 'object' ? product.category?.name : 'Sản phẩm';
  const displayImages = getDisplayImages(product);

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    if (quantity < 99) setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined, selectedOption || undefined);
    setAddedMessage(true);
    setTimeout(() => setAddedMessage(false), 3000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedSize || undefined, selectedColor || undefined, selectedOption || undefined);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-4 sm:py-8 pb-24 sm:pb-8 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Breadcrumb back */}
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          <span>Quay lại danh sách sản phẩm</span>
        </Link>

        {/* Main Product Container */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-10 border border-gray-100 dark:border-slate-700 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 transition-colors">
          {/* Left Column: Image Gallery với hỗ trợ nhiều ảnh & phóng to Lightbox */}
          <div className="lg:col-span-5">
            <ProductImageGallery
              images={displayImages}
              productName={product.name}
            />
          </div>

          {/* Right Column: Information & Purchase Controls */}
          <div className="lg:col-span-7 flex flex-col">
            {/* Category & Code */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[11px] sm:text-xs font-bold rounded-md">
                {categoryName}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 font-mono">
                Mã: <strong>{activeSizeObj?.sku || product.code}</strong>
              </span>
            </div>

            {/* Product Title */}
            <h1 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-snug mb-2">
              {product.name}
            </h1>

            {/* Ratings & Sold count */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm pb-3 border-b border-gray-100 dark:border-slate-700 mb-4 text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1 text-amber-500">
                <Star size={15} fill="currentColor" />
                <span className="font-bold text-gray-800 dark:text-gray-200">{product.rating || 5}.0</span>
              </div>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>
                Đã bán: <strong className="text-gray-800 dark:text-gray-200">{product.soldCount || 0}</strong>
              </span>
              <span className="text-gray-300 dark:text-gray-600">|</span>
              <span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">Còn hàng</span>
              </span>
            </div>

            {/* Price Box */}
            <div className="p-3 sm:p-4 rounded-2xl bg-gray-50 dark:bg-slate-700/40 border border-gray-100 dark:border-slate-700 mb-4">
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                  {formatCurrency(currentPrice)}
                </span>
                {selectedOption && (
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                    Áp dụng cho: {selectedOption} {selectedSize ? `(Size ${selectedSize})` : ''}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                Giá đã bao gồm VAT và chính sách hỗ trợ giao hàng tận nơi.
              </p>
            </div>

            {/* SELLING OPTIONS SELECTOR (CẢ SET / BÁN LẺ TỪNG MÓN) */}
            {product.sellingOptions && product.sellingOptions.length > 0 && (
              <div className="mb-5 p-3.5 bg-teal-50/60 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/40 space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {product.sellingOptions.map((opt) => {
                    const isSelected = opt.name === selectedOption;
                    const optPriceForCurrentSize =
                      activeSizeObj?.optionPrices &&
                      activeSizeObj.optionPrices[opt.name] !== undefined &&
                      activeSizeObj.optionPrices[opt.name] > 0
                        ? activeSizeObj.optionPrices[opt.name]
                        : opt.price;

                    return (
                      <button
                        key={opt.name}
                        type="button"
                        onClick={() => {
                          setSelectedOption(opt.name);
                          setQuantity(1);
                        }}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-start gap-1 text-left cursor-pointer ${
                          isSelected
                            ? 'border-teal-600 bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 ring-2 ring-teal-500/30 shadow-xs'
                            : 'border-teal-200/80 dark:border-teal-900/60 bg-white/70 dark:bg-slate-800/70 text-gray-700 dark:text-gray-300 hover:border-teal-400 dark:hover:border-teal-700'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="line-clamp-1">{opt.name}</span>
                          {isSelected && <CheckCircle2 size={13} className="text-teal-600 dark:text-teal-400 flex-shrink-0" />}
                        </div>
                        <span className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400">
                          {formatCurrency(optPriceForCurrentSize)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SIZE / VARIANT SELECTOR */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                    Kích thước / Phiên bản:{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-extrabold">{selectedSize}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {product.sizes.length} tùy chọn
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => {
                    const isSelected = s.name === selectedSize;
                    const sizeSpecificPrice = isSetProduct
                      ? (selectedOption && s.optionPrices && s.optionPrices[selectedOption] !== undefined && s.optionPrices[selectedOption] > 0
                          ? s.optionPrices[selectedOption]
                          : null)
                      : (s.price > 0 ? s.price : null);

                    return (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setSelectedSize(s.name);
                          setQuantity(1);
                        }}
                        className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span>{s.name}</span>
                        {sizeSpecificPrice !== null && (
                          <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 ml-0.5">
                            ({formatCurrency(sizeSpecificPrice)})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}


            {/* COLOR SELECTOR */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200">
                    Màu sắc:{' '}
                    <span className="text-purple-600 dark:text-purple-400 font-extrabold">{selectedColor}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {product.colors.length} màu
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => {
                    const isSelected = c === selectedColor;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`py-2 px-3 sm:px-4 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-purple-600 bg-purple-50/90 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/20 shadow-xs'
                            : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                        }`}
                      >
                        <span>{c}</span>
                        {isSelected && <CheckCircle2 size={13} className="text-purple-600 dark:text-purple-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="flex items-center gap-3 sm:gap-4 mb-6">
              <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Số lượng:</span>
              <div className="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 shadow-2xs overflow-hidden">
                <button
                  onClick={handleDecrease}
                  disabled={quantity <= 1}
                  className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors"
                >
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrease}
                  disabled={quantity >= 99}
                  className="p-2 sm:p-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 disabled:opacity-30 transition-colors"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Success toast message */}
            {addedMessage && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs sm:text-sm font-semibold mb-4 animate-fade-in border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={16} />
                <span>Đã thêm sản phẩm vào giỏ hàng thành công!</span>
              </div>
            )}

            {/* Desktop Action Buttons */}
            <div className="hidden sm:grid grid-cols-2 gap-4 mb-6">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToCart}
                icon={<ShoppingCart size={18} />}
                className="w-full border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold"
              >
                Thêm vào giỏ
              </Button>

              <Button
                variant="primary"
                size="lg"
                onClick={handleBuyNow}
                icon={<Zap size={18} />}
                className="w-full font-bold shadow-lg shadow-blue-600/25"
              >
                Mua ngay
              </Button>
            </div>

            {/* Commitments list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-4 sm:pt-6 border-t border-gray-100 dark:border-slate-700 text-[11px] sm:text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Truck size={15} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>Giao hàng toàn quốc</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>Bảo hành 12T chính hãng</span>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw size={15} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Đổi trả 30 ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description Section */}
        <div className="mt-6 sm:mt-10 bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-10 border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-6 transition-colors">
          <h3 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-slate-700">
            MÔ TẢ SẢN PHẨM
          </h3>
          <div className="prose max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-xs sm:text-base space-y-3">
            <p>{product.description || 'Chưa có thông tin mô tả chi tiết cho sản phẩm này.'}</p>
          </div>

          {/* Specifications Table */}
          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mb-3">THÔNG SỐ KỸ THUẬT</h4>
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700">
                <table className="w-full text-xs sm:text-sm text-left">
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val], idx) => (
                      <tr key={key} className={idx % 2 === 0 ? 'bg-gray-50/70 dark:bg-slate-700/40' : 'bg-white dark:bg-slate-800'}>
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 font-semibold text-gray-700 dark:text-gray-300 w-1/3 border-b border-gray-100 dark:border-slate-700">
                          {key}
                        </td>
                        <td className="py-2.5 px-3 sm:py-3 sm:px-4 text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700">
                          {val}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE FIXED BOTTOM ACTION BAR (Sticky Bar) - Tối ưu mua hàng một tay trên điện thoại */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-gray-200 dark:border-slate-800 px-3 py-2.5 shadow-2xl flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <span className="text-[10px] text-gray-400 dark:text-gray-500 block -mb-0.5">Tổng tiền:</span>
          <span className="text-base font-black text-rose-600 dark:text-rose-400 truncate block">
            {formatCurrency(currentPrice * quantity)}
          </span>
        </div>

        <button
          onClick={handleAddToCart}
          className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 active:scale-95 transition-all flex items-center justify-center"
          title="Thêm vào giỏ"
        >
          <ShoppingCart size={18} />
        </button>

        <button
          onClick={handleBuyNow}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
        >
          <Zap size={15} />
          <span>Mua ngay ({quantity})</span>
        </button>
      </div>
    </div>
  );
};
