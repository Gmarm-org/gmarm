import type { Client } from '../Vendedor/types';

export interface CuotaPago {
  id: number;
  numeroCuota: number;
  monto: number;
  fechaVencimiento: string;
  estado: string;
  fechaPago?: string;
  referenciaPago?: string;
  numeroRecibo?: string;
  comprobanteArchivo?: string;
  observaciones?: string;
  pagoId: number;
}

export interface PagoCompleto {
  id: number;
  clienteId: number;
  cliente?: Client;
  montoTotal: number;
  tipoPago: string;
  estado: string;
  fechaCreacion: string;
  cuotas?: CuotaPago[];
  saldoPendiente?: number;
  grupoImportacion?: string;
  observaciones?: string;
}
