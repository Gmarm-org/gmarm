import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  fullHeight = true,
  className = '',
}) => {
  return (
    <div className={`flex justify-center items-center ${fullHeight ? 'h-64' : ''} ${className}`}>
      <div className={`animate-spin rounded-full ${sizeMap[size]} border-b-2 border-blue-600`}></div>
    </div>
  );
};

export default LoadingSpinner;
