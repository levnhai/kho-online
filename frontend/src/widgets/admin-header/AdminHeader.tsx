import React from 'react';
import { ShieldCheck, User, Menu } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthContext';
import { ThemeToggle } from '@/shared/ui/ThemeToggle';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onToggleSidebar?: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  title,
  subtitle,
  action,
  onToggleSidebar,
}) => {
  const { user } = useAuth();

  return (
    <header className="h-14 pt-[env(safe-area-inset-top,0px)] box-content bg-white dark:bg-slate-900 border-b border-gray-200/80 dark:border-slate-800 px-3 sm:px-5 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-2.5">
        {/* Mobile Hamburger Button */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-1.5 text-gray-700 dark:text-gray-300 hover:text-blue-600 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors -ml-1"
            title="Mở menu quản trị"
          >
            <Menu size={20} />
          </button>
        )}

        <div>
          <h1 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white line-clamp-1">{title}</h1>
          {subtitle && <p className="text-[10px] sm:text-[11px] text-gray-400 dark:text-slate-400 mt-0 hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {action}

        {/* Theme Toggle Button */}
        <ThemeToggle />

        <div className="h-6 w-px bg-gray-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs shadow-2xs">
            <User size={14} />
          </div>
          <div className="hidden md:flex flex-col text-left">
            <div className="flex items-center gap-1">
              <span className="text-xs font-bold text-gray-900 dark:text-white">{user?.name || 'Admin'}</span>
              <ShieldCheck size={12} className="text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-[10px] text-gray-400 dark:text-slate-400">{user?.email || 'admin@kho.vn'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
