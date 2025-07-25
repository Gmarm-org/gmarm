import type { Client, Weapon } from './types';

export const clientes: Client[] = [
  {
    id: '1',
    cedula: '1234567890',
    nombres: 'Juan',
    apellidos: 'Pérez',
    email: 'juan.perez@email.com',
    direccion: 'Calle Principal 123',
    telefonoPrincipal: '0987654321',
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cedula'
  },
  {
    id: '2',
    cedula: '0999999999',
    nombres: 'Seguridad S.A.',
    apellidos: '',
    email: 'contacto@seguridad.com',
    direccion: 'Av. Empresa 456',
    telefonoPrincipal: '022345678',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'RUC'
  },
  {
    id: '3',
    cedula: '1100110011',
    nombres: 'Carlos',
    apellidos: 'Ramírez',
    email: 'c.ramirez@militar.com',
    direccion: 'Base Militar',
    telefonoPrincipal: '099888777',
    tipoCliente: 'Uniformado',
    tipoIdentificacion: 'Cedula'
  },
  {
    id: '4',
    cedula: '0808080808',
    nombres: 'Ana',
    apellidos: 'Gómez',
    email: 'ana.gomez@deporte.com',
    direccion: 'Club Deportivo',
    telefonoPrincipal: '098123456',
    tipoCliente: 'Deportista',
    tipoIdentificacion: 'Cedula'
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