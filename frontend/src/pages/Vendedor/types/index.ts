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
  fechaNacimiento?: string; // Fecha de nacimiento para validación de edad (opcional desde API)
  direccion?: string; // Dirección (opcional desde API)
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  
  // Campos de tipo de cliente e identificación (con IDs y nombres)
  tipoClienteId?: number;
  tipoClienteNombre?: string;
  tipoClienteCodigo?: string;
  tipoProcesoNombre?: string; // Nombre del tipo de proceso (Cupo Civil, Extracupo Uniformado, etc.)
  tipoIdentificacionId?: number;
  tipoIdentificacionNombre?: string;
  
  // Banderas dinámicas del tipo de cliente (para trazabilidad)
  tipoClienteEsMilitar?: boolean;
  tipoClienteEsPolicia?: boolean;
  tipoClienteEsEmpresa?: boolean;
  tipoClienteEsDeportista?: boolean;
  tipoClienteEsCivil?: boolean;
  tipoClienteRequiereIssfa?: boolean;
  tipoClienteTipoProcesoId?: number;
  
  // Mantener compatibilidad con el código existente
  tipoCliente?: string; // Alias para tipoClienteNombre
  tipoIdentificacion?: string; // Alias para tipoIdentificacionNombre
  
  estadoMilitar?: 'ACTIVO' | 'PASIVO';
  codigoIssfa?: string;
  rango?: string;
  
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
  
  // Estado del cliente (calculado de manera consistente en el backend)
  estado?: 'ACTIVO' | 'FALTAN_DOCUMENTOS' | 'PENDIENTE_DOCUMENTOS' | 'EN_PROCESO' | 'BLOQUEADO' | 'LISTO_IMPORTACION' | 'INACTIVO' | 'PENDIENTE_ASIGNACION_CLIENTE' | 'INHABILITADO_COMPRA' | 'RECHAZADO' | 'CANCELADO' | 'APROBADO' | 'CONTRATO_ENVIADO' | 'CONTRATO_FIRMADO' | 'PROCESO_COMPLETADO';
  estadoPago?: string; // IMPAGO, ABONADO, PAGO_COMPLETO
  grupoImportacionNombre?: string; // Nombre del grupo de importación activo
  licenciaNombre?: string; // Nombre de la licencia del grupo de importación
  licenciaNumero?: string; // Número de la licencia del grupo de importación
  emailVerificado?: boolean | null; // true = Validado, false = Datos incorrectos, null/undefined = Pendiente
  
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
  status?: 'pending' | 'approved' | 'rejected';
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
  modelo: string;
  codigo: string;
  color?: string;
  calibre: string;
  categoriaNombre: string;
  precioReferencia: number;
  urlImagen?: string;
  disponible?: boolean;
  precioModificado?: number; // Para el precio modificable
  // Información de stock
  cantidadTotal?: number;
  cantidadDisponible?: number;
  tieneStock?: boolean;
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