import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkRouteAccess } from '../config/roles';

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
  const { isAuthenticated, isLoading, user, activeRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Obtener todos los roles del usuario
  const userRoles = user?.roles?.map(role => role?.rol?.codigo || (role as any)?.codigo).filter(Boolean) || [];

  // Para /role-selection, permitir acceso siempre (incluso con un solo rol)
  // Esto permite que los usuarios puedan ver y confirmar su rol actual
  if (location.pathname === '/role-selection') {
    return <>{children}</>;
  }

  // Usar el rol activo si está disponible, sino usar el primer rol
  const userRole = activeRole || userRoles[0];

  if (!userRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar acceso usando la configuración centralizada
  let hasAccess = false;

  if (requiredRole) {
    // Verificar si el usuario tiene el rol requerido específico
    hasAccess = userRole === requiredRole.toUpperCase();
  } else if (anyRole && anyRole.length > 0) {
    // Verificar si el usuario tiene alguno de los roles permitidos
    hasAccess = anyRole.some(role => userRole === role.toUpperCase());
  } else {
    // Si no se especifica rol, verificar acceso usando la configuración centralizada
    hasAccess = checkRouteAccess(userRole, location.pathname);
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
});

export default ProtectedRoute;
