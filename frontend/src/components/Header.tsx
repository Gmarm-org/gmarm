import React from 'react';
import UserMenu from './UserMenu';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
  return (
    <header className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 shadow-sm border-b border-blue-200 px-6 py-4">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="text-gray-600 mt-1">{subtitle}</p>
          )}
        </div>
        <UserMenu />
      </div>
    </header>
  );
};

export default Header; 