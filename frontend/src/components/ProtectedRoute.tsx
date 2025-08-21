import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  anyRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = React.memo(({ 
  children, 
  requiredRole, 
  anyRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  console.log('🔒 ProtectedRoute - Renderizando - TIMESTAMP:', new Date().toISOString());
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🔒 ProtectedRoute - isLoading:', isLoading);
  console.log('🔒 ProtectedRoute - user:', user);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles del usuario - extraer los códigos de los roles
  const userRoleCodes = (user as any)?.roles?.map((role: any) => role.codigo) || [];

  let hasAccess = true;

  if (requiredRole) {
    hasAccess = userRoleCodes.includes(requiredRole.toUpperCase());
  } else if (anyRole && anyRole.length > 0) {
    hasAccess = anyRole.some(role => userRoleCodes.includes(role.toUpperCase()));
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
});

export default ProtectedRoute; 