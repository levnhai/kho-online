import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', text }) => {
  const sizeMap = {
    sm: 'h-5 w-5',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div
        className={`${sizeMap[size]} animate-spin rounded-full border-2 border-gray-200 border-t-blue-600`}
      />
      {text && <p className="mt-3 text-sm text-gray-500 font-medium">{text}</p>}
    </div>
  );
};
