import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockApiService } from '../services/mockApiService';

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
  const { isAuthenticated, isLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      if (!isAuthenticated) {
        setHasAccess(false);
        return;
      }

      try {
        // Usar mockApiService para verificar roles
        if (requiredRole) {
          const hasRole = await mockApiService.hasRole(requiredRole);
          setHasAccess(hasRole);
        } else if (anyRole && anyRole.length > 0) {
          const hasAnyRole = await mockApiService.hasAnyRole(anyRole);
          setHasAccess(hasAnyRole);
        } else {
          setHasAccess(true);
        }
      } catch (error) {
        console.error('Error verificando roles:', error);
        setHasAccess(false);
      }
    };

    if (!isLoading) {
      checkAccess();
    }
  }, [isAuthenticated, isLoading, requiredRole, anyRole]);

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (hasAccess === null) {
    return <div>Verificando permisos...</div>;
  }

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 