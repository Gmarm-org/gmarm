import apiService from './api';
import type { Client } from './api';

// ========================================
// INTERFACES PARA ENTIDADES DEL SISTEMA
// ========================================

export interface Weapon {
  id: number;
  nombre: string;
  calibre: string;
  capacidad: number;
  precioReferencia: number;
  categoriaId: number;
  categoriaNombre: string;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  codigo: string;
  urlImagen?: string;
  urlProducto?: string;
  categoriaCodigo?: string;
}

export interface WeaponCategory {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface License {
  id: number;
  numero: string;
  tipo: string;
  estado: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  cliente_id: number;
  cliente_nombre: string;
}

export interface Role {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  estado: string;
  roles: string[];
}

export interface ClientType {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface ImportType {
  id: number;
  nombre: string;
  cupo_maximo: number;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface IdentificationType {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

// ========================================
// SERVICIOS PARA ARMAS
// ========================================

export const weaponApi = {
  // Obtener todas las armas (incluye inactivas para admin)
  getAll: async (): Promise<Weapon[]> => {
    try {
      // Para admin: incluir armas inactivas (las 30 no-expoferia)
      const response = await apiService.getArmas(true);
      console.log('🔫 Admin API - Armas obtenidas del backend (incluye inactivas):', response);
      return response;
    } catch (error) {
      console.error('Error fetching weapons:', error);
      throw error;
    }
  },

  // Obtener arma por ID
  getById: async (id: number): Promise<Weapon> => {
    try {
      const response = await apiService.getArmaById(id);
      return response;
    } catch (error) {
      console.error('Error obteniendo arma:', error);
      throw error;
    }
  },

  // Crear nueva arma
  create: async (weapon: Partial<Weapon>): Promise<Weapon> => {
    try {
      const response = await apiService.createArma(weapon);
      return response;
    } catch (error) {
      console.error('Error creando arma:', error);
      throw error;
    }
  },

  // Actualizar arma
  update: async (id: number, weapon: Partial<Weapon>): Promise<Weapon> => {
    try {
      const response = await apiService.updateArma(id, weapon);
      return response;
    } catch (error) {
      console.error('Error actualizando arma:', error);
      throw error;
    }
  },

  // Actualizar arma con imagen
  updateWithImage: async (id: number, formData: FormData): Promise<Weapon> => {
    try {
      const response = await apiService.updateArmaWithImage(id, formData);
      return response;
    } catch (error) {
      console.error('Error actualizando arma con imagen:', error);
      throw error;
    }
  },

  // Eliminar arma
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteArma(id);
    } catch (error) {
      console.error('Error deleting weapon:', error);
      throw error;
    }
  },

  // Crear arma con imagen
  createWithImage: async (formData: FormData): Promise<Weapon> => {
    try {
      const response = await apiService.createArmaWithImage(formData);
      return response;
    } catch (error) {
      console.error('Error creando arma con imagen:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA CATEGORÍAS DE ARMAS
// ========================================

export const weaponCategoryApi = {
  // Obtener todas las categorías
  getAll: async (): Promise<WeaponCategory[]> => {
    try {
      const response = await apiService.getWeaponCategories();
      return response;
    } catch (error) {
      console.error('Error fetching weapon categories:', error);
      throw error;
    }
  },

  // Obtener categoría por ID
  getById: async (id: number): Promise<WeaponCategory> => {
    try {
      const response = await apiService.getWeaponCategoryById(id);
      return response;
    } catch (error) {
      console.error('Error fetching weapon category:', error);
      throw error;
    }
  },

  // Crear nueva categoría
  create: async (category: Partial<WeaponCategory>): Promise<WeaponCategory> => {
    try {
      const response = await apiService.createWeaponCategory(category);
      return response;
    } catch (error) {
      console.error('Error creating weapon category:', error);
      throw error;
    }
  },

  // Actualizar categoría
  update: async (id: number, category: Partial<WeaponCategory>): Promise<WeaponCategory> => {
    try {
      const response = await apiService.updateWeaponCategory(id, category);
      return response;
    } catch (error) {
      console.error('Error updating weapon category:', error);
      throw error;
    }
  },

  // Eliminar categoría
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteWeaponCategory(id);
    } catch (error) {
      console.error('Error deleting weapon category:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA LICENCIAS
// ========================================

export const licenseApi = {
  // Obtener todas las licencias
  getAll: async (): Promise<License[]> => {
    try {
      const response = await apiService.getLicenses();
      return response;
    } catch (error) {
      console.error('Error fetching licenses:', error);
      throw error;
    }
  },

  // Obtener licencia por ID
  getById: async (id: number): Promise<License> => {
    try {
      const response = await apiService.getLicenseById(id);
      return response;
    } catch (error) {
      console.error('Error fetching license:', error);
      throw error;
    }
  },

  // Crear nueva licencia
  create: async (license: Partial<License>): Promise<License> => {
    try {
      const response = await apiService.createLicense(license);
      return response;
    } catch (error) {
      console.error('Error creating license:', error);
      throw error;
    }
  },

  // Actualizar licencia
  update: async (id: number, license: Partial<License>): Promise<License> => {
    try {
      const response = await apiService.updateLicense(id, license);
      return response;
    } catch (error) {
      console.error('Error updating license:', error);
      throw error;
    }
  },

  // Eliminar licencia
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteLicense(id);
    } catch (error) {
      console.error('Error deleting license:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA ROLES
// ========================================

export const roleApi = {
  getAll: async (): Promise<Role[]> => {
    try {
      const response = await apiService.getRoles();
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Role> => {
    try {
      const response = await apiService.getRoleById(id);
      return response;
    } catch (error) {
      console.error('Error fetching role:', error);
      throw error;
    }
  },

  create: async (role: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiService.createRole(role);
      return response;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  },

  update: async (id: number, role: Partial<Role>): Promise<Role> => {
    try {
      const response = await apiService.updateRole(id, role);
      return response;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteRole(id);
    } catch (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA USUARIOS
// ========================================

export const userApi = {
  // Obtener todos los usuarios
  getAll: async (): Promise<User[]> => {
    try {
      const response = await apiService.getUsers();
      return response.data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Obtener usuario por ID
  getById: async (id: number): Promise<User> => {
    try {
      const response = await apiService.getUser(id);
      return response;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  },

  // Crear nuevo usuario
  create: async (user: Partial<User>): Promise<User> => {
    try {
      const response = await apiService.createUser(user);
      return response;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Actualizar usuario
  update: async (id: number, user: Partial<User>): Promise<User> => {
    try {
      const response = await apiService.updateUser(id, user);
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  // Eliminar usuario
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteUser(id);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  // Obtener roles de un usuario
  getUserRoles: async (userId: number): Promise<any[]> => {
    try {
      const response = await apiService.getUserRolesByUserId(userId);
      return response;
    } catch (error) {
      console.error('Error fetching user roles:', error);
      throw error;
    }
  },

  // Asignar roles a un usuario
  assignRoles: async (userId: number, roleIds: number[]): Promise<void> => {
    try {
      await apiService.assignRoles(userId, roleIds);
    } catch (error) {
      console.error('Error assigning roles:', error);
      throw error;
    }
  },

  // Remover un rol de un usuario
  removeRole: async (userId: number, roleId: number): Promise<void> => {
    try {
      await apiService.removeUserRole(userId, roleId);
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA CLIENTES
// ========================================

export const clientApi = {
  // Obtener todos los clientes
  getAll: async (): Promise<Client[]> => {
    try {
      const response = await apiService.getClientes();
      return response.content || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  // Obtener cliente por ID
  getById: async (id: number): Promise<Client> => {
    try {
      const response = await apiService.getClienteById(id);
      return response;
    } catch (error) {
      console.error('Error fetching client:', error);
      throw error;
    }
  },

  // Crear nuevo cliente
  create: async (client: Partial<Client>): Promise<Client> => {
    try {
      const response = await apiService.createCliente(client);
      return response;
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Actualizar cliente
  update: async (id: number, client: Partial<Client>): Promise<Client> => {
    try {
      const response = await apiService.updateCliente(id, client);
      return response;
    } catch (error) {
      console.error('Error updating client:', error);
      throw error;
    }
  },

  // Eliminar cliente
  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteCliente(id);
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA TIPOS DE CLIENTE
// ========================================

export const clientTypeApi = {
  getAll: async (): Promise<ClientType[]> => {
    try {
      const response = await apiService.getClientTypes();
      return response;
    } catch (error) {
      console.error('Error fetching client types:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ClientType> => {
    try {
      const response = await apiService.getClientTypeById(id);
      return response;
    } catch (error) {
      console.error('Error fetching client type:', error);
      throw error;
    }
  },

  create: async (clientType: Partial<ClientType>): Promise<ClientType> => {
    try {
      const response = await apiService.createClientType(clientType);
      return response;
    } catch (error) {
      console.error('Error creating client type:', error);
      throw error;
    }
  },

  update: async (id: number, clientType: Partial<ClientType>): Promise<ClientType> => {
    try {
      const response = await apiService.updateClientType(id, clientType);
      return response;
    } catch (error) {
      console.error('Error updating client type:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteClientType(id);
    } catch (error) {
      console.error('Error deleting client type:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA TIPOS DE IMPORTACIÓN
// ========================================

export const importTypeApi = {
  getAll: async (): Promise<ImportType[]> => {
    try {
      const response = await apiService.getImportTypes();
      return response;
    } catch (error) {
      console.error('Error fetching import types:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<ImportType> => {
    try {
      const response = await apiService.getImportTypeById(id);
      return response;
    } catch (error) {
      console.error('Error fetching import type:', error);
      throw error;
    }
  },

  create: async (importType: Partial<ImportType>): Promise<ImportType> => {
    try {
      const response = await apiService.createImportType(importType);
      return response;
    } catch (error) {
      console.error('Error creating import type:', error);
      throw error;
    }
  },

  update: async (id: number, importType: Partial<ImportType>): Promise<ImportType> => {
    try {
      const response = await apiService.updateImportType(id, importType);
      return response;
    } catch (error) {
      console.error('Error updating import type:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteImportType(id);
    } catch (error) {
      console.error('Error deleting import type:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA TIPOS DE IDENTIFICACIÓN
// ========================================

export const identificationTypeApi = {
  getAll: async (): Promise<IdentificationType[]> => {
    try {
      const response = await apiService.getIdentificationTypes();
      return response;
    } catch (error) {
      console.error('Error fetching identification types:', error);
      throw error;
    }
  },

  getById: async (id: number): Promise<IdentificationType> => {
    try {
      const response = await apiService.getIdentificationTypeById(id);
      return response;
    } catch (error) {
      console.error('Error fetching identification type:', error);
      throw error;
    }
  },

  create: async (identificationType: Partial<IdentificationType>): Promise<IdentificationType> => {
    try {
      const response = await apiService.createIdentificationType(identificationType);
      return response;
    } catch (error) {
      console.error('Error creating identification type:', error);
      throw error;
    }
  },

  update: async (id: number, identificationType: Partial<IdentificationType>): Promise<IdentificationType> => {
    try {
      const response = await apiService.updateIdentificationType(id, identificationType);
      return response;
    } catch (error) {
      console.error('Error updating identification type:', error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiService.deleteIdentificationType(id);
    } catch (error) {
      console.error('Error deleting identification type:', error);
      throw error;
    }
  }
};

// ========================================
// SERVICIOS PARA CONFIGURACIÓN DEL SISTEMA
// ========================================

export interface SystemConfig {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  editable: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export const systemConfigApi = {
  getAll: async (): Promise<SystemConfig[]> => {
    try {
      const response = await apiService.getConfiguracionCompleta();
      // Convertir el objeto de configuración a array
      if (typeof response === 'object' && !Array.isArray(response)) {
        return Object.entries(response).map(([clave, datos]: [string, any]) => ({
          id: datos.id || 0,
          clave,
          valor: datos.valor || datos,
          descripcion: datos.descripcion || '',
          editable: datos.editable !== false,
          fechaCreacion: datos.fechaCreacion || new Date().toISOString(),
          fechaActualizacion: datos.fechaActualizacion
        }));
      }
      return response;
    } catch (error) {
      console.error('Error fetching system config:', error);
      throw error;
    }
  },

  getById: async (clave: string): Promise<SystemConfig> => {
    try {
      const response = await apiService.getConfiguracion(clave);
      return response;
    } catch (error) {
      console.error('Error fetching config:', error);
      throw error;
    }
  },

  update: async (clave: string, config: Partial<SystemConfig>): Promise<SystemConfig> => {
    try {
      // El backend espera ConfiguracionSistemaDTO
      const response = await apiService.request('/api/configuracion-sistema/' + clave, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
      return response;
    } catch (error) {
      console.error('Error updating config:', error);
      throw error;
    }
  }
};
