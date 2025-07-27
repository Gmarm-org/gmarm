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
  fechaNacimiento: string; // Fecha de nacimiento para validación de edad
  direccion: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  tipoCliente: string;
  tipoIdentificacion: string;
  estadoUniformado?: 'Activo' | 'Pasivo';
  ruc?: string;
  telefonoReferencia?: string;
  direccionFiscal?: string;
  correoElectronico?: string;
  provincia?: string;
  canton?: string;
  provinciaCompania?: string;
  cantonCompania?: string;
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