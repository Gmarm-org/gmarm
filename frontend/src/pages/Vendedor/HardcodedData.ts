import type { Client, Weapon, User, Role } from '../../types';

export const clientes: Client[] = [
  {
    id: '1',
    cedula: '1234567890',
    nombres: 'JUAN',
    apellidos: 'PÉREZ',
    email: 'juan.perez@email.com',
    fechaNacimiento: '1990-05-15', // 34 años - PUEDE COMPRAR
    provincia: 'Pichincha',
    canton: 'Quito',
    direccion: 'CALLE PRINCIPAL 123',
    telefonoPrincipal: '0987654321',
    telefonoSecundario: '022345678',
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cedula',
    vendedorId: 'vendedor-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    cedula: '0999999999',
    nombres: 'SEGURIDAD S.A.',
    apellidos: '',
    email: 'contacto@seguridad.com',
    fechaNacimiento: '1985-03-20', // 39 años - PUEDE COMPRAR (representante legal)
    provincia: 'Guayas',
    canton: 'Guayaquil',
    direccion: 'AV. EMPRESA 456',
    telefonoPrincipal: '022345678',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'RUC',
    ruc: '0999999999001',
    correoElectronico: 'contacto@seguridad.com',
    provinciaCompania: 'Guayas',
    cantonCompania: 'Guayaquil',
    direccionFiscal: 'AV. EMPRESA 456, OFICINA 101',
    telefonoReferencia: '022345679',
    vendedorId: 'vendedor-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    cedula: '1100110011',
    nombres: 'CARLOS',
    apellidos: 'RAMÍREZ',
    email: 'c.ramirez@militar.com',
    fechaNacimiento: '1992-08-10', // 32 años - PUEDE COMPRAR
    provincia: 'Azuay',
    canton: 'Cuenca',
    direccion: 'BASE MILITAR',
    telefonoPrincipal: '099888777',
    telefonoSecundario: '072345678',
    tipoCliente: 'Uniformado',
    tipoIdentificacion: 'Cedula',
    estadoUniformado: 'Activo',
    vendedorId: 'vendedor-2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    cedula: '0808080808',
    nombres: 'ANA',
    apellidos: 'GÓMEZ',
    email: 'ana.gomez@deporte.com',
    fechaNacimiento: '2002-12-03', // 22 años - NO PUEDE COMPRAR (menor de 25)
    provincia: 'Manabí',
    canton: 'Manta',
    direccion: 'CLUB DEPORTIVO',
    telefonoPrincipal: '098123456',
    telefonoSecundario: '052345678',
    tipoCliente: 'Deportista',
    tipoIdentificacion: 'Cedula',
    vendedorId: 'vendedor-2',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '5',
    cedula: '0505050505',
    nombres: 'LUIS',
    apellidos: 'MARTÍNEZ',
    email: 'luis.martinez@email.com',
    fechaNacimiento: '2005-06-15', // 19 años - NO PUEDE COMPRAR (menor de 25)
    provincia: 'Pichincha',
    canton: 'Quito',
    direccion: 'AV. JUVENTUD 789',
    telefonoPrincipal: '099555444',
    telefonoSecundario: '022123456',
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cedula',
    vendedorId: 'vendedor-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const weapons: Weapon[] = [
  {
    id: '1',
    modelo: 'Modelo A',
    calibre: '55',
    capacidad: 12,
    precio: 1000,
    imagen: '/weapon1.png',
    disponible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    modelo: 'Modelo B',
    calibre: '45',
    capacidad: 15,
    precio: 1200,
    imagen: '/weapon2.png',
    disponible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

export const clientTypeLabels: Record<string, string> = {
  Civil: 'Civiles',
  'Compañía de Seguridad': 'Compañías de seguridad',
  Uniformado: 'Uniformados',
  Deportista: 'Deportistas'
};
export const clientTypeOrder = ['Civil', 'Compañía de Seguridad', 'Uniformado', 'Deportista'];

// Catálogos para endpoints
export const tiposDeCliente = ['Civil', 'Compañía de Seguridad', 'Uniformado', 'Deportista'];
export const tiposDeIdentificacion = ['Cedula', 'RUC'];

export const docsByTipo: Record<string, string[]> = {
  Civil: ['Cédula', 'Certificado de antecedentes'],
  'Compañía de Seguridad': ['RUC', 'Permiso de funcionamiento', 'Representante legal'],
  Uniformado: ['Cédula', 'Credencial policial'],
  Deportista: ['Cédula', 'Credencial club', 'Permiso deportivo']
};
export const preguntasByTipo: Record<string, string[]> = {
  Civil: ['¿Ha tenido antecedentes?', '¿Motivo de compra?'],
  'Compañía de Seguridad': ['¿Tipo de empresa?', '¿Cantidad de armas requeridas?'],
  Uniformado: ['¿Rango?', '¿Unidad?'],
  Deportista: ['¿Disciplina?', '¿Participa en competencias?']
};

export const armasPorCliente: Record<string, Weapon | null> = {
  '1': weapons[0], // Juan tiene arma 1
  '2': null,       // Seguridad S.A. sin arma
  '3': weapons[1], // Carlos tiene arma 2
  '4': null        // Ana sin arma
};

// ===== ROLES DEL SISTEMA =====
export const roles: Role[] = [
  {
    id: 1,
    nombre: 'Vendedor',
    descripcion: 'Registro de clientes y selección de armas catálogo',
    tipoRolVendedor: 'LIBRE',
    estado: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    nombre: 'Dirección de Ventas',
    descripcion: 'Aprobación de solicitudes y creación de grupos de importación',
    tipoRolVendedor: undefined,
    estado: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 3,
    nombre: 'Operaciones',
    descripcion: 'Gestión de importación y documentación',
    tipoRolVendedor: undefined,
    estado: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 4,
    nombre: 'Finanzas',
    descripcion: 'Gestión de pagos y facturación',
    tipoRolVendedor: undefined,
    estado: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 5,
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema',
    tipoRolVendedor: undefined,
    estado: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

// ===== USUARIOS DEL SISTEMA =====
export const usuarios: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@gmarm.com',
    nombres: 'ADMINISTRADOR',
    apellidos: 'SISTEMA',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    telefonoPrincipal: '0987654321',
    telefonoSecundario: undefined,
    direccion: 'QUITO, ECUADOR',
    fechaCreacion: '2024-01-01T00:00:00Z',
    ultimoLogin: '2024-12-01T10:30:00Z',
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
        rol: roles[4]
      }
    ]
  },
  {
    id: 2,
    username: 'vendedor1',
    email: 'vendedor1@gmarm.com',
    nombres: 'JUAN CARLOS',
    apellidos: 'PÉREZ LÓPEZ',
    foto: undefined,
    telefonoPrincipal: '0987654322',
    telefonoSecundario: '0987654323',
    direccion: 'GUAYAQUIL, ECUADOR',
    fechaCreacion: '2024-01-15T00:00:00Z',
    ultimoLogin: '2024-12-01T09:15:00Z',
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 2,
        rolId: 1,
        fechaAsignacion: '2024-01-15T00:00:00Z',
        activo: true,
        rol: roles[0]
      }
    ]
  },
  {
    id: 3,
    username: 'vendedor2',
    email: 'vendedor2@gmarm.com',
    nombres: 'MARÍA ELENA',
    apellidos: 'GONZÁLEZ RODRÍGUEZ',
    foto: undefined,
    telefonoPrincipal: '0987654324',
    telefonoSecundario: undefined,
    direccion: 'CUENCA, ECUADOR',
    fechaCreacion: '2024-02-01T00:00:00Z',
    ultimoLogin: '2024-12-01T08:45:00Z',
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 3,
        rolId: 1,
        fechaAsignacion: '2024-02-01T00:00:00Z',
        activo: true,
        rol: roles[0]
      }
    ]
  },
  {
    id: 4,
    username: 'direccion_ventas',
    email: 'direccion.ventas@gmarm.com',
    nombres: 'CARLOS ALBERTO',
    apellidos: 'MARTÍNEZ VARGAS',
    foto: undefined,
    telefonoPrincipal: '0987654325',
    telefonoSecundario: '0987654326',
    direccion: 'QUITO, ECUADOR',
    fechaCreacion: '2024-01-10T00:00:00Z',
    ultimoLogin: '2024-12-01T11:20:00Z',
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 4,
        rolId: 2,
        fechaAsignacion: '2024-01-10T00:00:00Z',
        activo: true,
        rol: roles[1]
      }
    ]
  },
  {
    id: 5,
    username: 'operaciones',
    email: 'operaciones@gmarm.com',
    nombres: 'ANA LUCÍA',
    apellidos: 'SALAZAR MENDIETA',
    foto: undefined,
    telefonoPrincipal: '0987654327',
    telefonoSecundario: undefined,
    direccion: 'QUITO, ECUADOR',
    fechaCreacion: '2024-01-05T00:00:00Z',
    ultimoLogin: '2024-12-01T07:30:00Z',
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 5,
        rolId: 3,
        fechaAsignacion: '2024-01-05T00:00:00Z',
        activo: true,
        rol: roles[2]
      }
    ]
  },
  {
    id: 6,
    username: 'finanzas',
    email: 'finanzas@gmarm.com',
    nombres: 'ROBERTO ANTONIO',
    apellidos: 'HERRERA CASTILLO',
    foto: undefined,
    telefonoPrincipal: '0987654328',
    telefonoSecundario: '0987654329',
    direccion: 'QUITO, ECUADOR',
    fechaCreacion: '2024-01-08T00:00:00Z',
    ultimoLogin: '2024-12-01T06:15:00Z',
    estado: 'ACTIVO',
    intentosLogin: 0,
    ultimoIntento: undefined,
    bloqueado: false,
    roles: [
      {
        usuarioId: 6,
        rolId: 4,
        fechaAsignacion: '2024-01-08T00:00:00Z',
        activo: true,
        rol: roles[3]
      }
    ]
  }
]; 