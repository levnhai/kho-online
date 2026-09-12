import React, { useState } from 'react';
import { Filter, RotateCcw, ChevronDown, Tag, DollarSign, ArrowUpDown } from 'lucide-react';
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
  // State quản lý đóng / mở từng phần bộ lọc
  const [categoriesOpen, setCategoriesOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [sortOpen, setSortOpen] = useState(true);

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
    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4 sm:space-y-5 text-gray-900 dark:text-white transition-colors">
      {/* Header & Đặt lại */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-2 font-black text-gray-900 dark:text-white text-sm sm:text-base">
          <Filter size={18} className="text-blue-600 dark:text-blue-400" />
          <span>BỘ LỌC TÌM KIẾM</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5 font-bold cursor-pointer py-1 px-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-700/60 transition-colors"
          title="Đặt lại bộ lọc"
        >
          <RotateCcw size={13} />
          Đặt lại
        </button>
      </div>

      {/* 1. THỂ LOẠI (Có thể đóng / mở) */}
      <div className="border-b border-gray-100 dark:border-slate-700 pb-3">
        <button
          type="button"
          onClick={() => setCategoriesOpen(!categoriesOpen)}
          className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Tag size={15} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              THỂ LOẠI
            </span>
            {selectedCategory && (
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 dark:text-slate-400 transition-transform duration-200 ${
              categoriesOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </button>

        {categoriesOpen && (
          <div className="mt-2 space-y-1.5 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                onSelectCategory('');
                onSelectSubcategory && onSelectSubcategory('');
              }}
              className={`w-full text-left px-3.5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                selectedCategory === ''
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/60'
              }`}
            >
              <span>Tất cả thể loại</span>
              {selectedCategory === '' && <span className="text-xs">✓</span>}
            </button>

            {categories.map((cat) => {
              const isSelected = selectedCategory === cat._id;
              const subs = getSubcategories(cat);

              return (
                <div key={cat._id} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => onSelectCategory(cat._id)}
                    className={`w-full text-left px-3.5 py-2.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <span>{cat.name}</span>
                    {isSelected ? (
                      <span className="text-xs">✓</span>
                    ) : (
                      cat.productCount !== undefined && (
                        <span className="text-[11px] text-gray-400 dark:text-slate-400 font-normal">
                          ({cat.productCount})
                        </span>
                      )
                    )}
                  </button>

                  {/* Thể loại con khi thể loại cha đang được chọn */}
                  {isSelected && subs.length > 0 && (
                    <div className="ml-3 pl-3 my-1.5 border-l-2 border-blue-500/40 space-y-1 animate-fade-in">
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
                            className={`w-full text-left py-2 px-3 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              isSubActive
                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold'
                                : 'text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50'
                            }`}
                          >
                            <span>{sub.name}</span>
                            {isSubActive && <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. KHOẢNG GIÁ (Có thể đóng / mở) */}
      <div className="border-b border-gray-100 dark:border-slate-700 pb-3">
        <button
          type="button"
          onClick={() => setPriceOpen(!priceOpen)}
          className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <DollarSign size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              KHOẢNG GIÁ
            </span>
            {priceRange && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 dark:text-slate-400 transition-transform duration-200 ${
              priceOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
            }`}
          />
        </button>

        {priceOpen && (
          <div className="mt-2 space-y-2 animate-fade-in">
            {priceRanges.map((range) => {
              const isChecked = priceRange === range.value;
              return (
                <label
                  key={range.value}
                  className={`flex items-center justify-between p-2.5 sm:p-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="priceRange"
                      value={range.value}
                      checked={isChecked}
                      onChange={() => onSelectPriceRange(range.value)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                    />
                    <span>{range.label}</span>
                  </div>
                  {isChecked && <span className="text-xs text-emerald-600 dark:text-emerald-400">✓</span>}
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. SẮP XẾP THEO (Có thể đóng / mở) */}
      <div>
        <button
          type="button"
          onClick={() => setSortOpen(!sortOpen)}
          className="w-full flex items-center justify-between py-2 text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <ArrowUpDown size={15} className="text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-gray-800 dark:text-gray-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              SẮP XẾP THEO
            </span>
            {sort !== 'newest' && (
              <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
            )}
          </div>
          <ChevronDown
            size={18}
            className={`text-gray-400 dark:text-slate-400 transition-transform duration-200 ${
              sortOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
            }`}
          />
        </button>

        {sortOpen && (
          <div className="mt-2 space-y-2 animate-fade-in">
            {sortOptions.map((opt) => {
              const isChecked = sort === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex items-center justify-between p-2.5 sm:p-2 rounded-xl text-xs sm:text-sm font-medium cursor-pointer select-none transition-all ${
                    isChecked
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800/60'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="sortOption"
                      value={opt.value}
                      checked={isChecked}
                      onChange={() => onSelectSort(opt.value)}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600 dark:bg-slate-700 cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </div>
                  {isChecked && <span className="text-xs text-indigo-600 dark:text-indigo-400">✓</span>}
                </label>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

