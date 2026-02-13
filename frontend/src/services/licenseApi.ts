import { request } from './apiClient';
import type { Licencia, LicenciaCreateRequest, LicenciaSearchParams, Page } from './types';

// Endpoints /licencias (legacy)
export async function getLicencias(page: number = 0, size: number = 10): Promise<Page<Licencia>> {
  return request<Page<Licencia>>(`/licencias?page=${page}&size=${size}`);
}

export async function getLicencia(id: number): Promise<Licencia> {
  return request<Licencia>(`/licencias/${id}`);
}

export async function createLicencia(licenciaData: LicenciaCreateRequest, usuarioId: number): Promise<Licencia> {
  return request<Licencia>(`/licencias?usuarioId=${usuarioId}`, {
    method: 'POST',
    body: JSON.stringify(licenciaData),
  });
}

export async function updateLicencia(id: number, licenciaData: Partial<LicenciaCreateRequest>, usuarioId: number): Promise<Licencia> {
  return request<Licencia>(`/licencias/${id}?usuarioId=${usuarioId}`, {
    method: 'PUT',
    body: JSON.stringify(licenciaData),
  });
}

export async function deleteLicencia(id: number): Promise<void> {
  await request(`/licencias/${id}`, { method: 'DELETE' });
}

export async function getLicenciasActivas(): Promise<Licencia[]> {
  return request<Licencia[]>('/licencias/activas');
}

export async function getLicenciasDisponibles(): Promise<Licencia[]> {
  return request<Licencia[]>('/api/licencia/disponibles');
}

export async function getLicenciasProximasAVencer(dias: number = 30): Promise<Licencia[]> {
  return request<Licencia[]>(`/licencias/proximas-vencer?dias=${dias}`);
}

export async function buscarLicencias(params: LicenciaSearchParams): Promise<Page<Licencia>> {
  const queryParams = new URLSearchParams();
  if (params.numeroLicencia) queryParams.append('numeroLicencia', params.numeroLicencia);
  if (params.tipoLicencia) queryParams.append('tipoLicencia', params.tipoLicencia);
  if (params.estado) queryParams.append('estado', params.estado);
  if (params.page !== undefined) queryParams.append('page', params.page.toString());
  if (params.size !== undefined) queryParams.append('size', params.size.toString());
  return request<Page<Licencia>>(`/licencias/buscar?${queryParams.toString()}`);
}

export async function getEstadisticasLicencias(): Promise<Array<{ estado: string; count: number }>> {
  return request<Array<{ estado: string; count: number }>>('/licencias/estadisticas');
}

export async function cambiarEstadoLicencia(id: number, nuevoEstado: string): Promise<void> {
  await request(`/licencias/${id}/estado?nuevoEstado=${nuevoEstado}`, { method: 'PUT' });
}

// Endpoints /api/licencia (admin)
export async function getLicenses(): Promise<any[]> {
  return request<any[]>('/api/licencia');
}

export async function getLicenseById(id: number): Promise<any> {
  return request<any>(`/api/licencia/${id}`);
}

export async function createLicense(license: any): Promise<any> {
  return request<any>('/api/licencia', {
    method: 'POST',
    body: JSON.stringify(license)
  });
}

export async function updateLicense(id: number, license: any): Promise<any> {
  return request<any>(`/api/licencia/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(license)
  });
}

export async function deleteLicense(id: number): Promise<void> {
  return request<void>(`/api/licencia/${id}`, { method: 'DELETE' });
}
