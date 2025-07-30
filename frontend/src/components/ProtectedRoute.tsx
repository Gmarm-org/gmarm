import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  anyRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  anyRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles directamente del usuario
  const userRoles = user?.roles?.map(role => role.rol?.nombre?.toLowerCase()).filter(Boolean) || [];

  let hasAccess = true;

  if (requiredRole) {
    hasAccess = userRoles.includes(requiredRole.toLowerCase());
  } else if (anyRole && anyRole.length > 0) {
    hasAccess = anyRole.some(role => userRoles.includes(role.toLowerCase()));
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 