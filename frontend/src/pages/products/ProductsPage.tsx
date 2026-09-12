import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PackageSearch, Filter, X } from 'lucide-react';
import { FilterSidebar } from '@/widgets/filter-sidebar/FilterSidebar';
import { ProductCard } from '@/entities/product/ui/ProductCard';
import { productApi } from '@/entities/product/api/productApi';
import { categoryApi } from '@/entities/category/api/categoryApi';
import { useCart } from '@/entities/cart/CartContext';
import { Product, Category } from '@/shared/types';
import { LoadingSpinner } from '@/shared/ui/LoadingSpinner';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter States synced with URL
  const selectedCategory = searchParams.get('category') || '';
  const searchKeyword = searchParams.get('search') || '';
  const priceRange = searchParams.get('priceRange') || '';
  const sortOption = searchParams.get('sort') || 'newest';
  const currentPage = Number(searchParams.get('page') || '1');

  useEffect(() => {
    categoryApi.getAll().then(setCategories).catch(console.error);
  }, []);

  // Khóa cuộn trang khi mở drawer bộ lọc trên mobile
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileFilterOpen]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      let minPrice: number | undefined;
      let maxPrice: number | undefined;

      if (priceRange === 'under-500k') {
        maxPrice = 500000;
      } else if (priceRange === '500k-1m') {
        minPrice = 500000;
        maxPrice = 1000000;
      } else if (priceRange === '1m-5m') {
        minPrice = 1000000;
        maxPrice = 5000000;
      } else if (priceRange === 'above-5m') {
        minPrice = 5000000;
      }

      const res = await productApi.getAll({
        category: selectedCategory || undefined,
        search: searchKeyword || undefined,
        minPrice,
        maxPrice,
        sort: sortOption,
        page: currentPage,
        limit: 12,
      });

      setProducts(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Fetch products error:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchKeyword, priceRange, sortOption, currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateParam = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSearchParams({});
    setMobileFilterOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 py-4 sm:py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* Page Title & Mobile Filter Toggle Button */}
        <div className="mb-4 sm:mb-8 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight uppercase">
              TẤT CẢ SẢN PHẨM
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {searchKeyword
                ? `Kết quả cho: "${searchKeyword}" (${total} SP)`
                : `Tìm thấy ${total} sản phẩm`}
            </p>
          </div>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200/80 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 shadow-xs hover:border-blue-500 active:scale-95 transition-all cursor-pointer"
          >
            <Filter size={16} className="text-blue-600 dark:text-blue-400" />
            <span>Bộ lọc tìm kiếm</span>
            {(selectedCategory || priceRange || sortOption !== 'newest' || searchKeyword) && (
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 dark:bg-blue-400 ring-2 ring-white dark:ring-slate-800 animate-pulse" />
            )}
          </button>
        </div>

        {/* 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-8 items-start">
          {/* Desktop Left Column: Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-1 sticky top-24">
            <FilterSidebar
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => updateParam('category', catId)}
              searchKeyword={searchKeyword}
              onSelectSubcategory={(kw) => updateParam('search', kw)}
              priceRange={priceRange}
              onSelectPriceRange={(range) => updateParam('priceRange', range)}
              sort={sortOption}
              onSelectSort={(sort) => updateParam('sort', sort)}
              onReset={handleResetFilters}
            />
          </div>

          {/* Right Column: Product Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <LoadingSpinner text="Đang tải danh sách sản phẩm..." />
            ) : products.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-12 text-center border border-gray-100 dark:border-slate-700 shadow-xs transition-colors">
                <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
                  <PackageSearch size={28} />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-1">
                  Không tìm thấy sản phẩm phù hợp.
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-5">
                  Hãy thử điều chỉnh lại bộ lọc giá, chọn thể loại khác hoặc từ khóa tìm kiếm.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={addToCart}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter Drawer Modal */}
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
              onClick={() => setMobileFilterOpen(false)}
            />

            {/* Sliding Drawer */}
            <div className="relative ml-auto w-[88vw] max-w-sm sm:max-w-md bg-white dark:bg-slate-800 h-full shadow-2xl flex flex-col z-10 animate-fade-in transition-colors">
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white text-base">
                  <Filter size={18} className="text-blue-600 dark:text-blue-400" />
                  <span>BỘ LỌC TÌM KIẾM</span>
                </div>
                <button
                  onClick={() => setMobileFilterOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl cursor-pointer transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                <FilterSidebar
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={(catId) => {
                    updateParam('category', catId);
                  }}
                  searchKeyword={searchKeyword}
                  onSelectSubcategory={(kw) => {
                    updateParam('search', kw);
                  }}
                  priceRange={priceRange}
                  onSelectPriceRange={(range) => {
                    updateParam('priceRange', range);
                  }}
                  sort={sortOption}
                  onSelectSort={(sort) => {
                    updateParam('sort', sort);
                  }}
                  onReset={handleResetFilters}
                />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-3.5 py-3 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold text-xs sm:text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 cursor-pointer transition-all"
                >
                  Đặt lại
                </button>
                <button
                  type="button"
                  onClick={() => setMobileFilterOpen(false)}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-blue-600/25 cursor-pointer active:scale-98 transition-all"
                >
                  Xem kết quả ({total} SP)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
