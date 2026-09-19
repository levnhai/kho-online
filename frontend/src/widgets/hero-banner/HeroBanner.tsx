import React from 'react';
import { Link } from 'react-router-dom';

export const HeroBanner: React.FC = () => {
  return (
    <div className="my-6">
      {/* Main Banner Container */}
      <Link
        to="/products"
        className="group relative block overflow-hidden rounded-2xl sm:rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 border border-pink-100 dark:border-slate-800 bg-white dark:bg-slate-900"
      >
        <div className="relative w-full aspect-21/9 sm:aspect-2/1 md:aspect-21/9 overflow-hidden">
          <img
            src="/images/banner-me-va-be.jpg"
            alt="Thời trang Mẹ & Bé - Yêu thương trong từng bộ đồ"
            className="w-full h-full object-cover object-center transform group-hover:scale-[1.015] transition-transform duration-700 ease-out"
          />
        </div>
      </Link>
    </div>
  );
};
