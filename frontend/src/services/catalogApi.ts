import { request } from './apiClient';

// Tipos de cliente
export async function getClientTypes(): Promise<any[]> {
  return request<any[]>('/api/tipo-cliente');
}

export async function getClientTypeById(id: number): Promise<any> {
  return request<any>(`/api/tipo-cliente/${id}`);
}

export async function createClientType(clientType: any): Promise<any> {
  return request<any>('/api/tipo-cliente', {
    method: 'POST',
    body: JSON.stringify(clientType)
  });
}

export async function updateClientType(id: number, clientType: any): Promise<any> {
  return request<any>(`/api/tipo-cliente/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clientType)
  });
}

export async function deleteClientType(id: number): Promise<void> {
  return request<void>(`/api/tipo-cliente/${id}`, { method: 'DELETE' });
}

// Tipos de identificacion
export async function getIdentificationTypes(): Promise<any[]> {
  return request<any[]>('/api/tipo-identificacion');
}

export async function getIdentificationTypeById(id: number): Promise<any> {
  return request<any>(`/api/tipo-identificacion/${id}`);
}

export async function createIdentificationType(identificationType: any): Promise<any> {
  return request<any>('/api/tipo-identificacion', {
    method: 'POST',
    body: JSON.stringify(identificationType)
  });
}

export async function updateIdentificationType(id: number, identificationType: any): Promise<any> {
  return request<any>(`/api/tipo-identificacion/${id}`, {
    method: 'PUT',
    body: JSON.stringify(identificationType)
  });
}

export async function deleteIdentificationType(id: number): Promise<void> {
  return request<void>(`/api/tipo-identificacion/${id}`, { method: 'DELETE' });
}

// Tipos de importacion
export async function getImportTypes(): Promise<any[]> {
  return request<any[]>('/api/tipo-importacion');
}

export async function getImportTypeById(id: number): Promise<any> {
  return request<any>(`/api/tipo-importacion/${id}`);
}

export async function createImportType(importType: any): Promise<any> {
  return request<any>('/api/tipo-importacion', {
    method: 'POST',
    body: JSON.stringify(importType)
  });
}

export async function updateImportType(id: number, importType: any): Promise<any> {
  return request<any>(`/api/tipo-importacion/${id}`, {
    method: 'PUT',
    body: JSON.stringify(importType)
  });
}

export async function deleteImportType(id: number): Promise<void> {
  return request<void>(`/api/tipo-importacion/${id}`, { method: 'DELETE' });
}

// Tipo cliente importacion
export async function getTipoClienteImportacion(): Promise<any[]> {
  return request<any[]>('/api/tipo-cliente-importacion');
}

export async function getTipoClienteImportacionById(id: number): Promise<any> {
  return request<any>(`/api/tipo-cliente-importacion/${id}`);
}

export async function getTipoClienteImportacionByTipoCliente(tipoClienteId: number): Promise<any[]> {
  return request<any[]>(`/api/tipo-cliente-importacion/tipo-cliente/${tipoClienteId}`);
}

export async function createTipoClienteImportacion(relacion: any): Promise<any> {
  return request<any>('/api/tipo-cliente-importacion', {
    method: 'POST',
    body: JSON.stringify(relacion)
  });
}

export async function deleteTipoClienteImportacion(id: number): Promise<void> {
  return request<void>(`/api/tipo-cliente-importacion/${id}`, { method: 'DELETE' });
}

// Roles
export async function getRoles(): Promise<any[]> {
  return request<any[]>('/api/roles');
}

export async function getRoleById(id: number): Promise<any> {
  return request<any>(`/api/roles/${id}`);
}

export async function createRole(role: any): Promise<any> {
  return request<any>('/api/roles', {
    method: 'POST',
    body: JSON.stringify(role)
  });
}

export async function updateRole(id: number, role: any): Promise<any> {
  return request<any>(`/api/roles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(role)
  });
}

export async function deleteRole(id: number): Promise<void> {
  return request<void>(`/api/roles/${id}`, { method: 'DELETE' });
}
