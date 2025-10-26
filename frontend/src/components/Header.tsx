import React from 'react';
import UserMenu from './UserMenu';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
  onBack?: () => void;
  backLabel?: string;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showBackButton = false, 
  onBack, 
  backLabel = "Volver" 
}) => {
  return (
    <header className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 shadow-sm border-b border-blue-200 px-6 py-4">
      <div className="flex items-center">
        {/* Botón de regreso */}
        {showBackButton && onBack && (
          <button
            onClick={onBack}
            className="mr-4 p-2 rounded-lg bg-white/80 hover:bg-white transition-colors duration-200 shadow-sm border border-gray-200"
            title={backLabel}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        
        {/* Título y subtítulo */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        
        {/* Menú de usuario */}
        <UserMenu />
      </div>
    </header>
  );
};

export default Header; 