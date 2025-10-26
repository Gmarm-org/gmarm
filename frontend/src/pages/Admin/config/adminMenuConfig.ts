export interface AdminMenuItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  description: string;
  children?: AdminMenuItem[];
}

export const adminMenuConfig: AdminMenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/',
    icon: '📊',
    description: 'Panel principal de administración'
  },
  {
    id: 'test',
    label: 'Página de Prueba',
    path: '/test',
    icon: '🧪',
    description: 'Página de prueba para verificar navegación'
  },
  {
    id: 'users',
    label: 'Gestión de Usuarios',
    path: '/users',
    icon: '👥',
    description: 'Administrar usuarios del sistema'
  },
  {
    id: 'roles',
    label: 'Gestión de Roles',
    path: '/roles',
    icon: '🛡️',
    description: 'Administrar roles y permisos'
  },
  {
    id: 'catalogs',
    label: 'Catálogos del Sistema',
    path: '/catalogs',
    icon: '📚',
    description: 'Administrar catálogos del sistema',
    children: [
      {
        id: 'weapons',
        label: 'Armas',
        path: '/weapons',
        icon: '🔫',
        description: 'Gestión del catálogo de armas'
      },
      {
        id: 'weapon-categories',
        label: 'Categorías de Armas',
        path: '/weapon-categories',
        icon: '🏷️',
        description: 'Administrar categorías de armas'
      },
      {
        id: 'accessories',
        label: 'Accesorios',
        path: '/accessories',
        icon: '🔧',
        description: 'Gestión de accesorios'
      },
      {
        id: 'accessory-types',
        label: 'Tipos de Accesorios',
        path: '/accessory-types',
        icon: '⚙️',
        description: 'Administrar tipos de accesorios'
      }
    ]
  },
  {
    id: 'licenses',
    label: 'Gestión de Licencias',
    path: '/licenses',
    icon: '📜',
    description: 'Administrar licencias de importación'
  },
  {
    id: 'clients',
    label: 'Gestión de Clientes',
    path: '/clients',
    icon: '👤',
    description: 'Administrar clientes del sistema'
  },
  {
    id: 'system-config',
    label: 'Configuración del Sistema',
    path: '/system-config',
    icon: '⚙️',
    description: 'Configuración general del sistema',
    children: [
      {
        id: 'client-types',
        label: 'Tipos de Cliente',
        path: '/client-types',
        icon: '🏷️',
        description: 'Administrar tipos de cliente'
      },
      {
        id: 'import-types',
        label: 'Tipos de Importación',
        path: '/import-types',
        icon: '📦',
        description: 'Administrar tipos de importación'
      },
      {
        id: 'process-types',
        label: 'Tipos de Proceso',
        path: '/process-types',
        icon: '🔄',
        description: 'Administrar tipos de proceso'
      },
      {
        id: 'identification-types',
        label: 'Tipos de Identificación',
        path: '/identification-types',
        icon: '🆔',
        description: 'Administrar tipos de identificación'
      },
      {
        id: 'document-types',
        label: 'Tipos de Documento',
        path: '/document-types',
        icon: '📄',
        description: 'Administrar tipos de documento'
      },
      {
        id: 'client-questions',
        label: 'Preguntas del Cliente',
        path: '/client-questions',
        icon: '❓',
        description: 'Administrar preguntas para clientes'
      },
      {
        id: 'payment-plans',
        label: 'Planes de Pago',
        path: '/payment-plans',
        icon: '💳',
        description: 'Administrar planes de pago'
      }
    ]
  },
  {
    id: 'documents',
    label: 'Gestión de Documentos',
    path: '/documents',
    icon: '📋',
    description: 'Administrar documentos del sistema',
    children: [
      {
        id: 'client-documents',
        label: 'Documentos de Cliente',
        path: '/client-documents',
        icon: '👤📄',
        description: 'Documentos asociados a clientes'
      },
      {
        id: 'import-group-documents',
        label: 'Documentos de Grupo de Importación',
        path: '/import-group-documents',
        icon: '📦📄',
        description: 'Documentos asociados a grupos de importación'
      }
    ]
  },
  {
    id: 'import-groups',
    label: 'Grupos de Importación',
    path: '/import-groups',
    icon: '📦',
    description: 'Administrar grupos de importación'
  },
  {
    id: 'payments',
    label: 'Gestión de Pagos',
    path: '/payments',
    icon: '💳',
    description: 'Administrar pagos y cuotas'
  }
];

export const getMenuByPath = (path: string): AdminMenuItem | null => {
  const findInMenu = (items: AdminMenuItem[]): AdminMenuItem | null => {
    for (const item of items) {
      if (item.path === path) return item;
      if (item.children) {
        const found = findInMenu(item.children);
        if (found) return found;
      }
    }
    return null;
  };
  
  return findInMenu(adminMenuConfig);
};

export const getBreadcrumbs = (path: string): AdminMenuItem[] => {
  const breadcrumbs: AdminMenuItem[] = [];
  
  const findPath = (items: AdminMenuItem[], targetPath: string, currentPath: AdminMenuItem[] = []): boolean => {
    for (const item of items) {
      const newPath = [...currentPath, item];
      
      if (item.path === targetPath) {
        breadcrumbs.push(...newPath);
        return true;
      }
      
      if (item.children && findPath(item.children, targetPath, newPath)) {
        return true;
      }
    }
    
    return false;
  };
  
  findPath(adminMenuConfig, path);
  return breadcrumbs;
};
