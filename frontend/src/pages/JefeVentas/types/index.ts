// Tipos para el módulo de Jefe de Ventas

export interface Client {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  estado: string;
  procesoCompletado: boolean;
  aprobadoPorJefeVentas: boolean | null;
  motivoRechazo?: string;
  fechaCreacion: string;
  vendedor: {
    nombres: string;
    apellidos: string;
  };
  estadoProcesoVentas: 'PENDIENTE' | 'EN_PROCESO' | 'LISTO_IMPORTACION' | 'COMPLETADO';
  tipoCliente: 'CIVIL' | 'MILITAR' | 'EMPRESA' | 'DEPORTISTA';
}

export interface License {
  id: number;
  numero: string;
  nombre: string;
  ruc?: string;
  cuentaBancaria?: string;
  nombreBanco?: string;
  tipoCuenta?: string;
  cedulaCuenta?: string;
  email?: string;
  telefono?: string;
  fechaVencimiento: string;
  tipoLicencia?: string;
  descripcion?: string;
  fechaEmision?: string;
  cupoTotal?: number;
  cupoDisponible?: number;
  cupos?: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cuposDisponibles?: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cupoCivil?: number;
  cupoMilitar?: number;
  cupoEmpresa?: number;
  cupoDeportista?: number;
  observaciones?: string;
  estado: string;
  clientesAsignados?: number;
  diasRestantes?: number;
  vencida?: boolean;
}

export interface ImportGroup {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaCreacion: string;
  fechaInicio: string;
  fechaFin: string;
  licenciaAsignada: License | null;
  clientesAsignados: Client[];
  cuposDisponibles: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cuposUtilizados: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cuposRestantes: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
}

export interface SalesStats {
  totalVentas: number;
  ventasMes: number;
  ventasSemana: number;
  clientesNuevos: number;
  clientesActivos: number;
  conversionRate: number;
  promedioTicket: number;
}

export interface TeamStats {
  vendedor: string;
  ventas: number;
  clientes: number;
  conversionRate: number;
  promedioTicket: number;
  metaCumplida: number;
}

export interface LicenseStats {
  totalLicencias: number;
  licenciasActivas: number;
  cuposDisponibles: number;
  cuposUtilizados: number;
  porcentajeUso: number;
}

export interface ClientAssignment {
  id: number;
  clienteId: number;
  licenciaId: number;
  fechaAsignacion: string;
  estado: string;
  cliente: Client;
  licencia: License;
}

export interface ImportGroupAssignment {
  id: number;
  grupoId: number;
  licenciaId: number;
  fechaAsignacion: string;
  estado: string;
  grupo: ImportGroup;
  licencia: License;
}

// Enums
export const ClientStatus = {
  PENDIENTE: 'PENDIENTE',
  APROBADO: 'APROBADO',
  RECHAZADO: 'RECHAZADO',
  BLOQUEADO: 'BLOQUEADO'
} as const;

export const LicenseStatus = {
  ACTIVA: 'ACTIVA',
  INACTIVA: 'INACTIVA',
  PENDIENTE: 'PENDIENTE',
  VENCIDA: 'VENCIDA'
} as const;

export const ImportGroupStatus = {
  ACTIVO: 'ACTIVO',
  INACTIVO: 'INACTIVO',
  PENDIENTE: 'PENDIENTE',
  COMPLETADO: 'COMPLETADO'
} as const;

export const ClientType = {
  CIVIL: 'CIVIL',
  MILITAR: 'MILITAR',
  EMPRESA: 'EMPRESA',
  DEPORTISTA: 'DEPORTISTA'
} as const;

// Tipos para filtros y búsquedas
export interface ClientFilters {
  estado?: typeof ClientStatus[keyof typeof ClientStatus];
  vendedor?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  tipoCliente?: typeof ClientType[keyof typeof ClientType];
}

export interface LicenseFilters {
  estado?: typeof LicenseStatus[keyof typeof LicenseStatus];
  tipo?: string;
  fechaVencimientoDesde?: string;
  fechaVencimientoHasta?: string;
  ruc?: string;
  nombre?: string;
}

export interface ImportGroupFilters {
  estado?: typeof ImportGroupStatus[keyof typeof ImportGroupStatus];
  fechaInicioDesde?: string;
  fechaInicioHasta?: string;
}

// Tipos para formularios
export interface NewImportGroupForm {
  nombre: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  cuposCivil: number;
  cuposMilitar: number;
  cuposEmpresa: number;
  cuposDeportista: number;
}

export interface ClientApprovalForm {
  clienteId: number;
  aprobado: boolean;
  motivoRechazo?: string;
  observaciones?: string;
}

export interface LicenseAssignmentForm {
  licenciaId: number;
  clienteId: number;
  tipoCliente: typeof ClientType[keyof typeof ClientType];
  cantidad: number;
}

// Tipos para reportes
export interface SalesReport {
  periodo: string;
  ventas: number;
  clientes: number;
  conversionRate: number;
  promedioTicket: number;
  vendedores: TeamStats[];
}

export interface LicenseReport {
  periodo: string;
  licenciasActivas: number;
  cuposUtilizados: number;
  cuposDisponibles: number;
  porcentajeUso: number;
  asignaciones: ClientAssignment[];
}

export interface ImportGroupReport {
  periodo: string;
  gruposActivos: number;
  cuposUtilizados: number;
  cuposDisponibles: number;
  porcentajeUso: number;
  asignaciones: ImportGroupAssignment[];
} 