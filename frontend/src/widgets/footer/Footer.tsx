import React from 'react';
import { Store, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Headphones } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-12 pb-8 border-t border-slate-800">
      {/* Policy Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Truck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Giao hàng siêu tốc</h4>
              <p className="text-xs text-slate-400">Miễn phí cho đơn từ 5.000.000đ</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Cam kết chính hãng</h4>
              <p className="text-xs text-slate-400">100% sản phẩm có bảo hành</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400">
              <RefreshCw size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Đổi trả 30 ngày</h4>
              <p className="text-xs text-slate-400">Thủ tục nhanh gọn, tiện lợi</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Headphones size={24} />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">Hỗ trợ 24/7</h4>
              <p className="text-xs text-slate-400">Hotline tư vấn: 1900 6868</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg">
              <Store size={18} />
            </div>
            <span className="text-2xl font-black tracking-wider text-white">KHO</span>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed mb-4">
            KHO Online – Hệ thống phân phối thiết bị công nghệ, điện thoại, máy tính và đồ gia dụng thông minh chính hãng hàng đầu Việt Nam.
          </p>
          <div className="space-y-2 text-xs text-slate-400">
            <p className="flex items-center gap-2">
              <MapPin size={14} className="text-blue-400" /> Tòa nhà KHO, 123 Đường Công Nghệ, Hà Nội
            </p>
            <p className="flex items-center gap-2">
              <Phone size={14} className="text-blue-400" /> Hotline: 1900 6868 (8:00 - 21:30)
            </p>
            <p className="flex items-center gap-2">
              <Mail size={14} className="text-blue-400" /> Email: support@kho.vn
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Danh mục phổ biến</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="/products?category=dien-thoai" className="hover:text-blue-400 transition-colors">Điện thoại iPhone & Samsung</Link></li>
            <li><Link to="/products?category=laptop" className="hover:text-blue-400 transition-colors">Laptop Gaming & Đồ hoạ</Link></li>
            <li><Link to="/products?category=may-tinh-bang" className="hover:text-blue-400 transition-colors">Máy tính bảng iPad & Tab</Link></li>
            <li><Link to="/products?category=phu-kien" className="hover:text-blue-400 transition-colors">Phụ kiện & Tai nghe chống ồn</Link></li>
            <li><Link to="/products?category=do-gia-dung" className="hover:text-blue-400 transition-colors">Robot hút bụi & Gia dụng</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Chính sách & Hỗ trợ</h3>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><Link to="#" className="hover:text-blue-400 transition-colors">Chính sách bảo hành chính hãng</Link></li>
            <li><Link to="#" className="hover:text-blue-400 transition-colors">Chính sách giao hàng & kiểm hàng</Link></li>
            <li><Link to="#" className="hover:text-blue-400 transition-colors">Chính sách bảo mật thông tin</Link></li>
            <li><Link to="#" className="hover:text-blue-400 transition-colors">Hướng dẫn thanh toán & trả góp</Link></li>
            <li><Link to="#" className="hover:text-blue-400 transition-colors">Tra cứu hóa đơn điện tử</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Phương thức thanh toán</h3>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">COD</span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">Chuyển khoản</span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">VNPAY</span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">Visa/Master</span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">Ví MoMo</span>
            <span className="p-2 text-center text-xs font-bold rounded-lg bg-slate-800 text-slate-200 border border-slate-700">ZaloPay</span>
          </div>
          <p className="text-xs text-slate-500">
            Hệ thống thanh toán bảo mật 256-bit SSL, an toàn tuyệt đối.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 border-t border-slate-800 text-center text-xs text-slate-500">
        © 2026 KHO ONLINE. Thiết kế và phát triển với ReactJS, NestJS và MongoDB. All rights reserved.
      </div>
    </footer>
  );
};
