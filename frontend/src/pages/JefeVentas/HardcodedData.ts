// Datos hardcodeados para el módulo de Jefe de Ventas
// En producción, estos datos vendrían del backend

import type { Client, License, ImportGroup, SalesStats, TeamStats, LicenseStats } from './types';

export const mockClients: Client[] = [
  {
    id: 1,
    nombres: 'Juan Carlos',
    apellidos: 'González Pérez',
    cedula: '1234567890',
    email: 'juan.gonzalez@email.com',
    telefono: '0987654321',
    estado: 'ACTIVO',
    procesoCompletado: true,
    aprobadoPorJefeVentas: true,
    fechaCreacion: '2024-01-15',
    vendedor: { nombres: 'María', apellidos: 'López' },
    estadoProcesoVentas: 'LISTO_IMPORTACION',
    tipoCliente: 'CIVIL'
  },
  {
    id: 2,
    nombres: 'Ana Sofía',
    apellidos: 'Rodríguez Vega',
    cedula: '0987654321',
    email: 'ana.rodriguez@email.com',
    telefono: '1234567890',
    estado: 'ACTIVO',
    procesoCompletado: true,
    aprobadoPorJefeVentas: true,
    fechaCreacion: '2024-01-10',
    vendedor: { nombres: 'Carlos', apellidos: 'Mendoza' },
    estadoProcesoVentas: 'LISTO_IMPORTACION',
    tipoCliente: 'CIVIL'
  },
  {
    id: 3,
    nombres: 'Luis Fernando',
    apellidos: 'Herrera Silva',
    cedula: '1122334455',
    email: 'luis.herrera@email.com',
    telefono: '5566778899',
    estado: 'ACTIVO',
    procesoCompletado: true,
    aprobadoPorJefeVentas: false,
    motivoRechazo: 'Documentación incompleta',
    fechaCreacion: '2024-01-08',
    vendedor: { nombres: 'Patricia', apellidos: 'García' },
    estadoProcesoVentas: 'EN_PROCESO',
    tipoCliente: 'MILITAR'
  },
  {
    id: 4,
    nombres: 'María Elena',
    apellidos: 'Martínez Torres',
    cedula: '2233445566',
    email: 'maria.martinez@email.com',
    telefono: '6677889900',
    estado: 'ACTIVO',
    procesoCompletado: true,
    aprobadoPorJefeVentas: true,
    fechaCreacion: '2024-01-20',
    vendedor: { nombres: 'Luis', apellidos: 'Herrera' },
    estadoProcesoVentas: 'LISTO_IMPORTACION',
    tipoCliente: 'EMPRESA'
  },
  {
    id: 5,
    nombres: 'Carlos Alberto',
    apellidos: 'Vargas Mendoza',
    cedula: '3344556677',
    email: 'carlos.vargas@email.com',
    telefono: '7788990011',
    estado: 'ACTIVO',
    procesoCompletado: true,
    aprobadoPorJefeVentas: true,
    fechaCreacion: '2024-01-12',
    vendedor: { nombres: 'María', apellidos: 'López' },
    estadoProcesoVentas: 'LISTO_IMPORTACION',
    tipoCliente: 'DEPORTISTA'
  }
];

export const mockLicenses: License[] = [
  {
    id: 1,
    numero: 'LIC001',
    nombre: 'LEITON PORTILLA CORALIA SALOME',
    ruc: '1725781254',
    cuentaBancaria: '2200614031',
    nombreBanco: 'PICHINCHA',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '1725781254',
    email: 'frank_gun@hotmail.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: 'Licencia de importación para LEITON PORTILLA CORALIA SALOME',
    fechaEmision: '2024-01-01',
    cupoTotal: 2025,
    cupoDisponible: 18,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'ACTIVA',
    clientesAsignados: 7,
    diasRestantes: 9856,
    vencida: false
  },
  {
    id: 2,
    numero: 'LIC002',
    nombre: 'SILVA ACOSTA FRANCISCO JAVIER',
    ruc: '1714597414',
    cuentaBancaria: '3020513304',
    nombreBanco: 'PICHINCHA',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '1714597414',
    email: 'frank_gun@hotmail.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: 'Licencia de importación para SILVA ACOSTA FRANCISCO JAVIER',
    fechaEmision: '2024-01-15',
    cupoTotal: 2025,
    cupoDisponible: 10,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'ACTIVA',
    clientesAsignados: 15,
    diasRestantes: 9856,
    vencida: false
  },
  {
    id: 3,
    numero: 'LIC003',
    nombre: 'MULLER BENITEZ NICOLE PAMELA',
    ruc: '1713978540',
    cuentaBancaria: '2212737882',
    nombreBanco: 'PICHINCHA',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '1713978540',
    email: 'vbenitez@hotmail.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: 'Licencia de importación para MULLER BENITEZ NICOLE PAMELA',
    fechaEmision: '2024-02-01',
    cupoTotal: 2025,
    cupoDisponible: 0,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'ACTIVA',
    clientesAsignados: 25,
    diasRestantes: 9856,
    vencida: false
  },
  {
    id: 4,
    numero: 'LIC004',
    nombre: 'SIMOGUE S.A.S.',
    ruc: '0993392212001',
    cuentaBancaria: '2212359266',
    nombreBanco: 'PICHINCHA',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '0993392212001',
    email: 'simogue.sas@gmail.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_EMPRESA',
    descripcion: 'Licencia de importación para SIMOGUE S.A.S.',
    fechaEmision: '2024-01-20',
    cupoTotal: 3025,
    cupoDisponible: 80,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'ACTIVA',
    clientesAsignados: 20,
    diasRestantes: 9856,
    vencida: false
  },
  {
    id: 5,
    numero: 'LIC005',
    nombre: 'GUERRERO MARTINEZ JOSE LUIS',
    ruc: '1707815922',
    cuentaBancaria: '8151263',
    nombreBanco: 'INTERNACIONAL',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '1707815922',
    email: 'joseluis@guerreromartinez.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: 'Licencia de importación para GUERRERO MARTINEZ JOSE LUIS',
    fechaEmision: '2024-02-15',
    cupoTotal: 3025,
    cupoDisponible: 30,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'PENDIENTE',
    clientesAsignados: 0,
    diasRestantes: 9856,
    vencida: false
  },
  {
    id: 6,
    numero: 'LIC006',
    nombre: 'ENDARA UNDA FRANKLIN GEOVANNY',
    ruc: '1721770632',
    cuentaBancaria: '2100300998',
    nombreBanco: 'PICHINCHA',
    tipoCuenta: 'CORRIENTE',
    cedulaCuenta: '1721770632',
    email: 'f.endara@hotmail.com',
    telefono: '0000000000',
    fechaVencimiento: '2050-12-31',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: 'Licencia de importación para ENDARA UNDA FRANKLIN GEOVANNY',
    fechaEmision: '2024-01-10',
    cupoTotal: 2025,
    cupoDisponible: 5,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    estado: 'ACTIVA',
    clientesAsignados: 20,
    diasRestantes: 9856,
    vencida: false
  }
];

export const mockImportGroups: ImportGroup[] = [
  {
    id: 1,
    codigo: 'IMP-2024-001',
    nombre: 'Importación Q1 2024',
    descripcion: 'Grupo de importación para el primer trimestre de 2024',
    estado: 'ACTIVO',
    fechaCreacion: '2024-01-01',
    fechaInicio: '2024-01-01',
    fechaFin: '2024-03-31',
    licenciaAsignada: mockLicenses[0],
    clientesAsignados: [],
    cuposDisponibles: { civil: 25, militar: 1000, empresa: 1000, deportista: 1000 },
    cuposUtilizados: { civil: 0, militar: 0, empresa: 0, deportista: 0 },
    cuposRestantes: { civil: 25, militar: 1000, empresa: 1000, deportista: 1000 }
  }
];

export const mockSalesStats: SalesStats = {
  totalVentas: 125000,
  ventasMes: 45000,
  ventasSemana: 12000,
  clientesNuevos: 45,
  clientesActivos: 180,
  conversionRate: 78.5,
  promedioTicket: 2800
};

export const mockTeamStats: TeamStats[] = [
  {
    vendedor: 'María López',
    ventas: 15000,
    clientes: 12,
    conversionRate: 85.2,
    promedioTicket: 3200,
    metaCumplida: 95
  },
  {
    vendedor: 'Carlos Mendoza',
    ventas: 12000,
    clientes: 10,
    conversionRate: 72.1,
    promedioTicket: 2800,
    metaCumplida: 80
  },
  {
    vendedor: 'Patricia García',
    ventas: 18000,
    clientes: 15,
    conversionRate: 88.9,
    promedioTicket: 3500,
    metaCumplida: 110
  },
  {
    vendedor: 'Luis Herrera',
    ventas: 9000,
    clientes: 8,
    conversionRate: 65.4,
    promedioTicket: 2200,
    metaCumplida: 70
  },
  {
    vendedor: 'Ana Martínez',
    ventas: 11000,
    clientes: 9,
    conversionRate: 75.8,
    promedioTicket: 2900,
    metaCumplida: 85
  }
];

export const mockLicenseStats: LicenseStats = {
  totalLicencias: 15,
  licenciasActivas: 12,
  cuposDisponibles: 500,
  cuposUtilizados: 320,
  porcentajeUso: 64
};

// Datos para filtros y opciones
export const clientStatusOptions = [
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'APROBADO', label: 'Aprobado' },
  { value: 'RECHAZADO', label: 'Rechazado' },
  { value: 'BLOQUEADO', label: 'Bloqueado' }
];

export const licenseStatusOptions = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'INACTIVA', label: 'Inactiva' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'VENCIDA', label: 'Vencida' }
];

export const licenseTypeOptions = [
  { value: 'IMPORTACION_CIVIL', label: 'Importación Civil' },
  { value: 'IMPORTACION_MILITAR', label: 'Importación Militar' },
  { value: 'IMPORTACION_EMPRESA', label: 'Importación Empresa' },
  { value: 'IMPORTACION_DEPORTISTA', label: 'Importación Deportista' }
];

export const importGroupStatusOptions = [
  { value: 'ACTIVO', label: 'Activo' },
  { value: 'INACTIVO', label: 'Inactivo' },
  { value: 'PENDIENTE', label: 'Pendiente' },
  { value: 'COMPLETADO', label: 'Completado' }
];

export const clientTypeOptions = [
  { value: 'CIVIL', label: 'Civil' },
  { value: 'MILITAR', label: 'Militar' },
  { value: 'EMPRESA', label: 'Empresa' },
  { value: 'DEPORTISTA', label: 'Deportista' }
];

// Datos para reportes
export const mockSalesReport = {
  periodo: 'Enero 2024',
  ventas: 45000,
  clientes: 45,
  conversionRate: 78.5,
  promedioTicket: 2800,
  vendedores: mockTeamStats
};

export const mockLicenseReport = {
  periodo: 'Enero 2024',
  licenciasActivas: 12,
  cuposUtilizados: 320,
  cuposDisponibles: 500,
  porcentajeUso: 64,
  asignaciones: []
};

export const mockImportGroupReport = {
  periodo: 'Q1 2024',
  gruposActivos: 3,
  cuposUtilizados: 60,
  cuposDisponibles: 195,
  porcentajeUso: 30.8,
  asignaciones: []
};

// Configuraciones
export const defaultPageSize = 10;
export const maxPageSize = 100;

export const dateFormat = 'DD/MM/YYYY';
export const dateTimeFormat = 'DD/MM/YYYY HH:mm';

export const currencyConfig = {
  locale: 'es-EC',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
}; 