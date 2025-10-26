// ===== USUARIO Y AUTENTICACIÓN =====
export interface Role {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipoRolVendedor?: 'FIJO' | 'LIBRE';
  estado: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRole {
  usuarioId: number;
  rolId: number;
  fechaAsignacion: string;
  activo: boolean;
  rol?: Role;
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  foto?: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  fechaCreacion: string;
  ultimoLogin?: string;
  estado: 'ACTIVO' | 'INACTIVO' | 'BLOQUEADO';
  intentosLogin: number;
  ultimoIntento?: string;
  bloqueado: boolean;
  roles?: UserRole[];
}

// ===== CLIENTE =====
export interface Client {
  id: string;
  numeroIdentificacion: string; // Cédula, RUC, etc.
  nombres: string;
  apellidos: string;
  email: string;
  fechaNacimiento: string; // Fecha de nacimiento para validación de edad
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  
  // Campos de tipo de cliente e identificación (con IDs y nombres)
  tipoClienteId: number;
  tipoClienteNombre: string;
  tipoClienteCodigo: string;
  tipoProcesoNombre: string; // Nombre del tipo de proceso (Cupo Civil, Extracupo Uniformado, etc.)
  tipoIdentificacionId: number;
  tipoIdentificacionNombre: string;
  
  // Banderas dinámicas del tipo de cliente (para trazabilidad)
  tipoClienteEsMilitar?: boolean;
  tipoClienteEsPolicia?: boolean;
  tipoClienteEsEmpresa?: boolean;
  tipoClienteEsDeportista?: boolean;
  tipoClienteEsCivil?: boolean;
  tipoClienteRequiereIssfa?: boolean;
  tipoClienteTipoProcesoId?: number;
  
  // Mantener compatibilidad con el código existente
  tipoCliente: string; // Alias para tipoClienteNombre
  tipoIdentificacion: string; // Alias para tipoIdentificacionNombre
  
  estadoMilitar?: 'ACTIVO' | 'PASIVO';
  codigoIssfa?: string; // Código ISSFA para tipos militares
  rango?: string; // Rango militar/policial (opcional)
  
  // Campos para empresa
  representanteLegal?: string;
  ruc?: string;
  nombreEmpresa?: string;
  direccionFiscal?: string;
  telefonoReferencia?: string;
  correoEmpresa?: string;
  provinciaEmpresa?: string;
  cantonEmpresa?: string;
  
  // Campos de ubicación
  provincia?: string;
  canton?: string;
  vendedorId?: string; // ID del vendedor que creó el cliente
  
  // Estado del cliente
  estado?: string;
  documentos?: Document[];
  respuestas?: ClientAnswer[];
}

// ===== PAGO =====
export interface Pago {
  id: number;
  clienteId: number;
  cliente?: Client;
  planPagoId?: number;
  planPago?: PlanPago; // PlanPago interface si se necesita
  numeroComprobante: string;
  montoTotal: number;
  saldoPendiente: number;
  metodoPago: string;
  fechaPago?: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// ===== PLAN DE PAGO =====
export interface PlanPago {
  id: number;
  clienteId: number;
  montoTotal: number;
  saldoPendiente: number;
  estado: 'ACTIVO' | 'COMPLETADO' | 'CANCELADO';
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// ===== SALDO CLIENTE =====
export interface SaldoCliente {
  clienteId: number;
  saldo: number;
  tieneSaldoPendiente: boolean;
}

// ===== IMAGEN DE ARMA =====
export interface ArmaImagen {
  id: number;
  armaId: number;
  urlImagen: string;
  orden: number;
  esPrincipal: boolean;
  descripcion?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

// ===== ARMA =====
export interface Weapon {
  id: string;
  modelo: string;
  calibre: string;
  capacidad: number;
  precio: number;
  imagen: string;
  imagenes?: ArmaImagen[]; // Múltiples imágenes ordenadas
  imagenPrincipal?: string; // URL de la imagen principal
  disponible: boolean;
  vendedorId?: string; // ID del vendedor que creó la reserva de arma
  clienteId?: string; // ID del cliente asignado (opcional para armas en stock)
  tipoClienteAsignado?: 'CIVIL' | 'UNIFORMADO' | 'COMPANIA_SEGURIDAD' | 'DEPORTISTA'; // Tipo de cliente para el que está reservada
  estado: 'DISPONIBLE' | 'RESERVADA' | 'ASIGNADA' | 'IMPORTADA' | 'CANCELADA';
  enStock: boolean; // Indica si está en stock para asignación a clientes civiles
  createdAt: string;
  updatedAt: string;
}

// ===== ARMA ASIGNADA A CLIENTE =====
export interface ClientWeapon {
  id: string;
  clientId: string;
  weaponId: string;
  weapon: Weapon;
  price: number;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

// ===== DOCUMENTO =====
export interface Document {
  id: string;
  clientId: string;
  documentTypeId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// ===== PREGUNTA Y RESPUESTA =====
export interface Question {
  id: string;
  clientTypeId: string;
  question: string;
  required: boolean;
  order: number;
}

export interface ClientAnswer {
  id: string;
  clientId: string;
  questionId: string;
  question: Question;
  answer: string;
  createdAt: string;
}

// ===== CATÁLOGOS =====
export interface ClientType {
  id: string;
  name: string;
  label: string;
  order: number;
}

export interface IdentificationType {
  id: string;
  name: string;
  label: string;
  maxLength: number;
  pattern?: string;
}

export interface Province {
  id: string;
  name: string;
  code: string;
}

export interface Canton {
  id: string;
  name: string;
  provinceId: string;
  code: string;
}

// ===== REPORTES =====
export interface VendorStats {
  totalClients: number;
  clientsByType: Record<string, number>;
  totalSales: number;
  monthlySales: number;
  activeClients: number;
  pendingDocuments: number;
}

export interface SalesReport {
  clientId: string;
  clientName: string;
  weaponModel: string;
  price: number;
  quantity: number;
  total: number;
  date: string;
}

// ===== PÁGINAS Y MODOS =====
export type Page = 'dashboard' | 'clientForm' | 'reserve' | 'summary' | 'userPhoto' | 'userUpdate' | 'userPassword';
export type ClientFormMode = 'create' | 'view' | 'edit';

// ===== CONTRATOS DE DATOS =====
export interface ContratoCliente {
  id: string;
  nombres: string;
  apellidos: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  cedula: string;
  email: string;
  provincia: string;
  canton: string;
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
}

export interface ContratoCompania {
  ruc: string;
  nombre: string;
  provincia: string;
  canton: string;
  direccionFiscal: string;
  telefonoReferencia: string;
  correoElectronico: string;
}

export interface ContratoArma {
  id: string;
  modelo: string;
  precioBase: number;
  cantidad: number;
  iva: number;
  precioFinal: number;
}

export interface ContratoRegistroCliente {
  cliente: ContratoCliente;
  compania?: ContratoCompania;
  armas: ContratoArma[];
  total: number;
}

// ===== UBICACIÓN =====
export interface LocationData {
  provincia: string;
  cantones: string[];
}

// ===== CONTADORES =====
export interface ClientTypeCount {
  type: string;
  label: string;
  count: number;
}

// ===== API RESPONSES =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

// ===== LOGIN =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    roles: string[];
  };
}

// ===== PAGINATED RESPONSE =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 