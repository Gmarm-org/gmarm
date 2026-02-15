import { request, getToken } from './apiClient';

// Armas
export async function getArmas(incluirInactivas: boolean = false): Promise<any[]> {
  try {
    const url = incluirInactivas ? '/api/arma?incluirInactivas=true' : '/api/arma';
    const response = await request<any>(url);
    if (Array.isArray(response)) return response;
    console.error('API Service: Respuesta de armas no es array, tipo recibido:', typeof response);
    return [];
  } catch (error) {
    console.error('Error obteniendo armas:', error instanceof Error ? error.message : 'Error desconocido');
    throw error;
  }
}

export async function getArmaById(id: number): Promise<any> {
  return request<any>(`/api/arma/${id}`);
}

export async function createArma(arma: any): Promise<any> {
  return request<any>('/api/arma', {
    method: 'POST',
    body: JSON.stringify(arma)
  });
}

export async function createArmaWithImage(formData: FormData): Promise<any> {
  const token = getToken();
  return request<any>('/api/arma/with-image', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function updateArma(id: number, arma: any): Promise<any> {
  return request<any>(`/api/arma/${id}`, {
    method: 'PUT',
    body: JSON.stringify(arma)
  });
}

export async function updateArmaWithImage(id: number, formData: FormData): Promise<any> {
  const token = getToken();
  return request<any>(`/api/arma/${id}/with-image`, {
    method: 'PUT',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function deleteArma(id: number): Promise<void> {
  return request<void>(`/api/arma/${id}`, { method: 'DELETE' });
}

export async function getArmasDisponibles(): Promise<any[]> {
  return request<any[]>('/api/arma/disponibles');
}

// Categorias de armas
export async function getCategoriasArma(): Promise<any[]> {
  return request<any[]>('/api/categoria-arma');
}

export async function getWeaponCategories(): Promise<any[]> {
  return request<any[]>('/api/categoria-arma');
}

export async function getWeaponCategoryById(id: number): Promise<any> {
  return request<any>(`/api/categoria-arma/${id}`);
}

export async function createWeaponCategory(category: any): Promise<any> {
  return request<any>('/api/categoria-arma', {
    method: 'POST',
    body: JSON.stringify(category)
  });
}

export async function updateWeaponCategory(id: number, category: any): Promise<any> {
  return request<any>(`/api/categoria-arma/${id}`, {
    method: 'PUT',
    body: JSON.stringify(category)
  });
}

export async function deleteWeaponCategory(id: number): Promise<void> {
  return request<void>(`/api/categoria-arma/${id}`, { method: 'DELETE' });
}

// Inventario
export async function getArmasConStock(): Promise<any[]> {
  return request<any[]>('/api/inventario/armas-disponibles');
}

export async function getStockTodasArmas(): Promise<any[]> {
  return request<any[]>('/api/inventario/stock/todas');
}

// Reservas de armas (cliente-arma)
export async function crearReservaArma(clienteId: number, armaId: number, cantidad: number, precioUnitario: number, _precioTotal: number): Promise<any> {
  const params = new URLSearchParams({
    clienteId: clienteId.toString(),
    armaId: armaId.toString(),
    cantidad: cantidad.toString(),
    precioUnitario: precioUnitario.toString()
  });
  return request<any>(`/api/cliente-arma?${params.toString()}`, { method: 'POST' });
}

export async function getArmasCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/cliente-arma/cliente/${clienteId}`);
}

export async function actualizarArmaReserva(clienteArmaId: number, nuevaArmaId: number, nuevoPrecioUnitario?: number): Promise<any> {
  const params = new URLSearchParams({ nuevaArmaId: nuevaArmaId.toString() });
  if (nuevoPrecioUnitario !== undefined) {
    params.append('nuevoPrecioUnitario', nuevoPrecioUnitario.toString());
  }
  return request<any>(`/api/cliente-arma/${clienteArmaId}/actualizar-arma?${params.toString()}`, { method: 'PUT' });
}

export async function getArmasEnStockVendedor(usuarioId: number): Promise<any[]> {
  return request<any[]>(`/api/cliente-arma/stock-vendedor/${usuarioId}`);
}

export async function reasignarArmaACliente(clienteArmaId: number, nuevoClienteId: number): Promise<any> {
  return request<any>(`/api/cliente-arma/${clienteArmaId}/reasignar/${nuevoClienteId}`, { method: 'PUT' });
}

export async function asignarNumeroSerie(reservaId: number, numeroSerie: string): Promise<any> {
  return request<any>(`/api/cliente-arma/${reservaId}/asignar-serie?numeroSerie=${encodeURIComponent(numeroSerie)}`, {
    method: 'PUT'
  });
}

// Asignacion de series
export async function getReservasPendientesAsignacion(): Promise<any[]> {
  return request<any[]>('/api/asignacion-series/pendientes');
}

export async function getSeriesDisponibles(armaId: number): Promise<any[]> {
  return request<any[]>(`/api/asignacion-series/series-disponibles/${armaId}`);
}

export async function asignarSerie(clienteArmaId: number, numeroSerie: string): Promise<any> {
  return request<any>('/api/asignacion-series/asignar', {
    method: 'POST',
    body: JSON.stringify({ clienteArmaId, numeroSerie })
  });
}
