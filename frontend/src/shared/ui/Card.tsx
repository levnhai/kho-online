import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm overflow-hidden text-gray-900 dark:text-white transition-colors ${
        hoverable ? 'duration-300 hover:shadow-md hover:border-blue-200 dark:hover:border-slate-600' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
