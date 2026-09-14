import React, { useEffect, useState } from "react";
import {
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Truck,
  RefreshCw,
  Headphones,
} from "lucide-react";
import { Link } from "react-router-dom";
import { categoryApi } from "@/entities/category/api/categoryApi";
import { Category } from "@/shared/types";

export const Footer: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((data) => setCategories(data))
      .catch((err) => console.error("Error fetching footer categories:", err));
  }, []);

  return (
    <footer className="bg-slate-900 text-slate-300 pt-0 sm:pt-12 pb-8 border-t border-slate-800">
      {/* Policy Bar - Hidden on mobile */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                Giao hàng siêu tốc
              </h4>
              <p className="text-xs text-slate-400">
                Miễn phí cho đơn từ 5.000.000đ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">
                Cam kết chính hãng
              </h4>
              <p className="text-xs text-slate-400">
                100% sản phẩm có bảo hành
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Đổi trả 30 ngày</h4>
              <p className="text-xs text-slate-400">
                Thủ tục nhanh gọn, tiện lợi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Headphones size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Hỗ trợ 24/7</h4>
              <p className="text-xs text-slate-400">
                Hotline tư vấn: 0865854741
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/25 ring-2 ring-white/10">
              <ShoppingBag size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                C.H.A.N.G
              </span>
              <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase -mt-1">
                Online Store
              </span>
            </div>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            C.H.A.N.G Online – Hệ thống phân phối thiết bị công nghệ, điện thoại, máy
            tính và đồ gia dụng thông minh chính hãng hàng đầu Việt Nam.
          </p>
          <div className="space-y-2 text-xs text-slate-400">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="text-blue-400" /> Tòa nhà CHANG, 123
              Đường Công Nghệ, Hà Nội
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-blue-400" /> Hotline: 0865854741
              (8:00 - 21:30)
            </p>
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-blue-400" /> Email: support@chang.vn
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Danh mục phổ biến
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            {categories && categories.length > 0 ? (
              categories.slice(0, 6).map((cat) => (
                <li key={cat._id}>
                  <Link
                    to={`/products?category=${encodeURIComponent(cat.slug || cat._id)}`}
                    className="hover:text-blue-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))
            ) : (
              <li>
                <Link
                  to="/products"
                  className="hover:text-blue-400 transition-colors"
                >
                  Tất cả sản phẩm
                </Link>
              </li>
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Chính sách & Hỗ trợ
          </h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Chính sách bảo hành chính hãng
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Chính sách giao hàng & kiểm hàng
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Chính sách bảo mật thông tin
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Hướng dẫn thanh toán & trả góp
              </Link>
            </li>
            <li>
              <Link to="#" className="hover:text-blue-400 transition-colors">
                Tra cứu hóa đơn điện tử
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Phương thức thanh toán
          </h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              COD
            </span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              Chuyển khoản
            </span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              VNPAY
            </span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              Visa/Master
            </span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              Ví MoMo
            </span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              ZaloPay
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Hệ thống thanh toán bảo mật 256-bit SSL, an toàn tuyệt đối.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 CHANG ONLINE
      </div>
    </footer>
  );
};
