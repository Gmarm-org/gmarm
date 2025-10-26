import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  className = '',
  style = {},
  fullWidth = false
}) => {
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    borderRadius: '0.375rem',
    fontWeight: '500',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    width: fullWidth ? '100%' : 'auto',
    ...style
  };

  const getVariantStyle = (variant: string, isDisabled: boolean): React.CSSProperties => {
    if (isDisabled) {
      switch (variant) {
        case 'primary': return { backgroundColor: '#9ca3af', color: '#6b7280' };
        case 'secondary': return { backgroundColor: '#d1d5db', color: '#9ca3af' };
        case 'danger': return { backgroundColor: '#fca5a5', color: '#fecaca' };
        case 'success': return { backgroundColor: '#a7f3d0', color: '#d1fae5' };
        case 'warning': return { backgroundColor: '#fde68a', color: '#fef3c7' };
        default: return { backgroundColor: '#9ca3af', color: '#6b7280' };
      }
    }

    switch (variant) {
      case 'primary': return { backgroundColor: '#3b82f6', color: 'white' };
      case 'secondary': return { backgroundColor: '#6b7280', color: 'white' };
      case 'danger': return { backgroundColor: '#ef4444', color: 'white' };
      case 'success': return { backgroundColor: '#10b981', color: 'white' };
      case 'warning': return { backgroundColor: '#f59e0b', color: 'white' };
      default: return { backgroundColor: '#3b82f6', color: 'white' };
    }
  };

  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: {
      padding: '0.375rem 0.75rem',
      fontSize: '0.75rem'
    },
    md: {
      padding: '0.5rem 1rem',
      fontSize: '0.875rem'
    },
    lg: {
      padding: '0.75rem 1.5rem',
      fontSize: '1rem'
    }
  };

  const buttonStyle: React.CSSProperties = {
    ...baseStyle,
    ...getVariantStyle(variant, disabled || loading),
    ...sizeStyles[size],
    opacity: disabled || loading ? 0.6 : 1
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={className}
      style={buttonStyle}
    >
      {loading && (
        <svg
          style={{
            width: '1em',
            height: '1em',
            marginRight: '0.5rem',
            animation: 'spin 1s linear infinite'
          }}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            style={{ opacity: 0.25 }}
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            style={{ opacity: 0.75 }}
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button; 