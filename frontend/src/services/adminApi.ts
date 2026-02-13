// Barrel module for admin panel CRUD objects
// Re-exports domain objects and types used by Admin components

import { getApiBaseUrl } from './apiClient';
import * as weaponFns from './weaponApi';
import * as licenseFns from './licenseApi';
import * as catalogFns from './catalogApi';
import * as configFns from './configApi';
import * as userFns from './userApi';
import * as clientFns from './clientApi';

// Re-export types
export type {
  Weapon, WeaponCategory, License, Role, ClientType, ImportType,
  IdentificationType, Question, DocumentType, ClientImportType, SystemConfig,
  TipoProceso, User, Client,
} from './types';

// Weapon CRUD
export const weaponApi = {
  getAll: async () => weaponFns.getArmas(true),
  getById: async (id: number) => weaponFns.getArmaById(id),
  create: async (weapon: any) => weaponFns.createArma(weapon),
  update: async (id: number, weapon: any) => weaponFns.updateArma(id, weapon),
  updateWithImage: async (id: number, formData: FormData) => weaponFns.updateArmaWithImage(id, formData),
  delete: async (id: number) => weaponFns.deleteArma(id),
  createWithImage: async (formData: FormData) => weaponFns.createArmaWithImage(formData),
};

// Weapon Category CRUD
export const weaponCategoryApi = {
  getAll: async () => weaponFns.getWeaponCategories(),
  getById: async (id: number) => weaponFns.getWeaponCategoryById(id),
  create: async (category: any) => weaponFns.createWeaponCategory(category),
  update: async (id: number, category: any) => weaponFns.updateWeaponCategory(id, category),
  delete: async (id: number) => weaponFns.deleteWeaponCategory(id),
};

// License CRUD
export const licenseApi = {
  getAll: async () => licenseFns.getLicenses(),
  getById: async (id: number) => licenseFns.getLicenseById(id),
  create: async (license: any) => licenseFns.createLicense(license),
  update: async (id: number, license: any) => licenseFns.updateLicense(id, license),
  delete: async (id: number) => licenseFns.deleteLicense(id),
};

// Role CRUD
export const roleApi = {
  getAll: async () => catalogFns.getRoles(),
  getById: async (id: number) => catalogFns.getRoleById(id),
  create: async (role: any) => catalogFns.createRole(role),
  update: async (id: number, role: any) => catalogFns.updateRole(id, role),
  delete: async (id: number) => catalogFns.deleteRole(id),
};

// User CRUD
export const userApi = {
  getAll: async (page: number = 0, size: number = 20) => {
    const response = await userFns.getUsers(page, size);
    if (response && typeof response === 'object' && 'content' in response) {
      return response.content;
    }
    return Array.isArray(response) ? response : [];
  },
  getById: async (id: number) => userFns.getUser(id),
  create: async (user: any) => userFns.createUser(user),
  update: async (id: number, user: any) => userFns.updateUser(id, user),
  delete: async (id: number) => userFns.deleteUser(id),
  unlock: async (id: number) => {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}/unlock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  changeStatus: async (id: number, estado: boolean) => {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}/status?estado=${estado}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  },
  getUserRoles: async (userId: number) => userFns.getUserRolesByUserId(userId),
  assignRoles: async (userId: number, roleIds: number[]) => userFns.assignRoles(userId, roleIds),
  removeRole: async (userId: number, roleId: number) => userFns.removeUserRole(userId, roleId),
};

// Client CRUD
export const clientApi = {
  getAll: async () => {
    const response = await clientFns.getClientes();
    return response.content || [];
  },
  getById: async (id: number) => clientFns.getClienteById(id),
  create: async (client: any) => clientFns.createCliente(client),
  update: async (id: number, client: any) => clientFns.updateCliente(id, client),
  delete: async (id: number) => clientFns.deleteCliente(id),
};

// Client Type CRUD
export const clientTypeApi = {
  getAll: async () => catalogFns.getClientTypes(),
  getById: async (id: number) => catalogFns.getClientTypeById(id),
  create: async (clientType: any) => catalogFns.createClientType(clientType),
  update: async (id: number, clientType: any) => catalogFns.updateClientType(id, clientType),
  delete: async (id: number) => catalogFns.deleteClientType(id),
};

// Import Type CRUD
export const importTypeApi = {
  getAll: async () => catalogFns.getImportTypes(),
  getById: async (id: number) => catalogFns.getImportTypeById(id),
  create: async (importType: any) => catalogFns.createImportType(importType),
  update: async (id: number, importType: any) => catalogFns.updateImportType(id, importType),
  delete: async (id: number) => catalogFns.deleteImportType(id),
};

// Identification Type CRUD
export const identificationTypeApi = {
  getAll: async () => catalogFns.getIdentificationTypes(),
  getById: async (id: number) => catalogFns.getIdentificationTypeById(id),
  create: async (identificationType: any) => catalogFns.createIdentificationType(identificationType),
  update: async (id: number, identificationType: any) => catalogFns.updateIdentificationType(id, identificationType),
  delete: async (id: number) => catalogFns.deleteIdentificationType(id),
};

// Question CRUD
export const questionApi = {
  getAll: async () => configFns.getPreguntas(true),
  getById: async (id: number) => configFns.getPreguntaById(id),
  create: async (question: any) => configFns.createPregunta(question),
  update: async (id: number, question: any) => configFns.updatePregunta(id, question),
  delete: async (id: number) => configFns.deletePregunta(id),
};

// Document Type CRUD
export const documentTypeApi = {
  getAll: async () => configFns.getTiposDocumento(true),
  getById: async (id: number) => configFns.getTipoDocumentoById(id),
  create: async (documentType: any) => configFns.createTipoDocumento(documentType),
  update: async (id: number, documentType: any) => configFns.updateTipoDocumento(id, documentType),
  delete: async (id: number) => configFns.deleteTipoDocumento(id),
};

// Client Import Type CRUD
export const clientImportTypeApi = {
  getAll: async () => catalogFns.getTipoClienteImportacion(),
  getById: async (id: number) => catalogFns.getTipoClienteImportacionById(id),
  create: async (relacion: any) => catalogFns.createTipoClienteImportacion(relacion),
  delete: async (id: number) => catalogFns.deleteTipoClienteImportacion(id),
};

// Tipo Proceso
export const tipoProcesoApi = {
  getAll: async () => configFns.getTiposProceso(),
  getById: async (id: number) => configFns.getTipoProcesoById(id),
};

// System Config
export const systemConfigApi = {
  getAll: async () => {
    const response = await configFns.getConfiguracionCompleta();
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
  },
  getById: async (clave: string) => configFns.getConfiguracion(clave),
  update: async (clave: string, config: any) => {
    const API_BASE_URL = getApiBaseUrl();
    const response = await fetch(`${API_BASE_URL}/api/configuracion-sistema/${clave}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    const text = await response.text();
    return text ? JSON.parse(text) : config;
  },
};
