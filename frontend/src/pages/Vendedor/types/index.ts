export interface LocationData {
  provincia: string;
  cantones: { canton: string; ciudades: string[] }[];
}

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
  tipoCliente: string;
  tipoIdentificacion: string;
  estadoMilitar?: 'ACTIVO' | 'PASIVO';
  
  // Campos para empresa
  representanteLegal?: string;
  ruc?: string;
  nombreEmpresa?: string;
  direccionFiscal?: string;
  telefonoReferencia?: string;
  correoEmpresa?: string;
  provinciaEmpresa?: string;
  cantonEmpresa?: string;
  
  // Campos generales
  provincia?: string;
  canton?: string;
  vendedorId?: string; // ID del vendedor que creó el cliente
  
  // Documentos y preguntas
  documentos?: Documento[];
  respuestas?: Respuesta[];
}

export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  requerido: boolean;
  subido: boolean;
  archivo?: File;
}

export interface Respuesta {
  id: string;
  pregunta: string;
  respuesta: string;
  tipo: string;
}

export interface Weapon {
  id: string;
  nombre: string;
  codigo: string;
  calibre: string;
  categoriaNombre: string;
  precioReferencia: number;
  urlImagen?: string;
  disponible?: boolean;
  precioModificado?: number; // Para el precio modificable
}

export interface WeaponReservation {
  id: string;
  weaponId: string;
  clientId?: string; // Opcional para armas sin cliente
  cantidad: number;
  precioUnitario: number;
  iva: number;
  total: number;
  fechaReserva: string;
}

export type Page = 'dashboard' | 'clientForm' | 'reserve' | 'summary' | 'userPhoto' | 'userUpdate' | 'userPassword' | 'weaponSelection' | 'documents' | 'questions' | 'profile';
export type ClientFormMode = 'create' | 'view' | 'edit';

export interface ClientTypeCount {
  type: string;
  label: string;
  count: number;
}

export interface ClientType {
  id: number;
  nombre: string;
  codigo: string;
}

export interface IdentificationType {
  id: number;
  nombre: string;
  codigo: string;
} 