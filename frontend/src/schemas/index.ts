// ===== JSON SCHEMAS PARA VALIDACIÓN DE DATOS =====

// Schema base para respuestas de API
export const ApiResponseSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { type: 'object' },
    message: { type: 'string' },
    errors: { 
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['success', 'data']
};

// ===== AUTENTICACIÓN =====

export const LoginRequestSchema = {
  type: 'object',
  properties: {
    email: { 
      type: 'string',
      format: 'email',
      minLength: 1,
      maxLength: 255
    },
    password: { 
      type: 'string',
      minLength: 6,
      maxLength: 100
    }
  },
  required: ['email', 'password'],
  additionalProperties: false
};

// ===== USUARIOS =====

export const UpdateProfileRequestSchema = {
  type: 'object',
  properties: {
    nombre: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    apellido: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    email: { 
      type: 'string',
      format: 'email',
      maxLength: 255
    }
  },
  additionalProperties: false
};

// ===== CLIENTES =====

export const CreateClientRequestSchema = {
  type: 'object',
  properties: {
    cedula: { 
      type: 'string',
      pattern: '^[0-9]{10}$',
      description: 'Cédula ecuatoriana de 10 dígitos'
    },
    nombres: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    apellidos: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    email: { 
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    direccion: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    telefonoPrincipal: { 
      type: 'string',
      pattern: '^[0-9]{10}$',
      description: 'Teléfono de 10 dígitos'
    },
    telefonoSecundario: { 
      type: 'string',
      pattern: '^[0-9]{10}$',
      description: 'Teléfono de 10 dígitos (opcional)'
    },
    tipoCliente: { 
      type: 'string',
      enum: ['Civil', 'Uniformado', 'Compañía de Seguridad']
    },
    tipoIdentificacion: { 
      type: 'string',
      enum: ['Cédula', 'RUC']
    },
    estadoUniformado: { 
      type: 'string',
      enum: ['Activo', 'Pasivo']
    },
    provincia: { 
      type: 'string',
      minLength: 1
    },
    canton: { 
      type: 'string',
      minLength: 1
    },
    // Campos específicos para Compañía de Seguridad
    ruc: { 
      type: 'string',
      pattern: '^[0-9]{13}$',
      description: 'RUC de 13 dígitos'
    },
    telefonoReferencia: { 
      type: 'string',
      pattern: '^[0-9]{10}$',
      description: 'Teléfono de referencia de 10 dígitos'
    },
    direccionFiscal: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    correoElectronico: { 
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    provinciaCompania: { 
      type: 'string',
      minLength: 1
    },
    cantonCompania: { 
      type: 'string',
      minLength: 1
    }
  },
  required: [
    'cedula', 'nombres', 'apellidos', 'email', 'direccion', 
    'telefonoPrincipal', 'tipoCliente', 'tipoIdentificacion',
    'provincia', 'canton'
  ],
  allOf: [
    {
      if: {
        properties: { tipoCliente: { const: 'Uniformado' } }
      },
      then: {
        required: ['estadoUniformado']
      }
    },
    {
      if: {
        properties: { tipoCliente: { const: 'Compañía de Seguridad' } }
      },
      then: {
        required: [
          'ruc', 'telefonoReferencia', 'direccionFiscal', 
          'correoElectronico', 'provinciaCompania', 'cantonCompania'
        ]
      }
    }
  ],
  additionalProperties: false
};

export const UpdateClientRequestSchema = {
  type: 'object',
  properties: {
    cedula: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    nombres: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    apellidos: { 
      type: 'string',
      minLength: 2,
      maxLength: 100,
      pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$'
    },
    email: { 
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    direccion: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    telefonoPrincipal: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    telefonoSecundario: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    tipoCliente: { 
      type: 'string',
      enum: ['Civil', 'Uniformado', 'Compañía de Seguridad']
    },
    tipoIdentificacion: { 
      type: 'string',
      enum: ['Cédula', 'RUC']
    },
    estadoUniformado: { 
      type: 'string',
      enum: ['Activo', 'Pasivo']
    },
    provincia: { 
      type: 'string',
      minLength: 1
    },
    canton: { 
      type: 'string',
      minLength: 1
    },
    ruc: { 
      type: 'string',
      pattern: '^[0-9]{13}$'
    },
    telefonoReferencia: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    direccionFiscal: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    correoElectronico: { 
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    provinciaCompania: { 
      type: 'string',
      minLength: 1
    },
    cantonCompania: { 
      type: 'string',
      minLength: 1
    }
  },
  additionalProperties: false
};

export const CheckCedulaRequestSchema = {
  type: 'object',
  properties: {
    cedula: { 
      type: 'string',
      pattern: '^[0-9]{10}$',
      required: true
    },
    excludeId: { 
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['cedula'],
  additionalProperties: false
};

// ===== ARMAS =====

export const AssignWeaponRequestSchema = {
  type: 'object',
  properties: {
    weaponId: { 
      type: 'string',
      format: 'uuid'
    },
    price: { 
      type: 'number',
      minimum: 0,
      maximum: 999999.99,
      multipleOf: 0.01
    },
    quantity: { 
      type: 'integer',
      minimum: 1,
      maximum: 999,
      default: 1
    }
  },
  required: ['weaponId', 'price'],
  additionalProperties: false
};

export const UpdateWeaponPriceRequestSchema = {
  type: 'object',
  properties: {
    price: { 
      type: 'number',
      minimum: 0,
      maximum: 999999.99,
      multipleOf: 0.01
    }
  },
  required: ['price'],
  additionalProperties: false
};

// ===== CATÁLOGOS =====

export const ClientTypeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    order: { type: 'integer', minimum: 0 }
  },
  required: ['id', 'name', 'label', 'order']
};

export const IdentificationTypeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    label: { type: 'string', minLength: 1 },
    maxLength: { type: 'integer', minimum: 1 },
    pattern: { type: 'string' }
  },
  required: ['id', 'name', 'label', 'maxLength']
};

export const ProvinceSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    code: { type: 'string', minLength: 1, maxLength: 10 }
  },
  required: ['id', 'name', 'code']
};

export const CantonSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    name: { type: 'string', minLength: 1 },
    provinceId: { type: 'string', format: 'uuid' },
    code: { type: 'string', minLength: 1, maxLength: 10 }
  },
  required: ['id', 'name', 'provinceId', 'code']
};

// ===== DOCUMENTOS =====

export const UploadDocumentRequestSchema = {
  type: 'object',
  properties: {
    file: { 
      type: 'object',
      properties: {
        name: { type: 'string' },
        size: { type: 'number', maximum: 10485760 }, // 10MB max
        type: { 
          type: 'string',
          pattern: '^(application/pdf|image/(jpeg|png|jpg))$'
        }
      },
      required: ['name', 'size', 'type']
    },
    documentTypeId: { 
      type: 'string',
      format: 'uuid'
    }
  },
  required: ['file', 'documentTypeId'],
  additionalProperties: false
};

// ===== PREGUNTAS =====

export const SaveAnswersRequestSchema = {
  type: 'object',
  properties: {
    answers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questionId: { type: 'string', format: 'uuid' },
          answer: { 
            type: 'string',
            minLength: 1,
            maxLength: 1000
          }
        },
        required: ['questionId', 'answer']
      },
      minItems: 1
    }
  },
  required: ['answers'],
  additionalProperties: false
};

// ===== REPORTES =====

export const SalesReportRequestSchema = {
  type: 'object',
  properties: {
    startDate: { 
      type: 'string',
      format: 'date',
      description: 'Fecha de inicio (YYYY-MM-DD)'
    },
    endDate: { 
      type: 'string',
      format: 'date',
      description: 'Fecha de fin (YYYY-MM-DD)'
    }
  },
  required: ['startDate', 'endDate'],
  additionalProperties: false
};

// ===== SCHEMAS DE RESPUESTA =====

export const ClientResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    cedula: { type: 'string', pattern: '^[0-9]{10}$' },
    nombres: { type: 'string' },
    apellidos: { type: 'string' },
    email: { type: 'string', format: 'email' },
    direccion: { type: 'string' },
    telefonoPrincipal: { type: 'string' },
    telefonoSecundario: { type: 'string' },
    tipoCliente: { type: 'string' },
    tipoIdentificacion: { type: 'string' },
    estadoUniformado: { type: 'string' },
    ruc: { type: 'string' },
    telefonoReferencia: { type: 'string' },
    direccionFiscal: { type: 'string' },
    correoElectronico: { type: 'string' },
    provincia: { type: 'string' },
    canton: { type: 'string' },
    provinciaCompania: { type: 'string' },
    cantonCompania: { type: 'string' },
    vendedorId: { type: 'string', format: 'uuid' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'cedula', 'nombres', 'apellidos', 'email', 'direccion', 'telefonoPrincipal', 'tipoCliente', 'tipoIdentificacion', 'vendedorId', 'createdAt', 'updatedAt']
};

export const WeaponResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    modelo: { type: 'string' },
    calibre: { type: 'string' },
    capacidad: { type: 'integer', minimum: 1 },
    precio: { type: 'number', minimum: 0 },
    imagen: { type: 'string' },
    disponible: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'modelo', 'calibre', 'capacidad', 'precio', 'disponible', 'createdAt', 'updatedAt']
};

export const RoleSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    nombre: { type: 'string', minLength: 1, maxLength: 50 },
    descripcion: { type: 'string', minLength: 1 },
    tipoRolVendedor: { type: 'string', enum: ['FIJO', 'LIBRE'] },
    estado: { type: 'boolean' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  },
  required: ['id', 'nombre', 'descripcion', 'estado']
};

export const CreateRoleRequestSchema = {
  type: 'object',
  properties: {
    nombre: { type: 'string', minLength: 1, maxLength: 50 },
    descripcion: { type: 'string', minLength: 1 },
    tipoRolVendedor: { type: 'string', enum: ['FIJO', 'LIBRE'] },
    estado: { type: 'boolean', default: true }
  },
  required: ['nombre', 'descripcion'],
  additionalProperties: false
};

export const UpdateRoleRequestSchema = {
  type: 'object',
  properties: {
    nombre: { type: 'string', minLength: 1, maxLength: 50 },
    descripcion: { type: 'string', minLength: 1 },
    tipoRolVendedor: { type: 'string', enum: ['FIJO', 'LIBRE'] },
    estado: { type: 'boolean' }
  },
  additionalProperties: false
};

export const UserResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    username: { type: 'string', minLength: 1, maxLength: 50 },
    email: { type: 'string', format: 'email' },
    nombres: { type: 'string', minLength: 1, maxLength: 100 },
    apellidos: { type: 'string', minLength: 1, maxLength: 100 },
    foto: { type: 'string' },
    telefonoPrincipal: { type: 'string', pattern: '^[0-9]{10}$' },
    telefonoSecundario: { type: 'string', pattern: '^[0-9]{10}$' },
    direccion: { type: 'string', minLength: 1, maxLength: 255 },
    fechaCreacion: { type: 'string', format: 'date-time' },
    ultimoLogin: { type: 'string', format: 'date-time' },
    estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] },
    intentosLogin: { type: 'integer', minimum: 0 },
    ultimoIntento: { type: 'string', format: 'date-time' },
    bloqueado: { type: 'boolean' },
    roles: {
      type: 'array',
      items: { $ref: '#/definitions/UserRole' }
    }
  },
  required: ['id', 'username', 'email', 'nombres', 'apellidos', 'telefonoPrincipal', 'direccion', 'fechaCreacion', 'estado', 'intentosLogin', 'bloqueado']
};

export const CreateUserRequestSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
    email: { type: 'string', format: 'email', maxLength: 100 },
    password: { type: 'string', minLength: 8, maxLength: 100 },
    nombres: { type: 'string', minLength: 1, maxLength: 100, pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$' },
    apellidos: { type: 'string', minLength: 1, maxLength: 100, pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$' },
    foto: { type: 'string' },
    telefonoPrincipal: { type: 'string', pattern: '^[0-9]{10}$' },
    telefonoSecundario: { type: 'string', pattern: '^[0-9]{10}$' },
    direccion: { type: 'string', minLength: 1, maxLength: 255 },
    roles: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      minItems: 1
    }
  },
  required: ['username', 'email', 'password', 'nombres', 'apellidos', 'telefonoPrincipal', 'direccion', 'roles'],
  additionalProperties: false
};

export const UpdateUserRequestSchema = {
  type: 'object',
  properties: {
    username: { type: 'string', minLength: 3, maxLength: 50, pattern: '^[a-zA-Z0-9_]+$' },
    email: { type: 'string', format: 'email', maxLength: 100 },
    nombres: { type: 'string', minLength: 1, maxLength: 100, pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$' },
    apellidos: { type: 'string', minLength: 1, maxLength: 100, pattern: '^[a-zA-ZáéíóúÁÉÍÓÚñÑ\\s]+$' },
    foto: { type: 'string' },
    telefonoPrincipal: { type: 'string', pattern: '^[0-9]{10}$' },
    telefonoSecundario: { type: 'string', pattern: '^[0-9]{10}$' },
    direccion: { type: 'string', minLength: 1, maxLength: 255 },
    estado: { type: 'string', enum: ['ACTIVO', 'INACTIVO', 'BLOQUEADO'] },
    roles: {
      type: 'array',
      items: { type: 'integer', minimum: 1 },
      minItems: 1
    }
  },
  additionalProperties: false
};

export const ChangePasswordRequestSchema = {
  type: 'object',
  properties: {
    currentPassword: { type: 'string', minLength: 1 },
    newPassword: { type: 'string', minLength: 8, maxLength: 100 },
    confirmPassword: { type: 'string', minLength: 8, maxLength: 100 }
  },
  required: ['currentPassword', 'newPassword', 'confirmPassword'],
  additionalProperties: false
};

// ===== SCHEMAS PARA VALIDACIÓN DE FORMULARIOS =====

export const ClientFormSchema = {
  type: 'object',
  properties: {
    tipoCliente: { 
      type: 'string',
      enum: ['Civil', 'Uniformado', 'Compañía de Seguridad']
    },
    tipoIdentificacion: { 
      type: 'string',
      enum: ['Cédula', 'RUC']
    },
    cedula: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    apellidos: { 
      type: 'string',
      minLength: 2,
      maxLength: 100
    },
    nombres: { 
      type: 'string',
      minLength: 2,
      maxLength: 100
    },
    email: { 
      type: 'string',
      format: 'email'
    },
    provincia: { 
      type: 'string',
      minLength: 1
    },
    canton: { 
      type: 'string',
      minLength: 1
    },
    direccion: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    telefonoPrincipal: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    telefonoSecundario: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    },
    estadoUniformado: { 
      type: 'string',
      enum: ['Activo', 'Pasivo']
    },
    // Campos de empresa
    ruc: { 
      type: 'string',
      pattern: '^[0-9]{13}$'
    },
    correoElectronico: { 
      type: 'string',
      format: 'email'
    },
    provinciaCompania: { 
      type: 'string',
      minLength: 1
    },
    cantonCompania: { 
      type: 'string',
      minLength: 1
    },
    direccionFiscal: { 
      type: 'string',
      minLength: 10,
      maxLength: 500
    },
    telefonoReferencia: { 
      type: 'string',
      pattern: '^[0-9]{10}$'
    }
  },
  required: [
    'tipoCliente', 'tipoIdentificacion', 'cedula', 'apellidos', 'nombres',
    'email', 'provincia', 'canton', 'direccion', 'telefonoPrincipal'
  ],
  allOf: [
    {
      if: {
        properties: { tipoCliente: { const: 'Uniformado' } }
      },
      then: {
        required: ['estadoUniformado']
      }
    },
    {
      if: {
        properties: { tipoCliente: { const: 'Compañía de Seguridad' } }
      },
      then: {
        required: [
          'ruc', 'correoElectronico', 'provinciaCompania', 'cantonCompania',
          'direccionFiscal', 'telefonoReferencia'
        ]
      }
    }
  ]
};

// ===== EXPORTACIÓN DE TODOS LOS SCHEMAS =====

export const Schemas = {
  // Autenticación
  LoginRequest: LoginRequestSchema,
  ChangePasswordRequest: ChangePasswordRequestSchema,
  
  // Usuarios
  UpdateProfileRequest: UpdateProfileRequestSchema,
  CreateUserRequest: CreateUserRequestSchema,
  UpdateUserRequest: UpdateUserRequestSchema,
  UserResponse: UserResponseSchema,
  
  // Roles
  Role: RoleSchema,
  CreateRoleRequest: CreateRoleRequestSchema,
  UpdateRoleRequest: UpdateRoleRequestSchema,
  
  // Clientes
  CreateClientRequest: CreateClientRequestSchema,
  UpdateClientRequest: UpdateClientRequestSchema,
  CheckCedulaRequest: CheckCedulaRequestSchema,
  ClientResponse: ClientResponseSchema,
  
  // Armas
  AssignWeaponRequest: AssignWeaponRequestSchema,
  UpdateWeaponPriceRequest: UpdateWeaponPriceRequestSchema,
  WeaponResponse: WeaponResponseSchema,
  
  // Catálogos
  ClientType: ClientTypeSchema,
  IdentificationType: IdentificationTypeSchema,
  Province: ProvinceSchema,
  Canton: CantonSchema,
  
  // Documentos
  UploadDocumentRequest: UploadDocumentRequestSchema,
  
  // Preguntas
  SaveAnswersRequest: SaveAnswersRequestSchema,
  
  // Reportes
  SalesReportRequest: SalesReportRequestSchema,
  
  // Respuestas
  ApiResponse: ApiResponseSchema,
  
  // Formularios
  ClientForm: ClientFormSchema
} as const; 