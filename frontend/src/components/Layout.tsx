import React from 'react';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header title={title || 'Sistema GMARM'} subtitle={subtitle} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout; 