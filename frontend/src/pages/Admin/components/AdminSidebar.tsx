import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { adminMenuConfig } from '../config/adminMenuConfig';
import type { AdminMenuItem } from '../config/adminMenuConfig';

const AdminSidebar: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const location = useLocation();
  const navigate = useNavigate();

  console.log('🔍 AdminSidebar - Ruta actual:', location.pathname);
  console.log('🔍 AdminSidebar - Renderizando sidebar');

  const toggleExpanded = (path: string) => {
    setExpandedItems(prev => 
      prev.includes(path) 
        ? prev.filter(item => item !== path)
        : [...prev, path]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  const handleItemClick = (item: AdminMenuItem) => {
    console.log('🔍 AdminSidebar - Click en item:', item.label, 'Path:', item.path);
    
    if (item.children && item.children.length > 0) {
      // Si tiene hijos, solo expandir/contraer
      console.log('🔍 AdminSidebar - Expandir/contraer submenú');
      toggleExpanded(item.path);
    } else {
      // Si no tiene hijos, navegar
      console.log('🔍 AdminSidebar - Navegando a:', item.path);
      navigate(item.path);
    }
  };

  const renderMenuItem = (item: AdminMenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.path);
    const active = isActive(item.path);

    return (
      <div key={item.path}>
        <div 
          className={`
            flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-colors
            ${level === 0 ? 'mx-2 mb-1' : 'ml-6 mr-2 mb-1'}
            ${active 
              ? 'bg-blue-100 text-blue-700' 
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }
          `}
          onClick={() => handleItemClick(item)}
        >
          <div className="flex items-center flex-1">
            <span className="mr-3 text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </div>
          {hasChildren && (
            <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
              ▼
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white shadow-lg">
      {/* Header del sidebar */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Administración</h2>
        <p className="text-sm text-gray-600 mt-1">Panel de control</p>
      </div>

      {/* Menú de navegación */}
      <nav className="p-4">
        {adminMenuConfig.map(item => renderMenuItem(item))}
      </nav>

      {/* Footer del sidebar */}
      <div className="absolute bottom-0 w-64 p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          GMARM v1.0.0
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
