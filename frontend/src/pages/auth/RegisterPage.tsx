import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, Mail, Phone, Lock, UserPlus, AlertCircle, Store, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';
import { useTheme } from '@/app/providers/ThemeContext';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ các trường thông tin');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu và xác nhận mật khẩu không trùng khớp');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có độ dài tối thiểu 6 ký tự');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register({ name, email, phone, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Đăng ký tài khoản không thành công');
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
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              <Store size={22} />
            </div>
            <span className="text-2xl font-black tracking-wider text-gray-900 dark:text-white">KHO</span>
          </Link>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">Đăng ký tài khoản</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Tạo tài khoản để mua sắm nhanh chóng và theo dõi đơn hàng
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
            label="Họ và tên"
            type="text"
            placeholder="Nguyễn Văn A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            icon={<User size={16} />}
            required
          />

          <Input
            label="Email"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            icon={<Mail size={16} />}
            required
          />

          <Input
            label="Số điện thoại"
            type="tel"
            placeholder="09xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone size={16} />}
            required
          />

          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <Input
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            icon={<Lock size={16} />}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={<UserPlus size={18} />}
            className="w-full font-bold shadow-md shadow-blue-600/25 mt-2"
          >
            Đăng ký tài khoản
          </Button>
        </form>

        {/* Switch to Login */}
        <div className="text-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-slate-700">
          Đã có tài khoản?{' '}
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
};
