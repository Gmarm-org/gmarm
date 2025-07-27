import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  anyRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [], 
  anyRole = [] 
}) => {
  const { isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }

  // Redirigir a login si no está autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar roles requeridos (todos deben estar presentes)
  if (requiredRoles.length > 0) {
    const hasAllRoles = requiredRoles.every(role => hasRole(role));
    if (!hasAllRoles) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Verificar roles alternativos (al menos uno debe estar presente)
  if (anyRole.length > 0) {
    const hasAnyRequiredRole = hasAnyRole(anyRole);
    if (!hasAnyRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 