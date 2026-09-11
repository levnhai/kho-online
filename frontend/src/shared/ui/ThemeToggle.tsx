import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/app/providers/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showText?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showText = false }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2 rounded-xl text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-300 dark:hover:text-amber-400 dark:hover:bg-slate-800 transition-all flex items-center gap-2 group active:scale-95 ${className}`}
      title={isDark ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {isDark ? (
          <Sun
            size={20}
            className="text-amber-400 transform group-hover:rotate-45 transition-transform duration-300"
          />
        ) : (
          <Moon
            size={20}
            className="text-slate-600 group-hover:text-blue-600 transform group-hover:-rotate-12 transition-transform duration-300"
          />
        )}
      </div>

      {showText && (
        <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {isDark ? 'Giao diện Sáng' : 'Giao diện Tối'}
        </span>
      )}
    </button>
  );
};
