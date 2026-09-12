import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
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
  const from = (location.state as any)?.from?.pathname || '/admin';
  const queryNotice = new URLSearchParams(location.search).get('notice');
  const notice = (location.state as any)?.notice || queryNotice || '';

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
      const res = await login({ email, password });
      if (res?.user?.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from === '/admin' ? '/' : from, { replace: true });
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
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
          <Link to="/" className="inline-flex flex-col items-center group mb-2">
            <div className="relative mb-2">
              {/* Subtle ambient glow behind logo */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 rounded-3xl blur-md opacity-75 group-hover:opacity-100 group-hover:blur-lg transition-all duration-300" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-xl ring-2 ring-white/30 dark:ring-white/15 group-hover:scale-105 transition-all duration-300">
                <ShoppingBag size={28} className="drop-shadow-sm group-hover:rotate-6 transition-transform duration-300" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-widest bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 dark:from-blue-400 dark:via-indigo-300 dark:to-cyan-300 bg-clip-text text-transparent">
                CHANG
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50 shadow-xs">
                STORE
              </span>
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mt-2">Đăng nhập tài khoản</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Chào mừng bạn quay trở lại với hệ thống bán hàng CHANG
          </p>
        </div>

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
            className="w-full font-bold shadow-md shadow-blue-600/25 cursor-pointer"
          >
            Đăng nhập
          </Button>
        </form>

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
