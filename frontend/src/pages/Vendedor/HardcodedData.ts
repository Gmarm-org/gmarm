// ========================================
// DATOS MOCK ESPECÍFICOS PARA VENDEDOR
// ========================================

import type { Client, Weapon } from './types';

// Clientes mock con la estructura correcta para el formulario
// TEMPORALMENTE COMENTADO PARA FORZAR USO DE API REAL
/*
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
    tipoIdentificacion: 'Cédula',
    provincia: 'Guayas',
    canton: 'Guayaquil',
    vendedorId: '2',
    documentos: [],
    respuestas: [
      {
        id: '1',
        pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
        respuesta: 'NO',
        tipo: 'TEXTO'
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
    tipoIdentificacion: 'Cédula',
    estadoMilitar: 'ACTIVO',
    provincia: 'Pichincha',
    canton: 'Quito',
    vendedorId: '2',
    documentos: [],
    respuestas: [
      {
        id: '1',
        pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
        respuesta: 'NO',
        tipo: 'TEXTO'
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
    tipoIdentificacion: 'Cédula',
    provincia: 'Azuay',
    canton: 'Cuenca',
    vendedorId: '2',
    documentos: [],
    respuestas: []
  },
  {
    id: '5',
    numeroIdentificacion: '1300130013',
    nombres: 'Carlos Alberto',
    apellidos: 'Mendoza Silva',
    email: 'carlos.mendoza@email.com',
    fechaNacimiento: '1990-12-10',
    direccion: 'AV. LIBERTAD N321-654',
    telefonoPrincipal: '0987654331',
    telefonoSecundario: '0987654332',
    tipoCliente: 'Deportista',
    tipoIdentificacion: 'Cédula',
    provincia: 'Manabí',
    canton: 'Manta',
    vendedorId: '2',
    documentos: [],
    respuestas: []
  }
];
*/

// Array vacío para forzar uso de API real
export const mockClients: Client[] = [];

// Armas mock - Actualizadas para usar la interfaz Weapon correcta
export const mockWeapons: Weapon[] = [
  {
    id: '1',
    nombre: 'Glock 17',
    codigo: 'GLOCK-17',
    calibre: '9mm',
    categoriaNombre: 'PISTOLA',
    precioReferencia: 1200.00,
    urlImagen: '/images/glock17.jpg',
    disponible: true
  },
  {
    id: '2',
    nombre: 'Beretta 92FS',
    codigo: 'BERETTA-92FS',
    calibre: '9mm',
    categoriaNombre: 'PISTOLA',
    precioReferencia: 1100.00,
    urlImagen: '/images/beretta92fs.jpg',
    disponible: true
  },
  {
    id: '3',
    nombre: 'Sig Sauer P226',
    codigo: 'SIG-P226',
    calibre: '9mm',
    categoriaNombre: 'PISTOLA',
    precioReferencia: 1300.00,
    urlImagen: '/images/sigsauerp226.jpg',
    disponible: true
  },
  {
    id: '4',
    nombre: 'Colt 1911',
    codigo: 'COLT-1911',
    calibre: '.45 ACP',
    categoriaNombre: 'PISTOLA',
    precioReferencia: 1400.00,
    urlImagen: '/images/colt1911.jpg',
    disponible: true
  },
  {
    id: '5',
    nombre: 'Smith & Wesson M&P',
    codigo: 'SW-MP',
    calibre: '9mm',
    categoriaNombre: 'PISTOLA',
    precioReferencia: 1000.00,
    urlImagen: '/images/smithwessonmp.jpg',
    disponible: true
  }
];

// Tipos de cliente
export const clientTypes = [
  { id: 1, nombre: 'Civil', codigo: 'CIVIL' },
  { id: 2, nombre: 'Uniformado', codigo: 'UNIFORMADO' },
  { id: 3, nombre: 'Compañía de Seguridad', codigo: 'COMPANIA_SEGURIDAD' },
  { id: 4, nombre: 'Deportista', codigo: 'DEPORTISTA' }
];

// Tipos de identificación
export const identificationTypes = [
  { id: 1, nombre: 'Cédula', codigo: 'CEDULA' },
  { id: 2, nombre: 'RUC', codigo: 'RUC' },
  { id: 3, nombre: 'Pasaporte', codigo: 'PASAPORTE' }
];

// Provincias de Ecuador
export const ecuadorProvinces = [
  {
    nombre: 'Guayas',
    cantones: [
      { canton: 'Guayaquil', ciudades: ['Guayaquil', 'Durán', 'Samborondón'] },
      { canton: 'Daule', ciudades: ['Daule', 'La Aurora'] },
      { canton: 'Salitre', ciudades: ['Salitre', 'El Retiro'] }
    ]
  },
  {
    nombre: 'Pichincha',
    cantones: [
      { canton: 'Quito', ciudades: ['Quito', 'Cumbayá', 'Tumbaco'] },
      { canton: 'Cayambe', ciudades: ['Cayambe', 'Olmedo'] },
      { canton: 'Mejía', ciudades: ['Machachi', 'Aloasí'] }
    ]
  },
  {
    nombre: 'Azuay',
    cantones: [
      { canton: 'Cuenca', ciudades: ['Cuenca', 'Baños', 'San Joaquín'] },
      { canton: 'Gualaceo', ciudades: ['Gualaceo', 'Jadan'] },
      { canton: 'Paute', ciudades: ['Paute', 'El Valle'] }
    ]
  },
  {
    nombre: 'Manabí',
    cantones: [
      { canton: 'Manta', ciudades: ['Manta', 'San Mateo', 'Tarqui'] },
      { canton: 'Portoviejo', ciudades: ['Portoviejo', 'San Plácido'] },
      { canton: 'Jipijapa', ciudades: ['Jipijapa', 'La América'] }
    ]
  }
];

// Preguntas para clientes
export const clientQuestions = [
  {
    id: '1',
    pregunta: '¿Tiene denuncias de violencia de género o intrafamiliar?',
    tipo: 'TEXTO',
    obligatoria: true,
    orden: 1
  },
  {
    id: '2',
    pregunta: '¿Ha sido condenado por algún delito?',
    tipo: 'TEXTO',
    obligatoria: true,
    orden: 2
  },
  {
    id: '3',
    pregunta: '¿Tiene antecedentes penales?',
    tipo: 'TEXTO',
    obligatoria: true,
    orden: 3
  },
  {
    id: '4',
    pregunta: '¿Está bajo alguna medida cautelar?',
    tipo: 'TEXTO',
    obligatoria: false,
    orden: 4
  }
];

// Documentos requeridos por tipo de cliente
export const requiredDocuments = [
  {
    id: '1',
    nombre: 'Cédula de Identidad',
    tipo: 'IDENTIFICACION',
    requerido: true,
    subido: false
  },
  {
    id: '2',
    nombre: 'Certificado de Antecedentes Penales',
    tipo: 'ANTECEDENTES',
    requerido: true,
    subido: false
  },
  {
    id: '3',
    nombre: 'Certificado de Registro de Armas',
    tipo: 'REGISTRO',
    requerido: true,
    subido: false
  },
  {
    id: '4',
    nombre: 'Certificado Psicológico',
    tipo: 'PSICOLOGICO',
    requerido: true,
    subido: false
  },
  {
    id: '5',
    nombre: 'Certificado de Capacitación',
    tipo: 'CAPACITACION',
    requerido: false,
    subido: false
  }
]; 