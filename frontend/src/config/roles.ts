// Configuración centralizada de roles y permisos
export interface RolePermission {
  name: string;
  description: string;
  routes: string[];
  permissions: string[];
  redirectAfterLogin: string;
}

export const ROLE_PERMISSIONS: Record<string, RolePermission> = {
  VENDOR: {
    name: 'Vendedor',
    description: 'Registro de clientes y selección de armas del catálogo',
    routes: ['/vendedor/*', '/role-selection', '/dashboard', '/profile'],
    permissions: ['view_clients', 'create_clients', 'view_weapons', 'view_profile'],
    redirectAfterLogin: '/vendedor'
  },
  
  ADMIN: {
    name: 'Administrador',
    description: 'Acceso completo al sistema',
    routes: ['/admin/*', '/usuarios', '/dashboard', '/profile', '/vendedor', '/jefe-ventas', '/pagos', '/finanzas'],
    permissions: ['*'],
    redirectAfterLogin: '/admin'
  },
  
  FINANCE: {
    name: 'Finanzas',
    description: 'Gestión de pagos y finanzas',
    routes: ['/pagos', '/finanzas', '/role-selection', '/dashboard', '/profile'],
    permissions: ['view_payments', 'create_payments', 'view_finances', 'view_profile'],
    redirectAfterLogin: '/pagos'
  },
  
  SALES_CHIEF: {
    name: 'Jefe de Ventas',
    description: 'Supervisión de vendedores y gestión de clientes',
    routes: ['/jefe-ventas', '/jefe-ventas/*', '/vendedor', '/vendedor/*', '/role-selection', '/dashboard', '/profile'],
    permissions: ['view_vendors', 'manage_clients', 'view_reports', 'view_profile'],
    redirectAfterLogin: '/jefe-ventas'
  }
};

// Función para verificar si un rol tiene acceso a una ruta
export const checkRouteAccess = (userRole: string, route: string): boolean => {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  if (!roleConfig) return false;
  
  return roleConfig.routes.some(allowedRoute => {
    // Si la ruta termina con /*, verificar si la ruta actual empieza con esa parte
    if (allowedRoute.endsWith('/*')) {
      const baseRoute = allowedRoute.slice(0, -2);
      return route.startsWith(baseRoute);
    }
    return route === allowedRoute;
  });
};

// Función para obtener la ruta de redirección después del login
export const getRedirectRoute = (userRole: string): string => {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  return roleConfig?.redirectAfterLogin || '/dashboard';
};

// Función para verificar si un rol tiene un permiso específico
export const checkPermission = (userRole: string, permission: string): boolean => {
  const roleConfig = ROLE_PERMISSIONS[userRole];
  if (!roleConfig) return false;
  
  // Si tiene permisos '*' (todos), permitir todo
  if (roleConfig.permissions.includes('*')) return true;
  
  return roleConfig.permissions.includes(permission);
};

// Función para obtener todos los roles disponibles
export const getAvailableRoles = (): string[] => {
  return Object.keys(ROLE_PERMISSIONS);
};

// Función para obtener la información de un rol
export const getRoleInfo = (roleCode: string): RolePermission | undefined => {
  return ROLE_PERMISSIONS[roleCode];
};
