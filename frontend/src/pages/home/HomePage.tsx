import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Flame, Clock } from 'lucide-react';
import { HeroBanner } from '@/widgets/hero-banner/HeroBanner';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { productApi } from '@/entities/product/api/productApi';
import { useCart } from '@/entities/cart/CartContext';
import { Product } from '@/shared/types';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const HomePage: React.FC = () => {
  const { addToCart } = useCart();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sellers, news] = await Promise.all([
          productApi.getBestSellers(4),
          productApi.getNewArrivals(4),
        ]);
        setBestSellers(sellers);
        setNewArrivals(news);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Khuyến Mãi */}
        <HeroBanner />

        {loading ? (
          <LoadingSpinner text="Đang tải dữ liệu sản phẩm..." />
        ) : (
          <div className="space-y-6 sm:space-y-12 mt-6 sm:mt-8">
            {/* 1. SẢN PHẨM MỚI */}
            <section className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                    <Clock size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      SẢN PHẨM MỚI VỀ
                    </h2>
                    <p className="hidden sm:block text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Cập nhật các mẫu trang phục sơ sinh và thời trang bé mới nhất
                    </p>
                  </div>
                </div>

                <Link
                  to="/products?sort=newest"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {newArrivals.map((p) => (
                  <ProductCard key={p._id} product={p} onAddToCart={addToCart} />
                ))}
              </div>
            </section>

            {/* 2. SẢN PHẨM BÁN CHẠY */}
            <section className="bg-white dark:bg-slate-800 p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="p-1.5 sm:p-2 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                    <Flame size={20} className="sm:w-[22px] sm:h-[22px]" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                      SẢN PHẨM BÁN CHẠY
                    </h2>
                    <p className="hidden sm:block text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Những mẫu quần áo Mẹ & Bé được yêu thích và đặt mua nhiều nhất
                    </p>
                  </div>
                </div>

                <Link
                  to="/products?sort=top-sales"
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline"
                >
                  <span>Xem tất cả</span>
                  <ArrowRight size={14} className="sm:w-4 sm:h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {bestSellers.map((p) => (
                  <ProductCard key={p._id} product={p} onAddToCart={addToCart} />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
