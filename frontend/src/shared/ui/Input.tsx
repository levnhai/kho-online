import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightElement, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-2xs">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 dark:text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`block w-full rounded-lg border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2 px-3 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 dark:disabled:bg-slate-900 disabled:text-gray-500 ${
              icon ? 'pl-9 sm:pl-10' : ''
            } ${rightElement ? 'pr-9 sm:pr-10' : ''} ${
              error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500' : ''
            } ${className}`}
            {...props}
          />
          {rightElement && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightElement}
            </div>
          )}
        </div>
        {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
