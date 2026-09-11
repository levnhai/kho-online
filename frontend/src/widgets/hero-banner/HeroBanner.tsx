import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, Flame } from 'lucide-react';

export const HeroBanner: React.FC = () => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-950 text-white shadow-xl my-6">
      {/* Background glowing orbs */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 py-12 sm:px-12 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Promotion Text */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
            <Sparkles size={14} className="text-amber-400" />
            <span>ĐẠI TIỆC CÔNG NGHỆ 2026 - GIẢM ĐẾN 35%</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Sở Hữu Siêu Phẩm <br />
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              iPhone 16 Series & S24 Ultra
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Hàng chính hãng VN/A, bảo hành 12 tháng 1 đổi 1. Hỗ trợ trả góp 0% lãi suất cùng ưu đãi voucher giảm thêm đến 2.000.000đ khi thanh toán chuyển khoản.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Zap size={16} className="text-amber-300" />
              <span>Khám phá ngay</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/products?sort=top-sales"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-semibold text-sm backdrop-blur-md transition-all"
            >
              <Flame size={16} className="text-rose-400" />
              <span>Top bán chạy</span>
            </Link>
          </div>
        </div>

        {/* Right Column: Featured Promotion Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-sm rounded-2xl bg-white/10 p-4 backdrop-blur-md border border-white/20 shadow-2xl">
            <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-4">
              <img
                src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80"
                alt="iPhone 16 Pro Max Titan"
                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-2 right-2 bg-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-md">
                HOT DEAL
              </span>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Điện thoại cao cấp
              </span>
              <h3 className="text-base font-bold text-white truncate">
                iPhone 16 Pro Max 256GB Titan Tự Nhiên
              </h3>
              <div className="flex items-baseline gap-2 pt-1">
                <span className="text-xl font-extrabold text-amber-300">
                  32.490.000đ
                </span>
                <span className="text-xs text-slate-400 line-through">
                  34.990.000đ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
