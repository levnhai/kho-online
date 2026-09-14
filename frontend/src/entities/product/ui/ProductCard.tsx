import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Eye, Star } from 'lucide-react';
import { Product } from '@/shared/types';
import { formatCurrency } from '@/shared/lib/formatters';
import { getImageUrl, handleImageError } from '@/shared/lib/imageHelper';
import { Button } from '@/shared/ui/Button';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const categoryName = typeof product.category === 'object' ? product.category?.name : 'Sản phẩm';

  return (
    <div className="group relative bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700/80 shadow-xs hover:shadow-xl hover:border-blue-100 dark:hover:border-slate-600 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        className="block relative aspect-square bg-gray-50 dark:bg-slate-800 overflow-hidden"
      >
        <img
          src={getImageUrl(product.images?.[0])}
          alt={product.name}
          onError={handleImageError}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      </Link>

      {/* Content */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        {/* Category & Rating */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs text-gray-500 dark:text-slate-400 mb-1">
          <span className="font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded line-clamp-1 max-w-[90px] sm:max-w-none">
            {categoryName}
          </span>
          <div className="flex items-center gap-0.5 text-amber-500 flex-shrink-0">
            <Star size={11} fill="currentColor" />
            <span className="font-bold text-gray-700 dark:text-gray-300">{product.rating || 5}</span>
          </div>
        </div>

        {/* Product Name */}
        <Link
          to={`/products/${product._id}`}
          className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-1.5 min-h-[34px] sm:min-h-[40px]"
          title={product.name}
        >
          {product.name}
        </Link>

        {/* Colors badge if available */}
        {product.colors && product.colors.length > 0 && (
          <div className="mb-2">
            <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded border border-purple-100 dark:border-purple-900/40">
              {product.colors.length} màu
            </span>
          </div>
        )}

        {/* Price Area */}
        <div className="mt-auto mb-3">
          <span className="text-sm sm:text-lg font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(product.price)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/80">
          <Link to={`/products/${product._id}`} className="w-full">
            <Button
              variant="secondary"
              size="sm"
              className="w-full text-[11px] sm:text-xs font-semibold py-1.5 px-1 sm:px-2 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-650 whitespace-nowrap"
              icon={<Eye size={13} />}
            >
              <span className="hidden sm:inline">Chi tiết</span>
              <span className="sm:hidden">Xem</span>
            </Button>
          </Link>
          <Button
            variant="primary"
            size="sm"
            className="w-full text-[11px] sm:text-xs font-semibold py-1.5 px-1 sm:px-2 whitespace-nowrap"
            onClick={() => onAddToCart && onAddToCart(product)}
            icon={<ShoppingCart size={13} />}
          >
            <span className="hidden sm:inline">Thêm giỏ</span>
            <span className="sm:hidden">Giỏ</span>
          </Button>
        </div>
      </div>
    </div>
  );
};
