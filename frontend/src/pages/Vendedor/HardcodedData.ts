import type { Client, Weapon } from './types';

export const clientes: Client[] = [
  {
    id: '1',
    cedula: '1234567890',
    nombres: 'JUAN',
    apellidos: 'PÉREZ',
    email: 'juan.perez@email.com',
    provincia: 'Pichincha',
    canton: 'Quito',
    direccion: 'CALLE PRINCIPAL 123',
    telefonoPrincipal: '0987654321',
    telefonoSecundario: '022345678',
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cedula',
    vendedorId: 'vendedor-1'
  },
  {
    id: '2',
    cedula: '0999999999',
    nombres: 'SEGURIDAD S.A.',
    apellidos: '',
    email: 'contacto@seguridad.com',
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
    vendedorId: 'vendedor-1'
  },
  {
    id: '3',
    cedula: '1100110011',
    nombres: 'CARLOS',
    apellidos: 'RAMÍREZ',
    email: 'c.ramirez@militar.com',
    provincia: 'Azuay',
    canton: 'Cuenca',
    direccion: 'BASE MILITAR',
    telefonoPrincipal: '099888777',
    telefonoSecundario: '072345678',
    tipoCliente: 'Uniformado',
    tipoIdentificacion: 'Cedula',
    estadoUniformado: 'Activo',
    vendedorId: 'vendedor-2'
  },
  {
    id: '4',
    cedula: '0808080808',
    nombres: 'ANA',
    apellidos: 'GÓMEZ',
    email: 'ana.gomez@deporte.com',
    provincia: 'Manabí',
    canton: 'Manta',
    direccion: 'CLUB DEPORTIVO',
    telefonoPrincipal: '098123456',
    telefonoSecundario: '052345678',
    tipoCliente: 'Deportista',
    tipoIdentificacion: 'Cedula',
    vendedorId: 'vendedor-2'
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
    disponible: true
  },
  {
    id: '2',
    modelo: 'Modelo B',
    calibre: '45',
    capacidad: 15,
    precio: 1200,
    imagen: '/weapon2.png',
    disponible: true
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