// Tipos compartidos para todos los servicios API

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

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

export interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  foto?: string;
  telefonoPrincipal?: string;
  telefonoSecundario?: string;
  telefono_principal?: string;
  telefono_secundario?: string;
  direccion?: string;
  estado: boolean;
  bloqueado?: boolean;
  ultimo_login?: string;
  intentos_login?: number;
  roles: any[];
}

export interface Client {
  id: number;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  emailVerificado?: boolean | null;
  estadoPago?: string;
  grupoImportacionId?: number;
  grupoImportacionNombre?: string;
  licenciaNombre?: string;
  licenciaNumero?: string;
  telefonoPrincipal: string;
  tipoCliente: string;
  tipoProcesoNombre: string;
  estado: string;
  estadoMilitar?: string;
}

export interface Pago {
  id: number;
  clienteId: number;
  cliente?: Client;
  planPagoId?: number;
  planPago?: PlanPago;
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

export interface PlanPago {
  id: number;
  clienteId: number;
  montoTotal: number;
  saldoPendiente: number;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface GrupoImportacion {
  id: number;
  nombre: string;
  descripcion?: string;
  tra?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  estado: string;
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
  clientesAsignados: number;
}

export interface SaldoCliente {
  clienteId: number;
  saldo: number;
  tieneSaldoPendiente: boolean;
}

export interface Licencia {
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
  observaciones?: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'VENCIDA' | 'SUSPENDIDA';
  fechaCreacion: string;
  fechaActualizacion?: string;
  usuarioCreador?: { id: number; nombres: string; apellidos: string };
  usuarioActualizador?: { id: number; nombres: string; apellidos: string };
}

export interface LicenciaCreateRequest {
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
  observaciones?: string;
  estado?: string;
}

export interface LicenciaSearchParams {
  numeroLicencia?: string;
  tipoLicencia?: string;
  estado?: string;
  page?: number;
  size?: number;
}

// Tipos de adminApi
export interface Weapon {
  id: number;
  modelo: string;
  marca?: string;
  alimentadora?: string;
  color?: string;
  calibre: string;
  capacidad: number;
  precioReferencia: number;
  categoriaId: number;
  categoriaNombre: string;
  estado: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  codigo: string;
  urlImagen?: string;
  urlProducto?: string;
  categoriaCodigo?: string;
}

export interface WeaponCategory {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface License {
  id: number;
  numero: string;
  nombre: string;
  titulo?: string;
  ruc?: string;
  cuenta_bancaria?: string;
  nombre_banco?: string;
  tipo_cuenta?: string;
  cedula_cuenta?: string;
  email?: string;
  telefono?: string;
  provincia?: string;
  canton?: string;
  descripcion?: string;
  fecha_emision?: string;
  observaciones?: string;
  estado: boolean;
  estado_ocupacion?: string;
  fecha_vencimiento?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface Role {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
  tipo_rol_vendedor?: string;
}

export interface ClientType {
  id: number;
  nombre: string;
  codigo: string;
  descripcion: string;
  esCivil: boolean;
  esMilitar: boolean;
  esPolicia: boolean;
  esEmpresa: boolean;
  esDeportista: boolean;
  requiereIssfa: boolean;
  estado: boolean;
  fecha_creacion: string;
}

export interface ImportType {
  id: number;
  nombre: string;
  cupo_maximo?: number;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface IdentificationType {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
  fecha_creacion: string;
}

export interface Question {
  id: number;
  pregunta: string;
  obligatoria: boolean;
  orden: number;
  tipoProcesoId: number;
  tipoProcesoNombre: string;
  tipoRespuesta: string;
  estado: boolean;
}

export interface DocumentType {
  id: number;
  nombre: string;
  descripcion: string;
  obligatorio: boolean;
  tipoProcesoId?: number;
  tipoProcesoNombre?: string;
  estado: boolean;
  urlDocumento?: string;
  gruposImportacion?: boolean;
}

export interface ClientImportType {
  id: number;
  tipoClienteId: number;
  tipoClienteNombre: string;
  tipoImportacionId: number;
  tipoImportacionNombre: string;
  cupoMaximo: number;
}

export interface SystemConfig {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  editable: boolean;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface TipoProceso {
  id: number;
  nombre: string;
  codigo: string;
  descripcion?: string;
  estado: boolean;
}
