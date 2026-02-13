import { request } from './apiClient';

export async function generarYEnviarContrato(clienteId: number, pagoId: number, vendedorId: number): Promise<any> {
  return request<any>('/api/contratos/generar-y-enviar', {
    method: 'POST',
    body: JSON.stringify({ clienteId, pagoId, vendedorId }),
  });
}

export async function obtenerContratosPorCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/contratos/cliente/${clienteId}`);
}

export async function obtenerDatosContrato(clienteId: number): Promise<any> {
  return request<any>(`/api/clientes/${clienteId}/datos-contrato`);
}

export async function generarContrato(clienteId: number): Promise<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; urlArchivo?: string }> {
  return request<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; urlArchivo?: string }>(`/api/clientes/${clienteId}/generar-contrato`, {
    method: 'POST',
  });
}

export async function cargarContratoFirmado(clienteId: number, archivo: File, documentoId?: number): Promise<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; tipoDocumento?: string }> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (documentoId) formData.append('documentoId', documentoId.toString());
  return request<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; tipoDocumento?: string }>(`/api/clientes/${clienteId}/cargar-contrato-firmado`, {
    method: 'POST',
    body: formData,
    headers: {}
  });
}

export async function getContratosCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/contratos/cliente/${clienteId}`);
}

// Autorizaciones
export async function generarAutorizacion(clienteId: string, numeroFactura: string, tramite: string): Promise<any> {
  return request<any>('/api/autorizaciones/generar', {
    method: 'POST',
    body: JSON.stringify({ clienteId, numeroFactura, tramite })
  });
}

export async function getAutorizacionesPorCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/autorizaciones/cliente/${clienteId}`);
}
