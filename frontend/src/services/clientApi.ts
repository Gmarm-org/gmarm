import { request } from './apiClient';
import type { Client, Page } from './types';

export async function getClientes(page: number = 0, size: number = 10): Promise<Page<Client>> {
  return request<Page<Client>>(`/api/clientes?page=${page}&size=${size}`);
}

export async function getMisClientes(page: number = 0, size: number = 10): Promise<Page<Client>> {
  return request<Page<Client>>(`/api/clientes?page=${page}&size=${size}`);
}

export async function getTiposCliente(): Promise<any[]> {
  return request<any[]>('/api/tipo-cliente');
}

export async function getTiposIdentificacion(): Promise<any[]> {
  return request<any[]>('/api/tipo-identificacion');
}

export async function getProvincias(): Promise<string[]> {
  return request<string[]>('/api/localizacion/provincias');
}

export async function getProvinciasCompletas(): Promise<Array<{codigo: string, nombre: string}>> {
  return request<Array<{codigo: string, nombre: string}>>('/api/localizacion/provincias-completas');
}

export async function getCantones(provincia: string): Promise<string[]> {
  return request<string[]>(`/api/localizacion/cantones/${encodeURIComponent(provincia)}`);
}

export async function getCliente(id: number): Promise<Client> {
  return request<Client>(`/api/clientes/${id}`);
}

export async function getClienteById(id: number): Promise<Client> {
  return request<Client>(`/api/clientes/${id}`);
}

export async function createCliente(clienteData: any): Promise<Client> {
  const requestBody = clienteData.cliente ? clienteData : { cliente: clienteData };
  return request<Client>('/api/clientes', {
    method: 'POST',
    body: JSON.stringify(requestBody),
  });
}

export async function buscarOCrearClienteFantasmaVendedor(): Promise<Client> {
  return request<Client>('/api/clientes/fantasma-vendedor', { method: 'POST' });
}

export async function updateCliente(id: number, clienteData: Partial<Client>): Promise<Client> {
  return request<Client>(`/api/clientes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(clienteData),
  });
}

export async function patchCliente(id: number, clienteData: Partial<Client>): Promise<Client> {
  return request<Client>(`/api/clientes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(clienteData),
  });
}

export async function validarDatosPersonales(id: number): Promise<{ success: boolean; message: string; emailVerificado: boolean }> {
  return request<{ success: boolean; message: string; emailVerificado: boolean }>(`/api/clientes/${id}/validar-datos`, {
    method: 'PATCH',
  });
}

export async function verifyEmailToken(token: string): Promise<{ success: boolean; message: string; clienteId?: number; email?: string; nombres?: string; apellidos?: string; numeroIdentificacion?: string; tipoIdentificacion?: string; direccion?: string; provincia?: string; canton?: string; fechaNacimiento?: string; telefonoPrincipal?: string; telefonoSecundario?: string }> {
  try {
    return await request<{ success: boolean; message: string; clienteId?: number; email?: string; nombres?: string; apellidos?: string; numeroIdentificacion?: string; tipoIdentificacion?: string; direccion?: string; provincia?: string; canton?: string; fechaNacimiento?: string; telefonoPrincipal?: string; telefonoSecundario?: string }>(
      `/api/verification/verify?token=${encodeURIComponent(token)}`
    );
  } catch (error: any) {
    if (error?.responseData && typeof error.responseData === 'object' && 'success' in error.responseData) {
      return error.responseData;
    }
    return {
      success: false,
      message: error?.message || error?.responseData?.message || 'Error al verificar el token'
    };
  }
}

export async function getTokenInfo(token: string): Promise<any> {
  return request<any>(`/api/verification/token-info?token=${encodeURIComponent(token)}`);
}

export async function deleteCliente(id: number): Promise<void> {
  await request(`/api/clientes/${id}`, { method: 'DELETE' });
}

export async function getClientesPorVendedor(vendedorId: number): Promise<Client[]> {
  return request<Client[]>(`/api/clientes/por-vendedor/${vendedorId}`);
}

export async function buscarClientePorIdentificacion(numero: string): Promise<Client> {
  return request<Client>(`/api/clientes/por-identificacion/${numero}`);
}

export async function validarIdentificacion(numero: string): Promise<{ existe: boolean; mensaje: string }> {
  return request<{ existe: boolean; mensaje: string }>(`/api/clientes/validar-identificacion/${numero}`);
}

export async function cambiarEstadoCliente(id: number, estado: string): Promise<void> {
  await request(`/api/clientes/${id}/estado?nuevoEstado=${estado}`, { method: 'PUT' });
}

export async function getTodosClientes(): Promise<any[]> {
  return request<any[]>('/api/clientes/todos');
}

export async function getDashboardJefeVentas(): Promise<{ clientesNuevosHoy: number; clientesPendientesContrato: number }> {
  return request<{ clientesNuevosHoy: number; clientesPendientesContrato: number }>('/api/clientes/dashboard/jefe-ventas');
}

export async function getClientesDeHoy(): Promise<any[]> {
  return request<any[]>('/api/clientes/dashboard/clientes-hoy');
}

export async function getClientesPendientesContrato(): Promise<any[]> {
  return request<any[]>('/api/clientes/dashboard/clientes-pendientes-contrato');
}

export async function getClientesDisponibles(grupoId?: number): Promise<any[]> {
  const url = grupoId
    ? `/api/grupos-importacion/clientes-disponibles?grupoId=${grupoId}`
    : '/api/grupos-importacion/clientes-disponibles';
  return request<any[]>(url);
}

export async function cambiarEstadoDesistimiento(clienteId: number, observacion: string): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>(`/api/clientes/${clienteId}/estado-desistimiento`, {
    method: 'PATCH',
    body: JSON.stringify({ observacion })
  });
}

export async function getFormularioCliente(tipoClienteId: number): Promise<any> {
  return request<any>(`/api/cliente-formulario/${tipoClienteId}`);
}

export async function getFormularioClienteConEstadoMilitar(tipoClienteId: number, estadoMilitar: string): Promise<any> {
  return request<any>(`/api/cliente-formulario/${tipoClienteId}/${estadoMilitar}`);
}

export async function getTiposClienteConfig(): Promise<Record<string, any>> {
  return request<Record<string, any>>('/api/tipos-cliente/config');
}
