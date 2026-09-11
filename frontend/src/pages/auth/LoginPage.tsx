import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Store, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect target after login (e.g. /checkout)
  const from = (location.state as any)?.from?.pathname || '/';
  const notice = (location.state as any)?.notice || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (emailVal: string, passVal: string) => {
    setEmail(emailVal);
    setPassword(passVal);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 transition-colors ${isDark ? 'dark' : ''}`}>
      {/* Top action bar: Quay lại trang chủ & Nút đổi giao diện */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Trang chủ</span>
        </Link>
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full mx-auto bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 border border-gray-100 dark:border-slate-700 shadow-xl space-y-6 transition-colors">
        {/* Brand Logo */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              <Store size={22} />
            </div>
            <span className="text-2xl font-black tracking-wider text-gray-900 dark:text-white">KHO</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Đăng nhập tài khoản</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng bạn quay trở lại với hệ thống bán hàng KHO
          </p>
        </div>

        {/* Notice alert if redirected from checkout */}
        {notice && (
          <div className="flex items-center gap-2 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs font-semibold">
            <AlertCircle size={18} className="flex-shrink-0 text-amber-600 dark:text-amber-400" />
            <span>{notice}</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email / Số điện thoại"
            type="email"
            placeholder="example@kho.vn"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 dark:text-gray-400">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-slate-600 focus:ring-blue-500 dark:bg-slate-700"
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              Quên mật khẩu?
            </a>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<LogIn size={18} />}
            className="w-full font-bold shadow-md shadow-blue-600/25"
          >
            Đăng nhập
          </Button>
        </form>

        {/* Quick test credentials */}
        <div className="p-3 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-200/60 dark:border-slate-700 text-xs text-gray-600 dark:text-gray-300 space-y-1.5">
          <p className="font-bold text-gray-800 dark:text-gray-200">Tài khoản thử nghiệm có sẵn:</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('khachhang@gmail.com', '123456')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-medium text-blue-600 dark:text-blue-400 shadow-2xs transition-colors"
            >
              Khách hàng
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@kho.vn', 'Admin@123456')}
              className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg hover:border-blue-500 font-medium text-indigo-600 dark:text-indigo-400 shadow-2xs transition-colors"
            >
              Quản trị Admin
            </button>
          </div>
        </div>

        {/* Switch to Register */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-700">
          Chưa có tài khoản?{' '}
          <Link
            to="/register"
            state={{ from: location.state?.from }}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Đăng ký tài khoản ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
