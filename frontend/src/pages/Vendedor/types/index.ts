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
}

export interface Weapon {
  id: string;
  modelo: string;
  calibre: string;
  capacidad: number;
  precio: number;
  imagen: string;
  disponible: boolean;
}

export type Page = 'dashboard' | 'clientForm' | 'reserve' | 'summary' | 'userPhoto' | 'userUpdate' | 'userPassword';
export type ClientFormMode = 'create' | 'view' | 'edit';

export interface ClientTypeCount {
  type: string;
  label: string;
  count: number;
} 