import type { Client, Weapon } from './types';

export const clientes: Client[] = [
  {
    id: '1',
    numeroIdentificacion: '1234567890',
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
    vendedorId: 'vendedor-1'
  },
  {
    id: '2',
    numeroIdentificacion: '1712345678',
    nombres: 'MARÍA ELENA',
    apellidos: 'GONZÁLEZ RODRÍGUEZ',
    email: 'maria.gonzalez@email.com',
    fechaNacimiento: '1982-11-15', // 42 años - PUEDE COMPRAR (representante legal)
    provincia: 'Guayas',
    canton: 'Guayaquil',
    direccion: 'AV. 9 DE OCTUBRE N123-456',
    telefonoPrincipal: '0987654324',
    telefonoSecundario: '0987654326',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'Cedula',
    representanteLegal: 'MARÍA ELENA GONZÁLEZ RODRÍGUEZ',
    ruc: '0991234567001',
    nombreEmpresa: 'SEGURIDAD INTEGRAL S.A.',
    direccionFiscal: 'AV. 9 DE OCTUBRE N123-456, OFICINA 45',
    telefonoReferencia: '0987654325',
    correoEmpresa: 'info@seguridadintegral.com',
    provinciaEmpresa: 'Guayas',
    cantonEmpresa: 'Guayaquil',
    vendedorId: 'vendedor-1'
  },
  {
    id: '3',
    numeroIdentificacion: '1723456789',
    nombres: 'ROBERTO ANTONIO',
    apellidos: 'HERRERA CASTILLO',
    email: 'roberto.herrera@email.com',
    fechaNacimiento: '1978-05-20', // 46 años - PUEDE COMPRAR (representante legal)
    provincia: 'Pichincha',
    canton: 'Quito',
    direccion: 'AV. PRINCIPAL N789-012',
    telefonoPrincipal: '0987654327',
    telefonoSecundario: '0987654328',
    tipoCliente: 'Compañía de Seguridad',
    tipoIdentificacion: 'Cedula',
    representanteLegal: 'ROBERTO ANTONIO HERRERA CASTILLO',
    ruc: '0999876543001',
    nombreEmpresa: 'PROTECCIÓN TOTAL S.A.',
    direccionFiscal: 'AV. PRINCIPAL N789-012, EDIFICIO CORPORATIVO',
    telefonoReferencia: '0987654329',
    correoEmpresa: 'contacto@protecciontotal.com',
    provinciaEmpresa: 'Pichincha',
    cantonEmpresa: 'Quito',
    vendedorId: 'vendedor-2'
  },
  {
    id: '4',
    numeroIdentificacion: '1100110011',
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
    estadoMilitar: 'ACTIVO',
    vendedorId: 'vendedor-2'
  },
  {
    id: '5',
    numeroIdentificacion: '0808080808',
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
    vendedorId: 'vendedor-2'
  },
  {
    id: '6',
    numeroIdentificacion: '0505050505',
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
    vendedorId: 'vendedor-1'
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
  '2': null,       // María Elena (Seguridad Integral) sin arma
  '3': null,       // Roberto (Protección Total) sin arma
  '4': weapons[1], // Carlos tiene arma 2
  '5': null,       // Ana sin arma
  '6': null        // Luis sin arma
}; 