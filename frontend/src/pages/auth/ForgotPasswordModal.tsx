import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  UserCheck 
} from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';
import api from '@/shared/api/base';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIdentifier?: string;
  onSuccess?: (phone: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  initialIdentifier = '',
  onSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [verifiedUser, setVerifiedUser] = useState<{
    name: string;
    phone: string;
    email?: string;
  } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Tự động điền số điện thoại nếu đã nhập ở form đăng nhập
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setNewPassword('');
      setConfirmPassword('');
      setVerifiedUser(null);

      const trimmed = initialIdentifier.trim();
      // Nếu không phải là email thì gán vào phone
      if (trimmed && !trimmed.includes('@')) {
        setPhone(trimmed);
      } else {
        setPhone('');
      }
    }
  }, [isOpen, initialIdentifier]);

  // Kiểm tra độ mạnh của mật khẩu mới
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: '', color: '' };
    if (pwd.length < 6) return { score: 1, text: 'Quá ngắn (ít nhất 6 ký tự)', color: 'bg-rose-500 text-rose-500' };
    const hasLetters = /[a-zA-Z]/.test(pwd);
    const hasNumbers = /[0-9]/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);

    if (pwd.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
      return { score: 3, text: 'Mật khẩu mạnh', color: 'bg-emerald-500 text-emerald-500' };
    }
    if ((hasLetters && hasNumbers) || pwd.length >= 8) {
      return { score: 2, text: 'Mật khẩu trung bình', color: 'bg-amber-500 text-amber-500' };
    }
    return { score: 1, text: 'Mật khẩu yếu', color: 'bg-rose-500 text-rose-500' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Xử lý Bước 1: Xác thực tài khoản qua SĐT
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    if (!cleanPhone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/verify-reset-password', {
        phone: cleanPhone,
      });

      setVerifiedUser(res.data);
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Không tìm thấy tài khoản với số điện thoại này');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Bước 2: Đổi mật khẩu mới
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setError('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu mới không trùng khớp');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/reset-password', {
        phone: verifiedUser?.phone || phone.trim(),
        newPassword,
      });

      setStep(3);
    } catch (err: any) {
      setError(err.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess && (verifiedUser?.phone || phone)) {
      onSuccess(verifiedUser?.phone || phone);
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Khôi phục mật khẩu"
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Banner biểu tượng */}
        <div className="flex items-center gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/40 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
            {step === 3 ? (
              <CheckCircle2 size={22} className="animate-pulse" />
            ) : step === 2 ? (
              <KeyRound size={22} />
            ) : (
              <ShieldCheck size={22} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              {step === 1 && 'Bước 1: Xác nhận số điện thoại'}
              {step === 2 && 'Bước 2: Thiết lập mật khẩu mới'}
              {step === 3 && 'Hoàn tất khôi phục!'}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed truncate">
              {step === 1 && 'Nhập số điện thoại đã đăng ký tài khoản để tiếp tục'}
              {step === 2 && 'Tạo mật khẩu mới cho tài khoản của bạn'}
              {step === 3 && 'Mật khẩu đã cập nhật, bạn có thể đăng nhập ngay'}
            </p>
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {error && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-400 text-xs font-semibold animate-fade-in">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-rose-500" />
            <span className="flex-1">{error}</span>
          </div>
        )}

        {/* BƯỚC 1: Form nhập SĐT */}
        {step === 1 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <Input
              label="Số điện thoại đăng ký"
              type="tel"
              placeholder="Ví dụ: 0915948664"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon={<Phone size={16} />}
              required
              autoFocus
            />

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Hệ thống sẽ kiểm tra tài khoản liên kết với số điện thoại này và chuyển đến bước tạo mật khẩu mới.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={loading}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<ArrowRight size={16} />}
                className="font-bold shadow-md shadow-blue-600/20"
              >
                Tiếp tục
              </Button>
            </div>
          </form>
        )}

        {/* BƯỚC 2: Nhập mật khẩu mới */}
        {step === 2 && verifiedUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Box thông tin user đã xác minh */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold">
                  <UserCheck size={16} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">
                    {verifiedUser.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    SĐT: <span className="font-semibold text-gray-700 dark:text-gray-200">{verifiedUser.phone}</span>
                    {verifiedUser.email ? ` • ${verifiedUser.email}` : ''}
                  </div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Hợp lệ
              </span>
            </div>

            {/* Input Mật khẩu mới */}
            <div>
              <Input
                label="Mật khẩu mới"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Nhập ít nhất 6 ký tự..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                icon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                required
                autoFocus
              />

              {/* Thanh độ mạnh mật khẩu */}
              {newPassword && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex h-1.5 w-full bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.score === 1
                          ? 'w-1/3 bg-rose-500'
                          : passwordStrength.score === 2
                          ? 'w-2/3 bg-amber-500'
                          : 'w-full bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] font-medium flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Độ an toàn:</span>
                    <span className={passwordStrength.color.split(' ')[1]}>
                      {passwordStrength.text}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Xác nhận mật khẩu mới */}
            <Input
              label="Nhập lại mật khẩu mới"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Nhập lại chính xác mật khẩu..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none cursor-pointer transition-colors p-1"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              required
            />

            <div className="flex items-center justify-between gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError('');
                  setStep(1);
                }}
                disabled={loading}
                icon={<ArrowLeft size={16} />}
              >
                Quay lại
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                icon={<KeyRound size={16} />}
                className="font-bold shadow-md shadow-blue-600/20"
              >
                Lưu mật khẩu mới
              </Button>
            </div>
          </form>
        )}

        {/* BƯỚC 3: Thành công */}
        {step === 3 && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Đổi mật khẩu thành công!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Mật khẩu mới của bạn đã được cập nhật thành công. Hãy bấm nút bên dưới để tiến hành đăng nhập.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={handleFinish}
                className="w-full font-bold shadow-md shadow-blue-600/25"
              >
                Đăng nhập ngay
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
