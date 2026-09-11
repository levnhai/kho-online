import React from 'react';
import { Filter, RotateCcw, ChevronRight } from 'lucide-react';
import { Category } from '@/shared/types';
import { getSubcategories } from '@/entities/category/lib/subcategories';

interface FilterSidebarProps {
  categories: Category[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  searchKeyword?: string;
  onSelectSubcategory?: (keyword: string) => void;
  priceRange: string;
  onSelectPriceRange: (range: string) => void;
  sort: string;
  onSelectSort: (sort: string) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  searchKeyword = '',
  onSelectSubcategory,
  priceRange,
  onSelectPriceRange,
  sort,
  onSelectSort,
  onReset,
}) => {
  const priceRanges = [
    { label: 'Tất cả mức giá', value: '' },
    { label: 'Dưới 500.000đ', value: 'under-500k' },
    { label: '500.000đ - 1.000.000đ', value: '500k-1m' },
    { label: '1.000.000đ - 5.000.000đ', value: '1m-5m' },
    { label: 'Trên 5.000.000đ', value: 'above-5m' },
  ];

  const sortOptions = [
    { label: 'Mới nhất', value: 'newest' },
    { label: 'Giá thấp → cao', value: 'price-asc' },
    { label: 'Giá cao → thấp', value: 'price-desc' },
    { label: 'Bán chạy nhất', value: 'top-sales' },
    { label: 'Tên A → Z', value: 'name-asc' },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-5 text-gray-900 dark:text-white transition-colors">
      {/* Title & Reset */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-sm sm:text-base">
          <Filter size={17} className="text-blue-600 dark:text-blue-400" />
          <span>BỘ LỌC TÌM KIẾM</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw size={12} />
          Đặt lại
        </button>
      </div>

      {/* Categories Filter */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-2">
          THỂ LOẠI
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => {
              onSelectCategory('');
              onSelectSubcategory && onSelectSubcategory('');
            }}
            className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
              selectedCategory === ''
                ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60'
            }`}
          >
            <span>Tất cả thể loại</span>
          </button>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat._id;
            const subs = getSubcategories(cat);

            return (
              <div key={cat._id} className="space-y-1">
                <button
                  onClick={() => onSelectCategory(cat._id)}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat.productCount !== undefined && (
                    <span className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">
                      ({cat.productCount})
                    </span>
                  )}
                </button>

                {/* Thể loại con khi thể loại cha đang được chọn */}
                {isSelected && subs.length > 0 && (
                  <div className="ml-3 pl-2.5 my-1 border-l-2 border-blue-500/30 space-y-0.5 animate-fade-in">
                    {subs.map((sub) => {
                      const isSubActive = searchKeyword === (sub.keyword || sub.name);
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => {
                            if (onSelectSubcategory) {
                              onSelectSubcategory(isSubActive ? '' : (sub.keyword || sub.name));
                            }
                          }}
                          className={`w-full text-left py-1 px-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between ${
                            isSubActive
                              ? 'bg-blue-600 text-white font-bold'
                              : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 hover:text-blue-600 dark:hover:text-blue-400'
                          }`}
                        >
                          <span>{sub.name}</span>
                          {isSubActive && <span className="text-[10px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Range Filter */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-2">
          KHOẢNG GIÁ
        </h4>
        <div className="space-y-1.5">
          {priceRanges.map((range) => (
            <label
              key={range.value}
              className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
            >
              <input
                type="radio"
                name="priceRange"
                value={range.value}
                checked={priceRange === range.value}
                onChange={() => onSelectPriceRange(range.value)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700"
              />
              <span>{range.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400 mb-2">
          SẮP XẾP THEO
        </h4>
        <div className="space-y-1.5">
          {sortOptions.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none hover:text-blue-600 dark:hover:text-blue-400"
            >
              <input
                type="radio"
                name="sortOption"
                value={opt.value}
                checked={sort === opt.value}
                onChange={() => onSelectSort(opt.value)}
                className="w-3.5 h-3.5 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
