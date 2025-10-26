// ========================================
// DATOS MOCK PARA QA - SISTEMA COMPLETO
// ========================================
// ⚠️ DESHABILITADO PARA FASE PILOTO - Solo usar autenticación real del backend

import type { User, Client, Pago, SaldoCliente } from '../types';

// Usuarios mock para diferentes roles - DESHABILITADOS PARA FASE PILOTO
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
          codigo: 'ADMIN',
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
          codigo: 'OPERATIONS',
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
          codigo: 'VENDOR',
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
          codigo: 'FINANCE',
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
          codigo: 'SALES_CHIEF',
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
          codigo: 'VENDOR',
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
    tipoClienteNombre: 'Civil',
    tipoClienteCodigo: 'CIV',
    tipoClienteId: 1,
    tipoProcesoNombre: 'Cupo Civil',
    tipoIdentificacion: 'Cédula',
    tipoIdentificacionNombre: 'Cédula de Identidad',
    tipoIdentificacionId: 1,
    provincia: 'Guayas',
    canton: 'Guayaquil',
    vendedorId: '2',
    documentos: [],
    estado: 'LISTO_IMPORTACION',
    respuestas: [
      {
        id: '1',
        clientId: '1',
        questionId: '1',
        question: {
          id: '1',
          clientTypeId: '1',
          question: '¿Tiene denuncias de violencia de género o intrafamiliar?',
          required: true,
          order: 1
        },
        answer: 'SI',
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
  },
  {
    id: '2',
    numeroIdentificacion: '1712345678',
    nombres: 'María Elena',
    apellidos: 'González Rodríguez',
    email: 'maria.gonzalez@email.com',
    fechaNacimiento: '1982-11-15',
    direccion: 'AV. 9 DE OCTUBRE N123-456',
    tipoClienteCodigo: 'EMP',
    tipoProcesoNombre: 'Extracupo Empresa',
    telefonoPrincipal: '0987654324',
    telefonoSecundario: '0987654326',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'Cédula',
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
    vendedorId: '2',
    tipoClienteId: 2,
    tipoClienteNombre: 'Compañía de Seguridad',
    tipoIdentificacionId: 1,
    tipoIdentificacionNombre: 'Cédula',
    estado: 'FALTAN_DOCUMENTOS',
    documentos: [],
    respuestas: []
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
    tipoClienteNombre: 'Militar Fuerza Terrestre',
    tipoClienteCodigo: 'MIL',
    tipoProcesoNombre: 'Extracupo Uniformado',
    tipoIdentificacion: 'Cédula',
    tipoIdentificacionNombre: 'Cédula de Identidad',
    estadoMilitar: 'ACTIVO',
    provincia: 'Pichincha',
    canton: 'Quito',
    vendedorId: '2',
    tipoClienteId: 3,
    tipoIdentificacionId: 1,
    estado: 'BLOQUEADO',
    documentos: [],
    respuestas: [
      {
        id: '1',
        clientId: '3',
        questionId: '1',
        question: {
          id: '1',
          clientTypeId: '2',
          question: '¿Tiene denuncias de violencia de género o intrafamiliar?',
          required: true,
          order: 1
        },
        answer: 'SI',
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
  },
  {
    id: '4',
    numeroIdentificacion: '1200120012',
    nombres: 'María Elena',
    apellidos: 'Vásquez Morales',
    email: 'maria.vasquez@email.com',
    fechaNacimiento: '1985-08-15',
    direccion: 'CALLE 15 DE AGOSTO N456-789',
    telefonoPrincipal: '0987654329',
    telefonoSecundario: '0987654330',
    tipoCliente: 'Civil',
    tipoClienteNombre: 'Civil',
    tipoClienteCodigo: 'CIV',
    tipoProcesoNombre: 'Cupo Civil',
    tipoIdentificacion: 'Cédula',
    tipoIdentificacionNombre: 'Cédula de Identidad',
    provincia: 'Azuay',
    canton: 'Cuenca',
    vendedorId: '2',
    tipoClienteId: 1,
    tipoIdentificacionId: 1,
    estado: 'BLOQUEADO',
    documentos: [],
    respuestas: [
      {
        id: '1',
        clientId: '4',
        questionId: '1',
        question: {
          id: '1',
          clientTypeId: '1',
          question: '¿Tiene denuncias de violencia de género o intrafamiliar?',
          required: true,
          order: 1
        },
        answer: 'SI',
        createdAt: '2024-01-15T10:30:00Z'
      }
    ]
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
    calibre: '9mm',
    capacidad: 15,
    categoria: 'Pistola',
    precio: 1200.00,
    stock: 5,
    descripcion: 'Pistola semiautomática 9mm',
    imagen: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=300&fit=crop',
    disponible: true
  },
  {
    id: '2',
    nombre: 'Rifle AR-15',
    modelo: 'AR-15',
    calibre: '5.56mm',
    capacidad: 30,
    categoria: 'Rifle',
    precio: 2500.00,
    stock: 3,
    descripcion: 'Rifle semiautomático 5.56mm',
    imagen: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=300&fit=crop',
    disponible: true
  },
  {
    id: '3',
    nombre: 'Escopeta Remington 870',
    modelo: 'Remington 870',
    calibre: '12 gauge',
    capacidad: 6,
    categoria: 'Escopeta',
    precio: 800.00,
    stock: 8,
    descripcion: 'Escopeta de acción de bomba 12 gauge',
    imagen: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=300&fit=crop',
    disponible: true
  },
  {
    id: '4',
    nombre: 'Pistola Sig Sauer P320',
    modelo: 'Sig Sauer P320',
    calibre: '.45 ACP',
    capacidad: 12,
    categoria: 'Pistola',
    precio: 1500.00,
    stock: 4,
    descripcion: 'Pistola semiautomática .45 ACP',
    imagen: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=300&fit=crop',
    disponible: true
  },
  {
    id: '5',
    nombre: 'Rifle AK-47',
    modelo: 'AK-47',
    calibre: '7.62mm',
    capacidad: 30,
    categoria: 'Rifle',
    precio: 1800.00,
    stock: 2,
    descripcion: 'Rifle de asalto 7.62mm',
    imagen: 'https://images.unsplash.com/photo-1544531586-fde5298cdd40?w=400&h=300&fit=crop',
    disponible: true
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

// ========================================
// DOCUMENTOS Y PREGUNTAS DINÁMICAS
// ========================================

// Documentos con links externos (para todos excepto Compañía de Seguridad)
export const mockRequiredDocuments = [
  {
    id: 1,
    nombre: 'Antecedentes Penales',
    descripcion: 'Certificado de antecedentes penales (no tener procesos legales)',
    link: 'https://certificados.ministeriodelinterior.gob.ec/gestorcertificados/antecedentes/',
    obligatorio: true,
    tipo_proceso_id: null // Aplica para todos excepto compañías
  },
  {
    id: 2,
    nombre: 'Consejo de la Judicatura',
    descripcion: 'Certificado de no tener juicios en su contra (no casos de robos, violencia o asesinatos)',
    link: 'https://consultas.funcionjudicial.gob.ec/informacionjudicialindividual/pages/index.jsf#!/',
    obligatorio: true,
    tipo_proceso_id: null // Aplica para todos excepto compañías
  },
  {
    id: 3,
    nombre: 'Fiscalía',
    descripcion: 'Certificado de no tener procesos en su contra (no casos de robos, violencia o asesinatos)',
    link: 'https://www.fiscalia.gob.ec/consulta-de-noticias-del-delito/',
    obligatorio: true,
    tipo_proceso_id: null // Aplica para todos excepto compañías
  },
  {
    id: 4,
    nombre: 'SATJE',
    descripcion: 'Certificado de procesos judiciales',
    link: 'https://procesosjudiciales.funcionjudicial.gob.ec/busqueda-filtros',
    obligatorio: true,
    tipo_proceso_id: null // Aplica para todos excepto compañías
  }
];

// Documentos adicionales por tipo de cliente
export const mockAdditionalDocuments = [
  // Civil (tipo_proceso_id: 1)
  {
    id: 5,
    nombre: 'Copia de cédula',
    descripcion: 'Copia legible de la cédula de identidad',
    obligatorio: true,
    tipo_proceso_id: 1
  },
  {
    id: 6,
    nombre: 'Formulario de solicitud',
    descripcion: 'Formulario completo de solicitud de importación',
    obligatorio: false,
    tipo_proceso_id: 1
  },

  // Uniformado (tipo_proceso_id: 2)
  {
    id: 8,
    nombre: 'Credencial militar',
    descripcion: 'Credencial vigente de institución armada',
    obligatorio: false,
    tipo_proceso_id: 2
  },
  {
    id: 9,
    nombre: 'Certificado de servicio activo',
    descripcion: 'Certificado de servicio activo vigente',
    obligatorio: false,
    tipo_proceso_id: 2
  },
  // Compañía de Seguridad (tipo_proceso_id: 3)
  {
    id: 10,
    nombre: 'Cédula del representante legal',
    descripcion: 'Cédula del representante legal',
    obligatorio: false,
    tipo_proceso_id: 3
  },
  {
    id: 11,
    nombre: 'Nombramiento representante legal',
    descripcion: 'Documento que acredita representación legal',
    obligatorio: false,
    tipo_proceso_id: 3
  },
  {
    id: 12,
    nombre: 'Permiso de funcionamiento',
    descripcion: 'Permiso de funcionamiento vigente',
    obligatorio: false,
    tipo_proceso_id: 3
  },
  // Deportista (tipo_proceso_id: 4)
  {
    id: 13,
    nombre: 'Credencial Club deportista',
    descripcion: 'Credencial de club solo para deportistas',
    obligatorio: false,
    tipo_proceso_id: 4
  }
];

// Preguntas por tipo de cliente
export const mockClientQuestions = [
  // Civil (tipo_proceso_id: 1)
  {
    id: 1,
    tipo_proceso_id: 1,
    pregunta: '¿Tiene cuenta en el Sicoar?',
    obligatoria: true,
    orden: 1,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 2,
    tipo_proceso_id: 1,
    pregunta: '¿La dirección en Sicoar coincide con su domicilio actual?',
    obligatoria: true,
    orden: 2,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 3,
    tipo_proceso_id: 1,
    pregunta: '¿Ha tenido o tiene armas registradas?',
    obligatoria: true,
    orden: 3,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 4,
    tipo_proceso_id: 1,
    pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
    obligatoria: true,
    orden: 4,
    tipo_respuesta: 'SI_NO',
    bloquea_proceso: true,
    mensaje_bloqueo: 'No se puede continuar con el proceso debido a denuncias de violencia de género o intrafamiliar. El cliente será marcado como bloqueado.'
  },
  // Uniformado (tipo_proceso_id: 2)
  {
    id: 5,
    tipo_proceso_id: 2,
    pregunta: '¿Tiene cuenta en el Sicoar?',
    obligatoria: true,
    orden: 1,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 6,
    tipo_proceso_id: 2,
    pregunta: '¿Tiene credencial Ispol o IsFA vigente?',
    obligatoria: true,
    orden: 2,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 7,
    tipo_proceso_id: 2,
    pregunta: '¿Ya tiene firma electrónica habilitada?',
    obligatoria: true,
    orden: 3,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 8,
    tipo_proceso_id: 2,
    pregunta: '¿Tiene certificado de servicio activo?',
    obligatoria: false,
    orden: 4,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 9,
    tipo_proceso_id: 2,
    pregunta: '¿Ha tenido o tiene armas registradas?',
    obligatoria: true,
    orden: 5,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 10,
    tipo_proceso_id: 2,
    pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
    obligatoria: true,
    orden: 6,
    tipo_respuesta: 'SI_NO',
    bloquea_proceso: true,
    mensaje_bloqueo: 'No se puede continuar con el proceso debido a denuncias de violencia de género o intrafamiliar. El cliente será marcado como bloqueado.'
  },
  // Compañía de Seguridad (tipo_proceso_id: 3)
  {
    id: 11,
    tipo_proceso_id: 3,
    pregunta: 'Nombramiento del representante legal',
    obligatoria: true,
    orden: 1,
    tipo_respuesta: 'TEXTO'
  },
  {
    id: 12,
    tipo_proceso_id: 3,
    pregunta: 'Permiso de operaciones vigente',
    obligatoria: true,
    orden: 2,
    tipo_respuesta: 'TEXTO'
  },
  {
    id: 13,
    tipo_proceso_id: 3,
    pregunta: 'Autorización de tenencia de armas',
    obligatoria: true,
    orden: 3,
    tipo_respuesta: 'TEXTO'
  },
  // Deportista (tipo_proceso_id: 4)
  {
    id: 14,
    tipo_proceso_id: 4,
    pregunta: '¿Tiene credencial de club deportivo vigente?',
    obligatoria: true,
    orden: 1,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 15,
    tipo_proceso_id: 4,
    pregunta: '¿Participa en competencias oficiales?',
    obligatoria: true,
    orden: 2,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 16,
    tipo_proceso_id: 4,
    pregunta: '¿Ha tenido o tiene armas registradas?',
    obligatoria: true,
    orden: 3,
    tipo_respuesta: 'SI_NO'
  },
  {
    id: 17,
    tipo_proceso_id: 4,
    pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
    obligatoria: true,
    orden: 4,
    tipo_respuesta: 'SI_NO',
    bloquea_proceso: true,
    mensaje_bloqueo: 'No se puede continuar con el proceso debido a denuncias de violencia de género o intrafamiliar. El cliente será marcado como bloqueado.'
  }
];

// Mapeo de tipos de cliente a IDs de proceso
export const clientTypeToProcessId = {
  'Civil': 1,
  'Uniformado': 2,
  'Compañía de Seguridad': 3,
  'Deportista': 4
};

// ========================================
// UTILIDADES
// ======================================== 

// ========================================
// DATOS MOCK PARA LICENCIAS
// ========================================

// Licencias mock con datos reales
export const mockLicencias: any[] = [
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
    descripcion: 'Licencia para importación de armas civiles',
    fechaEmision: '2024-01-15',
    cupoTotal: 25,
    cupoDisponible: 20,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Cliente con antecedentes limpios',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-15T10:30:00Z',
    fechaActualizacion: '2024-01-15T10:30:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
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
    descripcion: 'Licencia para importación de armas civiles',
    fechaEmision: '2024-01-10',
    cupoTotal: 25,
    cupoDisponible: 25,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Cliente con permisos vigentes',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-10T14:20:00Z',
    fechaActualizacion: '2024-01-10T14:20:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
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
    descripcion: 'Licencia para importación de armas civiles',
    fechaEmision: '2024-01-05',
    cupoTotal: 25,
    cupoDisponible: 15,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Cliente con credencial vigente',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-05T09:15:00Z',
    fechaActualizacion: '2024-01-05T09:15:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
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
    descripcion: 'Licencia para empresa de seguridad',
    fechaEmision: '2024-01-20',
    cupoTotal: 25,
    cupoDisponible: 25,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Empresa con permisos vigentes',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-20T16:45:00Z',
    fechaActualizacion: '2024-01-20T16:45:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
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
    descripcion: 'Licencia para importación de armas civiles',
    fechaEmision: '2024-01-25',
    cupoTotal: 25,
    cupoDisponible: 30,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Cliente con antecedentes limpios',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-25T11:30:00Z',
    fechaActualizacion: '2024-01-25T11:30:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
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
    descripcion: 'Licencia para importación de armas civiles',
    fechaEmision: '2024-01-30',
    cupoTotal: 25,
    cupoDisponible: 35,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: 'Cliente con permisos vigentes',
    estado: 'ACTIVA',
    fechaCreacion: '2024-01-30T13:20:00Z',
    fechaActualizacion: '2024-01-30T13:20:00Z',
    usuarioCreador: {
      id: 4,
      nombres: 'Carlos',
      apellidos: 'Rodríguez'
    },
    usuarioActualizador: undefined
  }
]; 