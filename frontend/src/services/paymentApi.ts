import { request, getToken, getApiBaseUrl } from './apiClient';
import type { ApiResponse, Pago, SaldoCliente } from './types';

export async function getPagos(page: number = 0, size: number = 10): Promise<ApiResponse<Pago[]>> {
  return request<ApiResponse<Pago[]>>(`/api/pagos?page=${page}&size=${size}`);
}

export async function getPago(id: number): Promise<Pago> {
  return request<Pago>(`/api/pagos/${id}`);
}

export async function createPago(pagoData: Partial<Pago>): Promise<Pago> {
  return request<Pago>('/api/pagos', {
    method: 'POST',
    body: JSON.stringify(pagoData),
  });
}

export async function getPagosPorCliente(clienteId: number): Promise<Pago[]> {
  return request<Pago[]>(`/api/pagos/cliente/${clienteId}`);
}

export async function getSaldoCliente(clienteId: number): Promise<SaldoCliente> {
  return request<SaldoCliente>(`/api/pagos/cliente/${clienteId}/saldo`);
}

export async function getCuotasPorPago(pagoId: number): Promise<any[]> {
  return request<any[]>(`/api/pagos/${pagoId}/cuotas`);
}

export async function pagarCuota(
  cuotaId: number,
  referenciaPago: string,
  usuarioConfirmadorId: number,
  monto?: number,
  numeroRecibo?: string,
  comprobanteArchivo?: string,
  observaciones?: string
): Promise<any> {
  return request<any>(`/api/pagos/cuota/${cuotaId}/pagar`, {
    method: 'POST',
    body: JSON.stringify({
      referenciaPago, usuarioConfirmadorId, monto, numeroRecibo, comprobanteArchivo, observaciones
    })
  });
}

export async function crearCuotaPago(pagoId: number, cuotaData: {
  numeroCuota?: number;
  monto: number;
  fechaVencimiento: string;
  referenciaPago?: string;
}): Promise<any> {
  return request<any>(`/api/pagos/${pagoId}/cuotas`, {
    method: 'POST',
    body: JSON.stringify({ pagoId, ...cuotaData })
  });
}

export async function generarRecibo(cuotaId: number): Promise<{ success: boolean; message: string; documentoId: number; nombreArchivo: string }> {
  return request<{ success: boolean; message: string; documentoId: number; nombreArchivo: string }>(`/api/pagos/cuota/${cuotaId}/generar-recibo`, {
    method: 'POST',
  });
}

export async function descargarRecibo(cuotaId: number): Promise<void> {
  const token = getToken();
  const response = await fetch(`${getApiBaseUrl()}/api/pagos/cuota/${cuotaId}/descargar-recibo`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    throw new Error('Error al descargar el recibo');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `recibo_${cuotaId}.pdf`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function enviarReciboPorCorreo(cuotaId: number, emails?: string[]): Promise<{ success: boolean; message: string }> {
  const body: any = {};
  if (emails && emails.length > 0) {
    body.emails = emails;
  }
  return request<{ success: boolean; message: string }>(`/api/pagos/cuota/${cuotaId}/enviar-recibo-correo`, {
    method: 'POST',
    body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
  });
}

export async function crearPago(pagoData: any): Promise<any> {
  return request<any>('/api/pagos', {
    method: 'POST',
    body: JSON.stringify(pagoData),
  });
}

export async function getPagosCliente(clienteId: number): Promise<any[]> {
  return request<any[]>(`/api/pagos/cliente/${clienteId}`);
}
