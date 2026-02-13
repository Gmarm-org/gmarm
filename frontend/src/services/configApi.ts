import { request } from './apiClient';

// Configuracion del sistema
export async function getConfiguracion(clave: string): Promise<any> {
  return request<any>(`/api/configuracion-sistema/${clave}`);
}

export async function getValorConfiguracion(clave: string): Promise<string> {
  return request<string>(`/api/configuracion-sistema/valor/${clave}`);
}

export async function getConfiguracionCompleta(): Promise<Record<string, any>> {
  return request<Record<string, any>>('/api/configuracion-sistema');
}

export async function getConfiguracionSistema(): Promise<any> {
  return request<any>('/api/configuracion-sistema');
}

// Preguntas
export async function getPreguntas(incluirInactivas: boolean = false): Promise<any[]> {
  const url = incluirInactivas ? '/api/pregunta-cliente?incluirInactivas=true' : '/api/pregunta-cliente';
  return request<any[]>(url);
}

export async function getPreguntaById(id: number): Promise<any> {
  return request<any>(`/api/pregunta-cliente/${id}`);
}

export async function getPreguntasCliente(tipoClienteId: number): Promise<any[]> {
  return request<any[]>(`/api/pregunta-cliente/tipo/${tipoClienteId}`);
}

export async function createPregunta(pregunta: any): Promise<any> {
  return request<any>('/api/pregunta-cliente', {
    method: 'POST',
    body: JSON.stringify(pregunta)
  });
}

export async function updatePregunta(id: number, pregunta: any): Promise<any> {
  return request<any>(`/api/pregunta-cliente/${id}`, {
    method: 'PUT',
    body: JSON.stringify(pregunta)
  });
}

export async function deletePregunta(id: number): Promise<void> {
  return request<void>(`/api/pregunta-cliente/${id}`, { method: 'DELETE' });
}

// Tipos de documento
export async function getTiposDocumento(incluirInactivos: boolean = false): Promise<any[]> {
  const url = incluirInactivos ? '/api/tipo-documento?incluirInactivos=true' : '/api/tipo-documento';
  return request<any[]>(url);
}

export async function getTiposDocumentoGruposImportacion(soloActivos: boolean = true): Promise<any[]> {
  return request<any[]>(`/api/tipo-documento/grupos-importacion?soloActivos=${soloActivos}`);
}

export async function getTipoDocumentoById(id: number): Promise<any> {
  return request<any>(`/api/tipo-documento/${id}`);
}

export async function getDocumentosRequeridos(tipoClienteId: number): Promise<any[]> {
  return request<any[]>(`/api/tipo-documento/tipo-cliente/${tipoClienteId}`);
}

export async function createTipoDocumento(tipoDocumento: any): Promise<any> {
  return request<any>('/api/tipo-documento', {
    method: 'POST',
    body: JSON.stringify(tipoDocumento)
  });
}

export async function updateTipoDocumento(id: number, tipoDocumento: any): Promise<any> {
  return request<any>(`/api/tipo-documento/${id}`, {
    method: 'PUT',
    body: JSON.stringify(tipoDocumento)
  });
}

export async function deleteTipoDocumento(id: number): Promise<void> {
  return request<void>(`/api/tipo-documento/${id}`, { method: 'DELETE' });
}

// Tipos de proceso
export async function getTiposProceso(): Promise<Array<{
  id: number; nombre: string; codigo: string; descripcion?: string; estado: boolean;
}>> {
  return request('/api/tipo-proceso');
}

export async function getTipoProcesoById(id: number): Promise<any> {
  return request<any>(`/api/tipo-proceso/${id}`);
}
