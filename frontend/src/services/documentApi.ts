import { request } from './apiClient';
import { getCurrentUser } from './authApi';

// Documentos de cliente
export async function cargarDocumentoCliente(clienteId: number, tipoDocumentoId: number, archivo: File, descripcion?: string): Promise<any> {
  try {
    const formData = new FormData();
    formData.append('clienteId', clienteId.toString());
    formData.append('tipoDocumentoId', tipoDocumentoId.toString());
    formData.append('archivo', archivo);

    let currentUser;
    try {
      currentUser = await getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('No se pudo obtener el usuario actual o el usuario no tiene ID');
      }
      formData.append('usuarioId', currentUser.id.toString());
    } catch (userError: any) {
      console.error('Error obteniendo usuario actual:', userError);
      throw new Error(`No se pudo obtener el usuario actual: ${userError?.message || 'Error desconocido'}`);
    }

    if (descripcion) formData.append('descripcion', descripcion);

    return await request<any>('/api/documentos-cliente/cargar', {
      method: 'POST',
      body: formData,
      headers: {}
    });
  } catch (error: any) {
    console.error('Error en cargarDocumentoCliente:', error);
    throw error;
  }
}

export async function getDocumentosCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/documentos-cliente/cliente/${clienteId}`);
}

export async function getDocumentoCliente(documentoId: number): Promise<any> {
  return request<any>(`/api/documentos-cliente/${documentoId}`);
}

export async function actualizarDocumentoCliente(documentoId: number, archivo: File, descripcion?: string, usuarioId?: number): Promise<any> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (descripcion) formData.append('descripcion', descripcion);
  const userId = usuarioId || 1;
  formData.append('usuarioId', userId.toString());
  return request<any>(`/api/documentos-cliente/${documentoId}`, {
    method: 'PUT',
    body: formData,
    headers: {}
  });
}

export async function eliminarDocumentoCliente(documentoId: number): Promise<boolean> {
  return request<boolean>(`/api/documentos-cliente/${documentoId}`, { method: 'DELETE' });
}

export async function cambiarEstadoDocumento(documentoId: number, estado: string): Promise<any> {
  return request<any>(`/api/documentos-cliente/${documentoId}/estado?estado=${estado}`, { method: 'PUT' });
}

export async function verificarDocumentosCompletos(clienteId: number): Promise<boolean> {
  return request<boolean>(`/api/documentos-cliente/cliente/${clienteId}/verificar-completos`);
}

export async function getResumenDocumentos(clienteId: number): Promise<any> {
  return request<any>(`/api/documentos-cliente/cliente/${clienteId}/resumen`);
}

// Respuestas de cliente
export async function guardarRespuestaCliente(clienteId: number, preguntaId: number, respuesta: string, usuarioId: number): Promise<any> {
  return request<any>('/api/respuesta-cliente', {
    method: 'POST',
    body: JSON.stringify({ clienteId, preguntaId, respuesta, usuarioId })
  });
}

export async function getRespuestasCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/respuesta-cliente/cliente/${clienteId}`);
}

// Proceso completo de cliente
export async function verificarProcesoCliente(clienteId: number): Promise<any> {
  return request<any>(`/api/cliente-proceso/${clienteId}/verificar`);
}

export async function completarProcesoCliente(clienteId: number): Promise<any> {
  return request<any>(`/api/cliente-proceso/${clienteId}/completar`, { method: 'POST' });
}

export async function confirmarInicioProceso(clienteId: number): Promise<any> {
  return request<any>(`/api/cliente-proceso/${clienteId}/confirmar-inicio`, { method: 'POST' });
}

export async function getElementosFaltantes(clienteId: number): Promise<any> {
  return request<any>(`/api/cliente-proceso/${clienteId}/elementos-faltantes`);
}

export async function getEstadoProceso(clienteId: number): Promise<any> {
  return request<any>(`/api/cliente-proceso/${clienteId}/estado`);
}
