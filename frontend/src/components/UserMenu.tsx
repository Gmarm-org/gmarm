import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLogout } from '../hooks/useLogout';

interface UserMenuProps {
  onLogout?: () => void;
}

const UserMenu: React.FC<UserMenuProps> = ({ onLogout }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleLogout } = useLogout();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Cerrar menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const getUserInitials = () => {
    if (!user) return 'U';
    const names = user.nombres?.split(' ') || [];
    const surnames = user.apellidos?.split(' ') || [];
    const first = names[0]?.charAt(0) || '';
    const last = surnames[0]?.charAt(0) || '';
    return (first + last).toUpperCase();
  };

  const handleUpdateProfile = () => {
    navigate('/profile');
    setShowUserMenu(false);
  };

  const handleChangeRole = () => {
    navigate('/role-selection');
    setShowUserMenu(false);
  };

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      handleLogout();
    }
    setShowUserMenu(false);
  };

  return (
    <>
      <div className="user-menu relative">
        {/* Tarjeta de perfil del usuario */}
        <div 
          className="bg-white rounded-xl shadow-lg border border-gray-200 px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-xl flex items-center space-x-3 min-w-[200px]"
          onClick={toggleUserMenu}
        >
          {/* Avatar circular con foto o iniciales */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center text-sm font-bold shadow-md overflow-hidden">
            {user?.foto ? (
              <img 
                src={user.foto} 
                alt={`${user.nombres} ${user.apellidos}`}
                className="w-full h-full object-cover"
              />
            ) : (
              getUserInitials()
            )}
          </div>
          
          {/* Información del usuario */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">
              {user?.nombres} {user?.apellidos}
            </div>
            <div className="text-gray-600 text-xs truncate">
              {user?.email}
            </div>
          </div>
          
          {/* Icono de flecha */}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Dropdown menu */}
        {showUserMenu && (
          <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 min-w-[200px] z-50 overflow-hidden transform transition-all duration-200 ease-out opacity-100 scale-100">
            {/* Opción Actualizar Datos */}
            <div 
              className="flex items-center space-x-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
              onClick={handleUpdateProfile}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm font-medium">Actualizar Datos</span>
            </div>
            
            {/* Opción Cambiar Rol */}
            <div 
              className="flex items-center space-x-3 px-4 py-3 text-blue-600 hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
              onClick={handleChangeRole}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
              <span className="text-sm font-medium">Cambiar Rol</span>
            </div>
            
            {/* Opción Cerrar Sesión */}
            <div 
              className="flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors duration-200 cursor-pointer"
              onClick={handleLogoutClick}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserMenu; 