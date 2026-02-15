import { request } from './apiClient';
import type { ApiResponse, GrupoImportacion } from './types';

export async function getGruposImportacion(page: number = 0, size: number = 10): Promise<ApiResponse<GrupoImportacion[]>> {
  return request<ApiResponse<GrupoImportacion[]>>(`/api/grupos-importacion?page=${page}&size=${size}`);
}

export async function getGrupoImportacion(id: number): Promise<GrupoImportacion> {
  return request<GrupoImportacion>(`/api/grupos-importacion/${id}`);
}

export async function getProcesosGrupoImportacion(id: number): Promise<any[]> {
  return request<any[]>(`/api/grupos-importacion/${id}/procesos`);
}

export async function actualizarProcesosGrupoImportacion(
  id: number,
  updates: Array<{ etapa: string; fechaPlanificada?: string | null; completado?: boolean | null }>
): Promise<any[]> {
  return request<any[]>(`/api/grupos-importacion/${id}/procesos`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
}

export async function getAlertasProcesosImportacion(): Promise<any[]> {
  return request<any[]>(`/api/grupos-importacion/alertas-proceso`);
}

export async function createGrupoImportacion(grupoData: Partial<GrupoImportacion>): Promise<GrupoImportacion> {
  return request<GrupoImportacion>('/api/grupos-importacion', {
    method: 'POST',
    body: JSON.stringify(grupoData),
  });
}

export async function crearGrupoImportacion(dto: {
  nombre: string;
  descripcion?: string;
  codigo?: string;
  licenciaId: number;
  tipoProcesoId?: number;
  fechaInicio?: string;
  fechaFin?: string;
  cupoTotal?: number;
  cupoDisponible?: number;
  observaciones?: string;
  tipoGrupo?: 'CUPO' | 'JUSTIFICATIVO';
  tra?: string;
  vendedores?: Array<{ vendedorId: number; limiteArmas: number }>;
  vendedorIds?: number[];
  limitesCategoria?: Array<{ categoriaArmaId: number; limiteMaximo: number }>;
}): Promise<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }> {
  return request<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }>('/api/grupos-importacion', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function actualizarGrupoImportacion(id: number, dto: {
  nombre?: string;
  descripcion?: string;
  observaciones?: string;
  tipoGrupo?: 'CUPO' | 'JUSTIFICATIVO';
  tra?: string;
  licenciaId?: number;
  vendedores?: Array<{ vendedorId: number; limiteArmas: number }>;
  vendedorIds?: number[];
  limitesCategoria?: Array<{ categoriaArmaId: number; limiteMaximo: number }>;
}): Promise<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }> {
  return request<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }>(`/api/grupos-importacion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function getVendedoresParaGrupo(): Promise<Array<{ id: number; nombres: string; apellidos: string; email: string; nombreCompleto: string }>> {
  return request<Array<{ id: number; nombres: string; apellidos: string; email: string; nombreCompleto: string }>>('/api/grupos-importacion/vendedores');
}

export async function getCategoriasArmasParaGrupo(): Promise<Array<{ id: number; nombre: string; codigo: string; descripcion: string }>> {
  return request<Array<{ id: number; nombre: string; codigo: string; descripcion: string }>>('/api/grupos-importacion/categorias-armas');
}

export async function getGruposActivos(): Promise<GrupoImportacion[]> {
  return request<GrupoImportacion[]>('/api/grupos-importacion/activos');
}

export async function agregarClienteAGrupo(grupoId: number, clienteId: number): Promise<void> {
  await request(`/api/grupos-importacion/${grupoId}/clientes/${clienteId}`, { method: 'POST' });
}

export async function getClientesDelGrupo(grupoId: number): Promise<any[]> {
  return request<any[]>(`/api/grupos-importacion/${grupoId}/clientes`);
}

export async function verificarGrupoDisponiblePorTipo(tipoClienteCodigo: string, estadoMilitar?: string): Promise<{
  disponible: boolean;
  mensaje?: string;
  tipoGrupoRequerido?: string | null;
}> {
  const params = new URLSearchParams();
  params.append('tipoClienteCodigo', tipoClienteCodigo);
  if (estadoMilitar) {
    params.append('estadoMilitar', estadoMilitar);
  }
  return request(`/api/grupos-importacion/disponible-por-tipo?${params.toString()}`);
}

export async function removerClienteDelGrupo(grupoId: number, clienteId: number): Promise<void> {
  await request(`/api/grupos-importacion/${grupoId}/clientes/${clienteId}`, { method: 'DELETE' });
}

// Operaciones
export async function getGruposParaOperaciones(): Promise<GrupoImportacion[]> {
  return request<GrupoImportacion[]>('/operaciones/grupos');
}

export async function getGrupoResumen(id: number): Promise<{
  grupoId: number; grupoNombre: string; grupoCodigo: string;
  clientesCiviles: number; clientesUniformados: number; clientesEmpresas: number; clientesDeportistas: number;
  totalClientes: number; fechaUltimaActualizacion: string;
}> {
  return request(`/operaciones/grupos/${id}`);
}

export async function definirPedido(grupoId: number): Promise<{
  message: string; documentoId: number; nombreArchivo: string; rutaArchivo: string;
}> {
  return request(`/api/grupos-importacion/${grupoId}/definir-pedido`, { method: 'POST' });
}

export async function puedeDefinirPedido(grupoId: number): Promise<{ puedeDefinir: boolean; mensaje: string }> {
  return request(`/api/grupos-importacion/${grupoId}/puede-definir-pedido`);
}

export async function getResumenGrupo(grupoId: number): Promise<{
  grupoId: number; grupoNombre: string; grupoCodigo: string;
  clientesCiviles: number; clientesUniformados: number; clientesEmpresas: number; clientesDeportistas: number;
  totalClientes: number; fechaUltimaActualizacion: string;
}> {
  return request(`/api/grupos-importacion/${grupoId}/resumen`);
}

export async function getGruposParaGestionImportaciones(page: number = 0, size: number = 20): Promise<ApiResponse<Array<{
  grupoId: number; grupoNombre: string; grupoCodigo: string;
  clientesCiviles: number; clientesUniformados: number; clientesEmpresas: number; clientesDeportistas: number;
  totalClientes: number; fechaUltimaActualizacion: string; estado?: string;
}>>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  return request(`/api/grupos-importacion/gestion-importaciones?${params.toString()}`);
}

export async function notificarAgenteAduanero(grupoId: number): Promise<{ message: string }> {
  return request(`/api/grupos-importacion/${grupoId}/notificar-agente-aduanero`, { method: 'PUT' });
}

export async function getGruposParaJefeVentas(page: number = 0, size: number = 100, estado?: string, busqueda?: string): Promise<ApiResponse<Array<{
  grupoId: number; grupoNombre: string; grupoCodigo: string;
  clientesCiviles: number; clientesUniformados: number; clientesEmpresas: number; clientesDeportistas: number;
  totalClientes: number; fechaUltimaActualizacion: string;
}>>> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  if (estado) params.append('estado', estado);
  if (busqueda) params.append('busqueda', busqueda);
  return request(`/api/grupos-importacion/jefe-ventas?${params.toString()}`);
}

// Documentos de grupo
export async function cargarDocumentoGrupo(grupoId: number, tipoDocumentoId: number, archivo: File, descripcion?: string): Promise<{
  id: number; grupoImportacionId: number; tipoDocumentoId: number;
  nombreArchivo: string; rutaArchivo: string; descripcion?: string; estado: string; fechaCarga: string;
}> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  formData.append('tipoDocumentoId', tipoDocumentoId.toString());
  if (descripcion) formData.append('descripcion', descripcion);
  return request(`/operaciones/grupos/${grupoId}/documentos`, {
    method: 'POST',
    body: formData,
    headers: {},
  });
}

export async function getDocumentosGrupo(grupoId: number): Promise<Array<{
  id: number; grupoImportacionId: number; tipoDocumentoId: number; tipoDocumentoNombre: string;
  nombreArchivo: string; rutaArchivo: string; descripcion?: string; estado: string; fechaCarga: string;
}>> {
  return request(`/operaciones/grupos/${grupoId}/documentos`);
}

export async function eliminarDocumentoGrupo(grupoId: number, documentoId: number): Promise<void> {
  await request(`/operaciones/grupos/${grupoId}/documentos/${documentoId}`, { method: 'DELETE' });
}

export async function notificarPagoFabrica(grupoId: number): Promise<{ message: string }> {
  return request(`/operaciones/grupos/${grupoId}/notificar-pago-fabrica`, { method: 'POST' });
}

export async function puedeNotificarPago(grupoId: number): Promise<{ puedeNotificar: boolean; mensaje: string }> {
  return request(`/operaciones/grupos/${grupoId}/puede-notificar-pago`);
}

export async function registrarFechaLlegada(grupoId: number, fechaLlegada: string): Promise<{ message: string }> {
  return request(`/operaciones/grupos/${grupoId}/fecha-llegada?fechaLlegada=${fechaLlegada}`, { method: 'PUT' });
}

export async function registrarNumeroPrevia(grupoId: number, numeroPrevia: string): Promise<{ message: string }> {
  return request(`/operaciones/grupos/${grupoId}/numero-previa?numeroPrevia=${encodeURIComponent(numeroPrevia)}`, { method: 'PUT' });
}
