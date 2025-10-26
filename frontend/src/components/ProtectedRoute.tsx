import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { checkRouteAccess, getRoleInfo } from '../config/roles';

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
  
  console.log('🔒 ProtectedRoute - Renderizando - TIMESTAMP:', new Date().toISOString());
  console.log('🔒 ProtectedRoute - Ruta actual:', location.pathname);
  console.log('🔒 ProtectedRoute - isAuthenticated:', isAuthenticated);
  console.log('🔒 ProtectedRoute - isLoading:', isLoading);
  console.log('🔒 ProtectedRoute - user:', user);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    console.log('🔒 ProtectedRoute - Usuario no autenticado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  // Obtener todos los roles del usuario
  console.log('🔒 ProtectedRoute - user.roles completo:', user?.roles);
  console.log('🔒 ProtectedRoute - user.roles[0]:', user?.roles?.[0]);
  console.log('🔒 ProtectedRoute - user.roles[0].rol:', user?.roles?.[0]?.rol);
  console.log('🔒 ProtectedRoute - user.roles[0].rol?.codigo:', user?.roles?.[0]?.rol?.codigo);
  console.log('🔒 ProtectedRoute - user.roles[0].codigo (directo):', (user?.roles?.[0] as any)?.codigo);
  
  // Obtener todos los roles del usuario
  const userRoles = user?.roles?.map(role => role?.rol?.codigo || (role as any)?.codigo).filter(Boolean) || [];
  console.log('🔒 ProtectedRoute - Todos los roles del usuario:', userRoles);
  
  // Para /role-selection, permitir acceso siempre (incluso con un solo rol)
  // Esto permite que los usuarios puedan ver y confirmar su rol actual
  if (location.pathname === '/role-selection') {
    console.log('🔒 ProtectedRoute - Permitiendo acceso a role-selection');
    return <>{children}</>;
  }
  
  // Usar el rol activo si está disponible, sino usar el primer rol
  const userRole = activeRole || userRoles[0];
  console.log('🔒 ProtectedRoute - Rol activo:', activeRole);
  console.log('🔒 ProtectedRoute - Todos los roles:', userRoles);
  console.log('🔒 ProtectedRoute - Rol que se usará:', userRole);
  
  if (!userRole) {
    console.log('🔒 ProtectedRoute - Usuario sin roles, redirigiendo a /unauthorized');
    return <Navigate to="/unauthorized" replace />;
  }

  // Verificar acceso usando la configuración centralizada
  let hasAccess = false;

  if (requiredRole) {
    // Verificar si el usuario tiene el rol requerido específico
    hasAccess = userRole === requiredRole.toUpperCase();
    console.log('🔒 ProtectedRoute - Verificando requiredRole:', requiredRole.toUpperCase(), 'Resultado:', hasAccess);
  } else if (anyRole && anyRole.length > 0) {
    // Verificar si el usuario tiene alguno de los roles permitidos
    hasAccess = anyRole.some(role => userRole === role.toUpperCase());
    console.log('🔒 ProtectedRoute - Verificando anyRole:', anyRole, 'Resultado:', hasAccess);
  } else {
    // Si no se especifica rol, verificar acceso usando la configuración centralizada
    hasAccess = checkRouteAccess(userRole, location.pathname);
    console.log('🔒 ProtectedRoute - Verificando acceso a ruta usando configuración centralizada:', location.pathname, 'Resultado:', hasAccess);
  }

  console.log('🔒 ProtectedRoute - hasAccess final:', hasAccess);

  if (!hasAccess) {
    console.log('🔒 ProtectedRoute - ACCESO DENEGADO - Redirigiendo a /unauthorized');
    console.log('🔒 ProtectedRoute - Ruta solicitada:', location.pathname);
    console.log('🔒 ProtectedRoute - Rol del usuario:', userRole);
    console.log('🔒 ProtectedRoute - Información del rol:', getRoleInfo(userRole));
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('🔒 ProtectedRoute - ACCESO PERMITIDO');
  return <>{children}</>;
});

export default ProtectedRoute; 