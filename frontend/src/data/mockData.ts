// ========================================
// DATOS MOCK PARA QA - SISTEMA COMPLETO
// ========================================

import type { User, Client, Pago, SaldoCliente } from '../types';

// Usuarios mock para diferentes roles
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@test.com',
    nombres: 'Administrador',
    apellidos: 'Sistema',
    foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjM0I4MkZGIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNNDAgMTYwQzQwIDEzNS4yIDYwLjIgMTE1IDg1IDExNUgxMTVDMTM5LjggMTE1IDE2MCAxMzUuMiAxNjAgMTYwVjE3MEg0MFYxNjBaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
    telefonoPrincipal: '0987654321',
    telefonoSecundario: undefined,
    direccion: 'Av. Principal 123',
    fechaCreacion: '2024-01-01T00:00:00Z',
    ultimoLogin: undefined,
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 1,
        rolId: 5,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 5,
          nombre: 'Administrador',
          descripcion: 'Acceso completo al sistema',
          tipoRolVendedor: undefined,
          estado: true
        }
      },
      {
        usuarioId: 1,
        rolId: 3,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 3,
          nombre: 'Operaciones',
          descripcion: 'Gestión de importación y documentación',
          tipoRolVendedor: undefined,
          estado: true
        }
      }
    ]
  },
  {
    id: 2,
    username: 'vendedor1',
    email: 'vendedor@test.com',
    nombres: 'Juan',
    apellidos: 'Pérez',
    foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjMTA5ODY2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNNDAgMTYwQzQwIDEzNS4yIDYwLjIgMTE1IDg1IDExNUgxMTVDMTM5LjggMTE1IDE2MCAxMzUuMiAxNjAgMTYwVjE3MEg0MFYxNjBaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
    telefonoPrincipal: '0987654322',
    telefonoSecundario: undefined,
    direccion: 'Av. Comercial 456',
    fechaCreacion: '2024-01-01T00:00:00Z',
    ultimoLogin: undefined,
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 2,
        rolId: 1,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 1,
          nombre: 'Vendedor',
          descripcion: 'Registro de clientes y selección de armas catálogo',
          tipoRolVendedor: 'LIBRE',
          estado: true
        }
      }
    ]
  },
  {
    id: 3,
    username: 'finanzas1',
    email: 'finanzas@test.com',
    nombres: 'María',
    apellidos: 'González',
    foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRDM0QjU2Ii8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNNDAgMTYwQzQwIDEzNS4yIDYwLjIgMTE1IDg1IDExNUgxMTVDMTM5LjggMTE1IDE2MCAxMzUuMiAxNjAgMTYwVjE3MEg0MFYxNjBaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
    telefonoPrincipal: '0987654323',
    telefonoSecundario: undefined,
    direccion: 'Av. Financiera 789',
    fechaCreacion: '2024-01-01T00:00:00Z',
    ultimoLogin: undefined,
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 3,
        rolId: 4,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 4,
          nombre: 'Finanzas',
          descripcion: 'Gestión de pagos y facturación',
          tipoRolVendedor: undefined,
          estado: true
        }
      }
    ]
  },
  {
    id: 4,
    username: 'jefe_ventas',
    email: 'jefe@test.com',
    nombres: 'Carlos',
    apellidos: 'Rodríguez',
    foto: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjU5QjIzIi8+CjxjaXJjbGUgY3g9IjEwMCIgY3k9IjgwIiByPSIzMCIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNNDAgMTYwQzQwIDEzNS4yIDYwLjIgMTE1IDg1IDExNUgxMTVDMTM5LjggMTE1IDE2MCAxMzUuMiAxNjAgMTYwVjE3MEg0MFYxNjBaIiBmaWxsPSIjRkZGIi8+Cjwvc3ZnPgo=',
    telefonoPrincipal: '0987654324',
    telefonoSecundario: undefined,
    direccion: 'Av. Ejecutiva 321',
    fechaCreacion: '2024-01-01T00:00:00Z',
    ultimoLogin: undefined,
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 4,
        rolId: 2,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 2,
          nombre: 'Dirección de Ventas',
          descripcion: 'Aprobación de solicitudes y creación de grupos de importación',
          tipoRolVendedor: undefined,
          estado: true
        }
      },
      {
        usuarioId: 4,
        rolId: 1,
        fechaAsignacion: '2024-01-01T00:00:00Z',
        activo: true,
        rol: {
          id: 1,
          nombre: 'Vendedor',
          descripcion: 'Registro de clientes y selección de armas catálogo',
          tipoRolVendedor: 'LIBRE',
          estado: true
        }
      }
    ]
  }
];

// Clientes mock
export const mockClients: Client[] = [
  {
    id: '1',
    numeroIdentificacion: '1234567890',
    nombres: 'Juan Carlos',
    apellidos: 'Pérez López',
    email: 'juan.perez@email.com',
    fechaNacimiento: '1985-03-15',
    direccion: 'Av. 9 de Octubre N123-456',
    telefonoPrincipal: '0987654321',
    telefonoSecundario: '0987654322',
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cedula',
    provincia: 'Guayas',
    canton: 'Guayaquil',
    vendedorId: '2'
  },
  {
    id: '2',
    numeroIdentificacion: '1712345678',
    nombres: 'María Elena',
    apellidos: 'González Rodríguez',
    email: 'maria.gonzalez@email.com',
    fechaNacimiento: '1982-11-15',
    direccion: 'AV. 9 DE OCTUBRE N123-456',
    telefonoPrincipal: '0987654324',
    telefonoSecundario: '0987654326',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'Cedula',
    representanteLegal: 'MARÍA ELENA GONZÁLEZ RODRÍGUEZ',
    ruc: '0991234567001',
    nombreEmpresa: 'SEGURIDAD INTEGRAL S.A.',
    direccionFiscal: 'AV. 9 DE OCTUBRE N123-456, OFICINA 45',
    telefonoReferencia: '0987654325',
    correoEmpresa: 'info@seguridadintegral.com',
    provinciaEmpresa: 'Guayas',
    cantonEmpresa: 'Guayaquil',
    provincia: 'Guayas',
    canton: 'Guayaquil',
    vendedorId: '2'
  },
  {
    id: '3',
    numeroIdentificacion: '1100110011',
    nombres: 'Roberto Antonio',
    apellidos: 'Herrera Castillo',
    email: 'roberto.herrera@email.com',
    fechaNacimiento: '1978-05-20',
    direccion: 'AV. PRINCIPAL N789-012',
    telefonoPrincipal: '0987654327',
    telefonoSecundario: '0987654328',
    tipoCliente: 'Uniformado',
    tipoIdentificacion: 'Cedula',
    estadoMilitar: 'ACTIVO',
    provincia: 'Pichincha',
    canton: 'Quito',
    vendedorId: '2'
  }
];

// Pagos mock
export const mockPagos: Pago[] = [
  {
    id: 1,
    clienteId: 1,
    cliente: mockClients[0],
    numeroComprobante: 'COMP-1703812345678-123',
    montoTotal: 2500.00,
    saldoPendiente: 500.00,
    metodoPago: 'TRANSFERENCIA',
    fechaPago: '2024-01-15T10:30:00Z',
    estado: 'COMPLETADO',
    observaciones: 'Pago inicial del 80%',
    fechaCreacion: '2024-01-15T10:30:00Z',
    fechaActualizacion: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    clienteId: 2,
    cliente: mockClients[1],
    numeroComprobante: 'COMP-1703812345679-456',
    montoTotal: 5000.00,
    saldoPendiente: 0.00,
    metodoPago: 'EFECTIVO',
    fechaPago: '2024-01-16T14:20:00Z',
    estado: 'COMPLETADO',
    observaciones: 'Pago completo',
    fechaCreacion: '2024-01-16T14:20:00Z',
    fechaActualizacion: '2024-01-16T14:20:00Z'
  },
  {
    id: 3,
    clienteId: 3,
    cliente: mockClients[2],
    numeroComprobante: 'COMP-1703812345680-789',
    montoTotal: 1800.00,
    saldoPendiente: 1800.00,
    metodoPago: 'TARJETA',
    fechaPago: undefined,
    estado: 'PENDIENTE',
    observaciones: 'Pendiente de confirmación',
    fechaCreacion: '2024-01-17T09:15:00Z',
    fechaActualizacion: '2024-01-17T09:15:00Z'
  }
];

// Saldos mock
export const mockSaldos: SaldoCliente[] = [
  {
    clienteId: 1,
    saldo: 500.00,
    tieneSaldoPendiente: true
  },
  {
    clienteId: 2,
    saldo: 0.00,
    tieneSaldoPendiente: false
  },
  {
    clienteId: 3,
    saldo: 1800.00,
    tieneSaldoPendiente: true
  }
];

// Armas mock
export const mockWeapons = [
  {
    id: '1',
    nombre: 'Pistola Glock 19',
    modelo: 'Glock 19',
    categoria: 'Pistola',
    precio: 1200.00,
    stock: 5,
    descripcion: 'Pistola semiautomática 9mm'
  },
  {
    id: '2',
    nombre: 'Rifle AR-15',
    modelo: 'AR-15',
    categoria: 'Rifle',
    precio: 2500.00,
    stock: 3,
    descripcion: 'Rifle semiautomático 5.56mm'
  },
  {
    id: '3',
    nombre: 'Escopeta Remington 870',
    modelo: 'Remington 870',
    categoria: 'Escopeta',
    precio: 800.00,
    stock: 8,
    descripcion: 'Escopeta de acción de bomba 12 gauge'
  }
];

// Tipos de cliente mock
export const mockClientTypes = [
  { id: '1', nombre: 'Civil', codigo: 'CIV' },
  { id: '2', nombre: 'Uniformado', codigo: 'UNI' },
  { id: '3', nombre: 'Compañía de Seguridad', codigo: 'EMP' }
];

// Tipos de identificación mock
export const mockIdentificationTypes = [
  { id: '1', nombre: 'Cédula', codigo: 'CED' },
  { id: '2', nombre: 'RUC', codigo: 'RUC' }
];

// Provincias mock
export const mockProvinces = [
  { id: '1', nombre: 'Guayas' },
  { id: '2', nombre: 'Pichincha' },
  { id: '3', nombre: 'Azuay' },
  { id: '4', nombre: 'Manabí' }
];

// Cantones mock
export const mockCantons = {
  '1': [ // Guayas
    { id: '1', nombre: 'Guayaquil' },
    { id: '2', nombre: 'Daule' },
    { id: '3', nombre: 'Samborondón' }
  ],
  '2': [ // Pichincha
    { id: '4', nombre: 'Quito' },
    { id: '5', nombre: 'Cayambe' },
    { id: '6', nombre: 'Rumiñahui' }
  ],
  '3': [ // Azuay
    { id: '7', nombre: 'Cuenca' },
    { id: '8', nombre: 'Gualaceo' }
  ],
  '4': [ // Manabí
    { id: '9', nombre: 'Portoviejo' },
    { id: '10', nombre: 'Manta' }
  ]
};

// Función para simular delay de API
export const simulateApiDelay = (ms: number = 500): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Función para simular error aleatorio (10% de probabilidad)
export const simulateRandomError = (): boolean => {
  return Math.random() < 0.1;
}; 