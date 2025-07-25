export interface LocationData {
  provincia: string;
  cantones: { canton: string; ciudades: string[] }[];
}

export interface Client {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  email: string;
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  ruc?: string;
  telefonoReferencia?: string;
  direccionFiscal?: string;
  correoElectronico?: string;
  provincia?: string;
  canton?: string;
  provinciaCompania?: string;
  cantonCompania?: string;
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