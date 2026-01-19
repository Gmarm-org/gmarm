// API Service para comunicación con el backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// Tipos de respuesta
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: number;
    username: string;
    email: string;
    nombres: string;
    apellidos: string;
    roles: string[];
  };
}

export interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  foto?: string;
  telefonoPrincipal?: string;
  telefonoSecundario?: string;
  direccion?: string;
  estado: boolean; // true = ACTIVO, false = INACTIVO
  bloqueado?: boolean;
  ultimo_login?: string;
  intentos_login?: number;
  roles: any[];
}

// Tipos para pagos
export interface Pago {
  id: number;
  clienteId: number;
  cliente?: Client;
  planPagoId?: number;
  planPago?: PlanPago;
  numeroComprobante: string;
  montoTotal: number;
  saldoPendiente: number;
  metodoPago: string;
  fechaPago?: string;
  estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO';
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

// Tipos adicionales
export interface Client {
  id: number;
  numeroIdentificacion: string;
  nombres: string;
  apellidos: string;
  email: string;
  emailVerificado?: boolean | null; // true = Validado, false = Datos incorrectos, null/undefined = Pendiente
  estadoPago?: string; // IMPAGO, ABONADO, PAGO_COMPLETO
  grupoImportacionNombre?: string; // Nombre del grupo de importación activo
  licenciaNombre?: string; // Nombre de la licencia del grupo de importación
  licenciaNumero?: string; // Número de la licencia del grupo de importación
  telefonoPrincipal: string;
  tipoCliente: string;
  tipoProcesoNombre: string; // Nombre del tipo de proceso (Cupo Civil, Extracupo Uniformado, etc.)
  estado: string;
  estadoMilitar?: string; // Estado militar (ACTIVO/PASIVO) para uniformados
}

export interface PlanPago {
  id: number;
  clienteId: number;
  montoTotal: number;
  saldoPendiente: number;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
}

export interface GrupoImportacion {
  id: number;
  nombre: string;
  descripcion?: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  estado: string;
  cuposDisponibles: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  cuposUtilizados: {
    civil: number;
    militar: number;
    empresa: number;
    deportista: number;
  };
  clientesAsignados: number;
}

export interface SaldoCliente {
  clienteId: number;
  saldo: number;
  tieneSaldoPendiente: boolean;
}

// Tipos para Licencias
export interface Licencia {
  id: number;
  numero: string;
  nombre: string;
  ruc?: string;
  cuentaBancaria?: string;
  nombreBanco?: string;
  tipoCuenta?: string;
  cedulaCuenta?: string;
  email?: string;
  telefono?: string;
  fechaVencimiento: string;
  tipoLicencia?: string;
  descripcion?: string;
  fechaEmision?: string;
  cupoTotal?: number;
  cupoDisponible?: number;
  cupoCivil?: number;
  cupoMilitar?: number;
  cupoEmpresa?: number;
  cupoDeportista?: number;
  observaciones?: string;
  estado: 'ACTIVA' | 'INACTIVA' | 'VENCIDA' | 'SUSPENDIDA';
  fechaCreacion: string;
  fechaActualizacion?: string;
  usuarioCreador?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
  usuarioActualizador?: {
    id: number;
    nombres: string;
    apellidos: string;
  };
}

export interface LicenciaCreateRequest {
  numero: string;
  nombre: string;
  ruc?: string;
  cuentaBancaria?: string;
  nombreBanco?: string;
  tipoCuenta?: string;
  cedulaCuenta?: string;
  email?: string;
  telefono?: string;
  fechaVencimiento: string;
  tipoLicencia?: string;
  descripcion?: string;
  fechaEmision?: string;
  cupoTotal?: number;
  cupoCivil?: number;
  cupoMilitar?: number;
  cupoEmpresa?: number;
  cupoDeportista?: number;
  observaciones?: string;
  estado?: string;
}

export interface LicenciaSearchParams {
  numeroLicencia?: string;
  tipoLicencia?: string;
  estado?: string;
  page?: number;
  size?: number;
}

// Clase principal de API
class ApiService {
  private token: string | null = null;

  // Configurar token
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('authToken', token);
  }

  // Obtener token
  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('authToken');
    }
    return this.token;
  }

  // Limpiar token
  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Headers de autorización
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Incluir rol activo si está disponible en localStorage
    const activeRole = localStorage.getItem('activeRole');
    if (activeRole) {
      headers['X-Active-Role'] = activeRole;
    }

    return headers;
  }

  // Método base para requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Obtener headers base
    let headers = this.getAuthHeaders();
    
    // Si es FormData, NO incluir Content-Type (se establece automáticamente)
    if (options.body instanceof FormData) {
      console.log('🔍 API - request - Detectado FormData, eliminando Content-Type');
      // Crear nuevo objeto de headers sin Content-Type
      const newHeaders: Record<string, string> = {};
      Object.entries(headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          newHeaders[key] = value;
        }
      });
      headers = newHeaders;
    }
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
        throw new Error('Sesión expirada');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        // Crear un error con más información para que pueda ser manejado
        const error = new Error(errorData.message || `Error ${response.status}`) as any;
        error.response = response;
        error.responseData = errorData;
        error.status = response.status;
        throw error;
      }

      // Parsear la respuesta como JSON
      try {
        const jsonData = await response.json();
        return jsonData;
      } catch (parseError) {
        // Si falla el parseo pero el status es exitoso (200-299), puede ser que la respuesta esté vacía
        if (response.status >= 200 && response.status < 300) {
          // Verificar si realmente hay contenido
          const contentLength = response.headers.get('content-length');
          if (contentLength === '0' || contentLength === null) {
            // Respuesta vacía pero exitosa, retornar objeto de éxito
            return { success: true } as T;
          }
          // Si hay contenido pero no se puede parsear, puede ser un problema
          console.warn('⚠️ No se pudo parsear la respuesta JSON, pero el status es exitoso:', response.status);
          console.warn('⚠️ Content-Type:', response.headers.get('content-type'));
          console.warn('⚠️ Content-Length:', contentLength);
          // Aún así, si el status es exitoso, asumir que la operación fue exitosa
          return { success: true } as T;
        }
        // Si el status no es exitoso, lanzar el error
        throw parseError;
      }
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ========================================
  // AUTENTICACIÓN
  // ========================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    await this.request('/api/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/refresh', {
      method: 'POST',
    });
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  // ========================================
  // USUARIOS
  // ========================================

  async getUsers(page: number = 0, size: number = 10): Promise<any> {
    return this.request<any>(`/api/usuarios?page=${page}&size=${size}`);
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/api/usuarios/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/api/usuarios/${id}`, { method: 'DELETE' });
  }

  async getVendedores(): Promise<User[]> {
    return this.request<User[]>('/api/usuarios/vendedores');
  }

  async getUserRolesByUserId(userId: number): Promise<any[]> {
    return this.request<any[]>(`/api/usuarios/${userId}/roles`);
  }

  async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.request(`/api/usuarios/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify(roleIds),
    });
  }

  async removeUserRole(userId: number, roleId: number): Promise<void> {
    await this.request(`/api/usuarios/${userId}/roles/${roleId}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // CLIENTES
  // ========================================

  async getClientes(page: number = 0, size: number = 10): Promise<Page<Client>> {
    return this.request<Page<Client>>(`/api/clientes?page=${page}&size=${size}`);
  }

  // Método específico para vendedores - obtiene solo sus clientes
  async getMisClientes(page: number = 0, size: number = 10): Promise<Page<Client>> {
    return this.request<Page<Client>>(`/api/clientes?page=${page}&size=${size}`);
  }

  // Obtener tipos de cliente
  async getTiposCliente(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-cliente');
  }

  // Obtener tipos de identificación
  async getTiposIdentificacion(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-identificacion');
  }

  // Obtener provincias de Ecuador
  async getProvincias(): Promise<string[]> {
    return this.request<string[]>('/api/localizacion/provincias');
  }

  // Obtener provincias completas con códigos
  async getProvinciasCompletas(): Promise<Array<{codigo: string, nombre: string}>> {
    return this.request<Array<{codigo: string, nombre: string}>>('/api/localizacion/provincias-completas');
  }

  // Obtener cantones por provincia
  async getCantones(provincia: string): Promise<string[]> {
    return this.request<string[]>(`/api/localizacion/cantones/${encodeURIComponent(provincia)}`);
  }

  async getCliente(id: number): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`);
  }

  async getClienteById(id: number): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`);
  }

  async createCliente(clienteData: any): Promise<Client> {
    // El backend espera el formato { cliente: {...}, arma: {...}, pago: {...}, etc }
    // Si ya viene con esa estructura, enviar tal cual; si no, envolver en "cliente"
    const requestBody = clienteData.cliente ? clienteData : { cliente: clienteData };
    
    return this.request<Client>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // Buscar o crear el cliente fantasma del vendedor para armas sin cliente
  async buscarOCrearClienteFantasmaVendedor(): Promise<Client> {
    return this.request<Client>('/api/clientes/fantasma-vendedor', {
      method: 'POST',
    });
  }

  async updateCliente(id: number, clienteData: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  }

  async patchCliente(id: number, clienteData: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(clienteData),
    });
  }

  async validarDatosPersonales(id: number): Promise<{ success: boolean; message: string; emailVerificado: boolean }> {
    return this.request<{ success: boolean; message: string; emailVerificado: boolean }>(`/api/clientes/${id}/validar-datos`, {
      method: 'PATCH',
    });
  }

  // Verificación de correo electrónico
  async verifyEmailToken(token: string): Promise<{ success: boolean; message: string; clienteId?: number; email?: string; nombres?: string; apellidos?: string; numeroIdentificacion?: string; tipoIdentificacion?: string; direccion?: string; provincia?: string; canton?: string; fechaNacimiento?: string; telefonoPrincipal?: string; telefonoSecundario?: string }> {
    try {
      return await this.request<{ success: boolean; message: string; clienteId?: number; email?: string; nombres?: string; apellidos?: string; numeroIdentificacion?: string; tipoIdentificacion?: string; direccion?: string; provincia?: string; canton?: string; fechaNacimiento?: string; telefonoPrincipal?: string; telefonoSecundario?: string }>(
        `/api/verification/verify?token=${encodeURIComponent(token)}`,
        {
          method: 'GET',
        }
      );
    } catch (error: any) {
      // Si el backend retornó un error HTTP pero con un JSON válido que contiene success: false
      // Retornarlo como respuesta válida en lugar de lanzar excepción
      if (error?.responseData && typeof error.responseData === 'object' && 'success' in error.responseData) {
        return error.responseData;
      }
      
      // Si el error tiene un mensaje, crear una respuesta con success: false
      return {
        success: false,
        message: error?.message || error?.responseData?.message || 'Error al verificar el token'
      };
    }
  }

  // Obtener información del token sin verificar
  async getTokenInfo(token: string): Promise<any> {
    return this.request<any>(
      `/api/verification/token-info?token=${encodeURIComponent(token)}`,
      {
        method: 'GET',
      }
    );
  }

  async deleteCliente(id: number): Promise<void> {
    await this.request(`/api/clientes/${id}`, { method: 'DELETE' });
  }

  async getClientesPorVendedor(vendedorId: number): Promise<Client[]> {
    return this.request<Client[]>(`/api/clientes/por-vendedor/${vendedorId}`);
  }

  async buscarClientePorIdentificacion(numero: string): Promise<Client> {
    return this.request<Client>(`/api/clientes/por-identificacion/${numero}`);
  }

  async validarIdentificacion(numero: string): Promise<{ existe: boolean; mensaje: string }> {
    return this.request<{ existe: boolean; mensaje: string }>(`/api/clientes/validar-identificacion/${numero}`);
  }

  async cambiarEstadoCliente(id: number, estado: string): Promise<void> {
    await this.request(`/api/clientes/${id}/estado?nuevoEstado=${estado}`, {
      method: 'PUT',
    });
  }

  // ========================================
  // LICENCIAS
  // ========================================

  async getLicencias(page: number = 0, size: number = 10): Promise<Page<Licencia>> {
    return this.request<Page<Licencia>>(`/licencias?page=${page}&size=${size}`);
  }

  async getLicencia(id: number): Promise<Licencia> {
    return this.request<Licencia>(`/licencias/${id}`);
  }

  async createLicencia(licenciaData: LicenciaCreateRequest, usuarioId: number): Promise<Licencia> {
    return this.request<Licencia>(`/licencias?usuarioId=${usuarioId}`, {
      method: 'POST',
      body: JSON.stringify(licenciaData),
    });
  }

  async updateLicencia(id: number, licenciaData: Partial<LicenciaCreateRequest>, usuarioId: number): Promise<Licencia> {
    return this.request<Licencia>(`/licencias/${id}?usuarioId=${usuarioId}`, {
      method: 'PUT',
      body: JSON.stringify(licenciaData),
    });
  }

  async deleteLicencia(id: number): Promise<void> {
    await this.request(`/licencias/${id}`, { method: 'DELETE' });
  }

  async getLicenciasActivas(): Promise<Licencia[]> {
    return this.request<Licencia[]>('/licencias/activas');
  }

  async getLicenciasDisponibles(): Promise<Licencia[]> {
    return this.request<Licencia[]>('/api/licencia/disponibles');
  }

  async getLicenciasConCupoCivil(): Promise<Licencia[]> {
    return this.request<Licencia[]>('/licencias/cupo-civil-disponible');
  }

  async decrementarCupoLicencia(id: number, tipoCliente: string): Promise<void> {
    await this.request(`/licencias/${id}/decrementar-cupo?tipoCliente=${tipoCliente}`, { method: 'POST' });
  }

  async verificarCupoDisponible(id: number, tipoCliente: string): Promise<{ tieneCupo: boolean; cupoDisponible: number }> {
    return this.request<{ tieneCupo: boolean; cupoDisponible: number }>(`/licencias/${id}/tiene-cupo?tipoCliente=${tipoCliente}`);
  }

  async getLicenciasProximasAVencer(dias: number = 30): Promise<Licencia[]> {
    return this.request<Licencia[]>(`/licencias/proximas-vencer?dias=${dias}`);
  }

  async buscarLicencias(params: LicenciaSearchParams): Promise<Page<Licencia>> {
    const queryParams = new URLSearchParams();
    if (params.numeroLicencia) queryParams.append('numeroLicencia', params.numeroLicencia);
    if (params.tipoLicencia) queryParams.append('tipoLicencia', params.tipoLicencia);
    if (params.estado) queryParams.append('estado', params.estado);
    if (params.page !== undefined) queryParams.append('page', params.page.toString());
    if (params.size !== undefined) queryParams.append('size', params.size.toString());
    
    return this.request<Page<Licencia>>(`/licencias/buscar?${queryParams.toString()}`);
  }

  async getEstadisticasLicencias(): Promise<Array<{ estado: string; count: number }>> {
    return this.request<Array<{ estado: string; count: number }>>('/licencias/estadisticas');
  }

  async cambiarEstadoLicencia(id: number, nuevoEstado: string): Promise<void> {
    await this.request(`/licencias/${id}/estado?nuevoEstado=${nuevoEstado}`, { method: 'PUT' });
  }

  // ========================================
  // GRUPOS DE IMPORTACIÓN
  // ========================================

  async getGruposImportacion(page: number = 0, size: number = 10): Promise<ApiResponse<GrupoImportacion[]>> {
    return this.request<ApiResponse<GrupoImportacion[]>>(`/api/grupos-importacion?page=${page}&size=${size}`);
  }

  async getGrupoImportacion(id: number): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>(`/api/grupos-importacion/${id}`);
  }

  async createGrupoImportacion(grupoData: Partial<GrupoImportacion>): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>('/api/grupos-importacion', {
      method: 'POST',
      body: JSON.stringify(grupoData),
    });
  }

  // Crear grupo de importación desde DTO (simplificado)
  async crearGrupoImportacion(dto: {
    nombre: string;
    descripcion?: string;
    codigo?: string;
    licenciaId: number;
    tipoProcesoId?: number;
    fechaInicio?: string;
    fechaFin?: string;
    cupoTotal?: number;
    cupoDisponible?: number;
    observaciones?: string;
    tipoGrupo?: 'CUPO' | 'JUSTIFICATIVO';
    tra?: string;
    vendedores?: Array<{ vendedorId: number; limiteArmas: number }>;
    vendedorIds?: number[]; // Mantener para compatibilidad
    limitesCategoria?: Array<{ categoriaArmaId: number; limiteMaximo: number }>;
  }): Promise<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }> {
    return this.request<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }>('/api/grupos-importacion', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }
  
  async actualizarGrupoImportacion(id: number, dto: {
    nombre?: string;
    descripcion?: string;
    observaciones?: string;
    tipoGrupo?: 'CUPO' | 'JUSTIFICATIVO';
    tra?: string;
    licenciaId?: number; // Permite cambiar la licencia en edición
    vendedores?: Array<{ vendedorId: number; limiteArmas: number }>;
    vendedorIds?: number[]; // Mantener para compatibilidad
    limitesCategoria?: Array<{ categoriaArmaId: number; limiteMaximo: number }>;
  }): Promise<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }> {
    return this.request<{ id: number; nombre: string; codigo: string; tra?: string; tipoGrupo?: string; message: string }>(`/api/grupos-importacion/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(dto),
    });
  }
  
  async getVendedoresParaGrupo(): Promise<Array<{ id: number; nombres: string; apellidos: string; email: string; nombreCompleto: string }>> {
    return this.request<Array<{ id: number; nombres: string; apellidos: string; email: string; nombreCompleto: string }>>('/api/grupos-importacion/vendedores');
  }
  
  async getCategoriasArmasParaGrupo(): Promise<Array<{ id: number; nombre: string; codigo: string; descripcion: string }>> {
    return this.request<Array<{ id: number; nombre: string; codigo: string; descripcion: string }>>('/api/grupos-importacion/categorias-armas');
  }

  async updateGrupoImportacion(id: number, grupoData: Partial<GrupoImportacion>): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>(`/grupos-importacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grupoData),
    });
  }

  async getGruposActivos(): Promise<GrupoImportacion[]> {
    return this.request<GrupoImportacion[]>('/api/grupos-importacion/activos');
  }

  async agregarClienteAGrupo(grupoId: number, clienteId: number): Promise<void> {
    await this.request(`/api/grupos-importacion/${grupoId}/clientes/${clienteId}`, {
      method: 'POST',
    });
  }

  async getClientesDelGrupo(grupoId: number): Promise<any[]> {
    return this.request<any[]>(`/api/grupos-importacion/${grupoId}/clientes`);
  }

  async removerClienteDelGrupo(grupoId: number, clienteId: number): Promise<void> {
    await this.request(`/api/grupos-importacion/${grupoId}/clientes/${clienteId}`, {
      method: 'DELETE',
    });
  }

  async configurarCupo(grupoId: number, tipoCliente: string, cupoAsignado: number): Promise<void> {
    await this.request(`/api/grupos-importacion/${grupoId}/cupos`, {
      method: 'POST',
      body: JSON.stringify({ tipoCliente, cupoAsignado }),
    });
  }

  // ========================================
  // OPERACIONES - GRUPOS DE IMPORTACIÓN
  // ========================================

  async getGruposParaOperaciones(): Promise<GrupoImportacion[]> {
    return this.request<GrupoImportacion[]>('/operaciones/grupos');
  }

  async getGrupoResumen(id: number): Promise<{
    grupoId: number;
    grupoNombre: string;
    grupoCodigo: string;
    clientesCiviles: number;
    clientesUniformados: number;
    clientesEmpresas: number;
    clientesDeportistas: number;
    totalClientes: number;
    fechaUltimaActualizacion: string;
  }> {
    return this.request(`/operaciones/grupos/${id}`);
  }

  async definirPedido(grupoId: number): Promise<{
    message: string;
    documentoId: number;
    nombreArchivo: string;
    rutaArchivo: string;
  }> {
    return this.request(`/api/grupos-importacion/${grupoId}/definir-pedido`, {
      method: 'POST',
    });
  }

  async puedeDefinirPedido(grupoId: number): Promise<{
    puedeDefinir: boolean;
    mensaje: string;
  }> {
    return this.request(`/api/grupos-importacion/${grupoId}/puede-definir-pedido`);
  }

  async getResumenGrupo(grupoId: number): Promise<{
    grupoId: number;
    grupoNombre: string;
    grupoCodigo: string;
    clientesCiviles: number;
    clientesUniformados: number;
    clientesEmpresas: number;
    clientesDeportistas: number;
    totalClientes: number;
    fechaUltimaActualizacion: string;
  }> {
    return this.request(`/api/grupos-importacion/${grupoId}/resumen`);
  }

  async getGruposParaGestionImportaciones(): Promise<Array<{
    grupoId: number;
    grupoNombre: string;
    grupoCodigo: string;
    clientesCiviles: number;
    clientesUniformados: number;
    clientesEmpresas: number;
    clientesDeportistas: number;
    totalClientes: number;
    fechaUltimaActualizacion: string;
  }>> {
    return this.request<Array<{
      grupoId: number;
      grupoNombre: string;
      grupoCodigo: string;
      clientesCiviles: number;
      clientesUniformados: number;
      clientesEmpresas: number;
      clientesDeportistas: number;
      totalClientes: number;
      fechaUltimaActualizacion: string;
    }>>('/api/grupos-importacion/gestion-importaciones');
  }

  async notificarAgenteAduanero(grupoId: number): Promise<{ message: string }> {
    return this.request(`/api/grupos-importacion/${grupoId}/notificar-agente-aduanero`, {
      method: 'PUT',
    });
  }

  async getGruposParaJefeVentas(page: number = 0, size: number = 100, estado?: string, busqueda?: string): Promise<ApiResponse<Array<{
    grupoId: number;
    grupoNombre: string;
    grupoCodigo: string;
    clientesCiviles: number;
    clientesUniformados: number;
    clientesEmpresas: number;
    clientesDeportistas: number;
    totalClientes: number;
    fechaUltimaActualizacion: string;
  }>>> {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());
    if (estado) params.append('estado', estado);
    if (busqueda) params.append('busqueda', busqueda);
    
    return this.request<ApiResponse<Array<{
      grupoId: number;
      grupoNombre: string;
      grupoCodigo: string;
      clientesCiviles: number;
      clientesUniformados: number;
      clientesEmpresas: number;
      clientesDeportistas: number;
      totalClientes: number;
      fechaUltimaActualizacion: string;
    }>>>(`/api/grupos-importacion/jefe-ventas?${params.toString()}`);
  }

  // ========================================
  // OPERACIONES - DOCUMENTOS
  // ========================================

  async cargarDocumentoGrupo(grupoId: number, tipoDocumentoId: number, archivo: File, descripcion?: string): Promise<{
    id: number;
    grupoImportacionId: number;
    tipoDocumentoId: number;
    nombreArchivo: string;
    rutaArchivo: string;
    descripcion?: string;
    estado: string;
    fechaCarga: string;
  }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('tipoDocumentoId', tipoDocumentoId.toString());
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    return this.request(`/operaciones/grupos/${grupoId}/documentos`, {
      method: 'POST',
      body: formData,
      headers: {}, // No establecer Content-Type, el navegador lo hará automáticamente para FormData
    });
  }

  async getDocumentosGrupo(grupoId: number): Promise<Array<{
    id: number;
    grupoImportacionId: number;
    tipoDocumentoId: number;
    tipoDocumentoNombre: string;
    nombreArchivo: string;
    rutaArchivo: string;
    descripcion?: string;
    estado: string;
    fechaCarga: string;
  }>> {
    return this.request(`/operaciones/grupos/${grupoId}/documentos`);
  }

  async eliminarDocumentoGrupo(grupoId: number, documentoId: number): Promise<void> {
    await this.request(`/operaciones/grupos/${grupoId}/documentos/${documentoId}`, {
      method: 'DELETE',
    });
  }

  async notificarPagoFabrica(grupoId: number): Promise<{ message: string }> {
    return this.request(`/operaciones/grupos/${grupoId}/notificar-pago-fabrica`, {
      method: 'POST',
    });
  }

  async puedeNotificarPago(grupoId: number): Promise<{
    puedeNotificar: boolean;
    mensaje: string;
  }> {
    return this.request(`/operaciones/grupos/${grupoId}/puede-notificar-pago`);
  }

  async registrarFechaLlegada(grupoId: number, fechaLlegada: string): Promise<{ message: string }> {
    return this.request(`/operaciones/grupos/${grupoId}/fecha-llegada?fechaLlegada=${fechaLlegada}`, {
      method: 'PUT',
    });
  }

  async registrarNumeroPrevia(grupoId: number, numeroPrevia: string): Promise<{ message: string }> {
    return this.request(`/operaciones/grupos/${grupoId}/numero-previa?numeroPrevia=${encodeURIComponent(numeroPrevia)}`, {
      method: 'PUT',
    });
  }

  // ========================================
  // PAGOS
  // ========================================

  async getPagos(page: number = 0, size: number = 10): Promise<ApiResponse<Pago[]>> {
    return this.request<ApiResponse<Pago[]>>(`/api/pagos?page=${page}&size=${size}`);
  }

  async getPago(id: number): Promise<Pago> {
    return this.request<Pago>(`/api/pagos/${id}`);
  }

  async createPago(pagoData: Partial<Pago>): Promise<Pago> {
    return this.request<Pago>('/api/pagos', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    });
  }

  async getPagosPorCliente(clienteId: number): Promise<Pago[]> {
    return this.request<Pago[]>(`/api/pagos/cliente/${clienteId}`);
  }

  async getSaldoCliente(clienteId: number): Promise<SaldoCliente> {
    return this.request<SaldoCliente>(`/api/pagos/cliente/${clienteId}/saldo`);
  }

  // Obtener cuotas de un pago
  async getCuotasPorPago(pagoId: number): Promise<any[]> {
    return this.request<any[]>(`/api/pagos/${pagoId}/cuotas`);
  }

  // Registrar pago de cuota
  async pagarCuota(
    cuotaId: number, 
    referenciaPago: string, 
    usuarioConfirmadorId: number,
    monto?: number,
    numeroRecibo?: string,
    comprobanteArchivo?: string,
    observaciones?: string
  ): Promise<any> {
    return this.request<any>(`/api/pagos/cuota/${cuotaId}/pagar`, {
      method: 'POST',
      body: JSON.stringify({
        referenciaPago,
        usuarioConfirmadorId,
        monto,
        numeroRecibo,
        comprobanteArchivo,
        observaciones
      })
    });
  }

  async crearCuotaPago(pagoId: number, cuotaData: {
    numeroCuota?: number;
    monto: number;
    fechaVencimiento: string;
    referenciaPago?: string;
  }): Promise<any> {
    return this.request<any>(`/api/pagos/${pagoId}/cuotas`, {
      method: 'POST',
      body: JSON.stringify({
        pagoId,
        ...cuotaData
      })
    });
  }

  async generarRecibo(cuotaId: number): Promise<{ success: boolean; message: string; documentoId: number; nombreArchivo: string }> {
    return this.request<{ success: boolean; message: string; documentoId: number; nombreArchivo: string }>(`/api/pagos/cuota/${cuotaId}/generar-recibo`, {
      method: 'POST',
    });
  }

  async descargarRecibo(cuotaId: number): Promise<void> {
    const token = this.getToken();
    const response = await fetch(`${API_BASE_URL}/api/pagos/cuota/${cuotaId}/descargar-recibo`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al descargar el recibo');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recibo_${cuotaId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  /**
   * Envía recibo por correo
   * El backend obtiene automáticamente los correos desde configuracion_sistema (CORREOS_RECIBO)
   * y agrega el correo del cliente
   * 
   * @param cuotaId ID de la cuota
   * @param emails Opcional: lista de emails adicionales (el backend ya maneja cliente + CORREOS_RECIBO)
   */
  async enviarReciboPorCorreo(cuotaId: number, emails?: string[]): Promise<{ success: boolean; message: string }> {
    const body: any = {};
    // Solo enviar emails si se proporcionan (para compatibilidad o emails adicionales)
    if (emails && emails.length > 0) {
      body.emails = emails;
    }
    return this.request<{ success: boolean; message: string }>(`/api/pagos/cuota/${cuotaId}/enviar-recibo-correo`, {
      method: 'POST',
      body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
    });
  }

  // Obtener usuario actual
  async getMe(): Promise<any> {
    return this.request<any>('/api/auth/me');
  }

  // ========================================
  // ARMAS (REEMPLAZA A MODELOS DE ARMAS)
  // ========================================

  // NOTA: Los métodos de ModeloArma han sido reemplazados por getArmas()

  // ========================================
  // UTILIDADES
  // ========================================

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Obtener roles del usuario actual
  async getUserRoles(): Promise<string[]> {
    try {
      const user = await this.getCurrentUser();
      return user.roles;
    } catch {
      return [];
    }
  }

  // Verificar si el usuario tiene un rol específico
  async hasRole(role: string): Promise<boolean> {
    const roles = await this.getUserRoles();
    return roles.includes(role);
  }

  // Verificar si el usuario tiene alguno de los roles
  async hasAnyRole(roles: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles();
    return roles.some(role => userRoles.includes(role));
  }

  // ========================================
  // FORMULARIO DE CLIENTE
  // ========================================

  // Obtener preguntas y documentos por tipo de cliente
  async getFormularioCliente(tipoClienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-formulario/${tipoClienteId}`);
  }

  // Obtener preguntas y documentos por tipo de cliente y estado militar
  async getFormularioClienteConEstadoMilitar(tipoClienteId: number, estadoMilitar: string): Promise<any> {
    return this.request<any>(`/api/cliente-formulario/${tipoClienteId}/${estadoMilitar}`);
  }

  async getTiposClienteConfig(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/tipos-cliente/config');
  }

  // ========================================
  // CONFIGURACIÓN DEL SISTEMA
  // ========================================

  async getConfiguracion(clave: string): Promise<any> {
    return this.request<any>(`/api/configuracion-sistema/${clave}`);
  }

  async getValorConfiguracion(clave: string): Promise<string> {
    return this.request<string>(`/api/configuracion-sistema/valor/${clave}`);
  }

  async getConfiguracionCompleta(): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('/api/configuracion-sistema');
  }

  // ========================================
  // GESTIÓN DE PREGUNTAS
  // ========================================

  // Obtener todas las preguntas
  async getPreguntas(incluirInactivas: boolean = false): Promise<any[]> {
    const url = incluirInactivas 
      ? '/api/pregunta-cliente?incluirInactivas=true' 
      : '/api/pregunta-cliente';
    return this.request<any[]>(url);
  }

  // Obtener pregunta por ID
  async getPreguntaById(id: number): Promise<any> {
    return this.request<any>(`/api/pregunta-cliente/${id}`);
  }

  // Obtener preguntas por tipo de cliente
  async getPreguntasCliente(tipoClienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/pregunta-cliente/tipo/${tipoClienteId}`);
  }

  // Crear nueva pregunta
  async createPregunta(pregunta: any): Promise<any> {
    return this.request<any>('/api/pregunta-cliente', {
      method: 'POST',
      body: JSON.stringify(pregunta)
    });
  }

  // Actualizar pregunta
  async updatePregunta(id: number, pregunta: any): Promise<any> {
    return this.request<any>(`/api/pregunta-cliente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pregunta)
    });
  }

  // Eliminar pregunta
  async deletePregunta(id: number): Promise<void> {
    return this.request<void>(`/api/pregunta-cliente/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPOS DE DOCUMENTO
  // ========================================

  // Obtener todos los tipos de documento
  async getTiposDocumento(incluirInactivos: boolean = false): Promise<any[]> {
    const url = incluirInactivos 
      ? '/api/tipo-documento?incluirInactivos=true' 
      : '/api/tipo-documento';
    return this.request<any[]>(url);
  }

  // Obtener tipos de documento para grupos de importación
  async getTiposDocumentoGruposImportacion(soloActivos: boolean = true): Promise<any[]> {
    return this.request<any[]>(`/api/tipo-documento/grupos-importacion?soloActivos=${soloActivos}`);
  }

  // Obtener tipo de documento por ID
  async getTipoDocumentoById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-documento/${id}`);
  }

  // Obtener documentos requeridos por tipo de cliente
  async getDocumentosRequeridos(tipoClienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/tipo-documento/tipo-cliente/${tipoClienteId}`);
  }

  // Crear nuevo tipo de documento
  async createTipoDocumento(tipoDocumento: any): Promise<any> {
    return this.request<any>('/api/tipo-documento', {
      method: 'POST',
      body: JSON.stringify(tipoDocumento)
    });
  }

  // Actualizar tipo de documento
  async updateTipoDocumento(id: number, tipoDocumento: any): Promise<any> {
    return this.request<any>(`/api/tipo-documento/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipoDocumento)
    });
  }

  // Eliminar tipo de documento
  async deleteTipoDocumento(id: number): Promise<void> {
    return this.request<void>(`/api/tipo-documento/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPOS DE PROCESO
  // ========================================

  // Obtener todos los tipos de proceso
  async getTiposProceso(): Promise<Array<{
    id: number;
    nombre: string;
    codigo: string;
    descripcion?: string;
    estado: boolean;
  }>> {
    return this.request<Array<{
      id: number;
      nombre: string;
      codigo: string;
      descripcion?: string;
      estado: boolean;
    }>>('/api/tipo-proceso');
  }

  async getTipoProcesoById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-proceso/${id}`);
  }

  // ========================================
  // DOCUMENTOS DE CLIENTE
  // ========================================

  // Cargar documento para un cliente
  async cargarDocumentoCliente(clienteId: number, tipoDocumentoId: number, archivo: File, descripcion?: string): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('clienteId', clienteId.toString());
      formData.append('tipoDocumentoId', tipoDocumentoId.toString());
      formData.append('archivo', archivo);
      
      // Obtener el usuario actual del token JWT
      let currentUser;
      try {
        currentUser = await this.getCurrentUser();
        if (!currentUser || !currentUser.id) {
          throw new Error('No se pudo obtener el usuario actual o el usuario no tiene ID');
        }
        formData.append('usuarioId', currentUser.id.toString());
      } catch (userError: any) {
        console.error('❌ Error obteniendo usuario actual:', userError);
        throw new Error(`No se pudo obtener el usuario actual: ${userError?.message || 'Error desconocido'}`);
      }
      
      if (descripcion) {
        formData.append('descripcion', descripcion);
      }

      return await this.request<any>('/api/documentos-cliente/cargar', {
        method: 'POST',
        body: formData,
        headers: {
          // No incluir Content-Type para FormData
        }
      });
    } catch (error: any) {
      console.error('❌ Error en cargarDocumentoCliente:', error);
      // Re-lanzar el error para que el componente pueda manejarlo
      throw error;
    }
  }

  // Obtener documentos de un cliente
  async getDocumentosCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/documentos-cliente/cliente/${clienteId}`);
  }

  // Obtener documento específico
  async getDocumentoCliente(documentoId: number): Promise<any> {
    return this.request<any>(`/api/documentos-cliente/${documentoId}`);
  }

  // Actualizar documento
  async actualizarDocumentoCliente(documentoId: number, archivo: File, descripcion?: string, usuarioId?: number): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }
    // El backend requiere usuarioId como parámetro
    const userId = usuarioId || 1; // TODO: Obtener del contexto de autenticación
    formData.append('usuarioId', userId.toString());

    return this.request<any>(`/api/documentos-cliente/${documentoId}`, {
      method: 'PUT',
      body: formData,
      headers: {
        // No incluir Content-Type para FormData
      }
    });
  }

  // Eliminar documento
  async eliminarDocumentoCliente(documentoId: number): Promise<boolean> {
    return this.request<boolean>(`/api/documentos-cliente/${documentoId}`, {
      method: 'DELETE'
    });
  }

  // Cambiar estado de documento
  async cambiarEstadoDocumento(documentoId: number, estado: string): Promise<any> {
    return this.request<any>(`/api/documentos-cliente/${documentoId}/estado?estado=${estado}`, {
      method: 'PUT'
    });
  }

  // Verificar si cliente tiene documentos completos
  async verificarDocumentosCompletos(clienteId: number): Promise<boolean> {
    return this.request<boolean>(`/api/documentos-cliente/cliente/${clienteId}/verificar-completos`);
  }

  // Obtener resumen de documentos
  async getResumenDocumentos(clienteId: number): Promise<any> {
    return this.request<any>(`/api/documentos-cliente/cliente/${clienteId}/resumen`);
  }

  // ===== RESPUESTAS DE CLIENTE =====
  
  // Guardar respuesta de cliente
  async guardarRespuestaCliente(clienteId: number, preguntaId: number, respuesta: string, usuarioId: number): Promise<any> {
    return this.request<any>('/api/respuesta-cliente', {
      method: 'POST',
      body: JSON.stringify({
        clienteId,
        preguntaId,
        respuesta,
        usuarioId
      })
    });
  }

  // Obtener respuestas de un cliente
  async getRespuestasCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/respuesta-cliente/cliente/${clienteId}`);
  }

  // ===== PROCESO COMPLETO DE CLIENTE =====
  
  // Verificar estado del proceso del cliente
  async verificarProcesoCliente(clienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-proceso/${clienteId}/verificar`);
  }

  // Completar proceso del cliente y enviar contrato
  async completarProcesoCliente(clienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-proceso/${clienteId}/completar`, {
      method: 'POST'
    });
  }

  // Confirmar inicio del proceso
  async confirmarInicioProceso(clienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-proceso/${clienteId}/confirmar-inicio`, {
      method: 'POST'
    });
  }

  // Obtener elementos faltantes del proceso
  async getElementosFaltantes(clienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-proceso/${clienteId}/elementos-faltantes`);
  }

  // Obtener estado completo del proceso
  async getEstadoProceso(clienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-proceso/${clienteId}/estado`);
  }

  // ========================================
  // GESTIÓN DE ARMAS
  // ========================================

  // Obtener todas las armas
  async getArmas(incluirInactivas: boolean = false): Promise<any[]> {
    try {
      const url = incluirInactivas 
        ? '/api/arma?incluirInactivas=true' 
        : '/api/arma';
      const response = await this.request<any>(url);
      
      if (Array.isArray(response)) {
        return response;
      }
      
      console.error('API Service: Respuesta de armas no es array:', response);
      return [];
      
    } catch (error) {
      console.error('Error obteniendo armas:', error);
      throw error;
    }
  }

  // Obtener arma por ID
  async getArmaById(id: number): Promise<any> {
    return this.request<any>(`/api/arma/${id}`);
  }

  // GESTIÓN DE PAGOS
  // ========================================

  // Crear pago
  async crearPago(pagoData: any): Promise<any> {
    return this.request<any>('/api/pagos', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    });
  }


  // GESTIÓN DE CONTRATOS
  // ========================================

  // Generar y enviar contrato
  async generarYEnviarContrato(clienteId: number, pagoId: number, vendedorId: number): Promise<any> {
    return this.request<any>('/api/contratos/generar-y-enviar', {
      method: 'POST',
      body: JSON.stringify({
        clienteId,
        pagoId,
        vendedorId
      }),
    });
  }

  // Obtener contratos por cliente
  async obtenerContratosPorCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/contratos/cliente/${clienteId}`);
  }

  // Obtener datos del contrato para mostrar en popup
  async obtenerDatosContrato(clienteId: number): Promise<any> {
    return this.request<any>(`/api/clientes/${clienteId}/datos-contrato`);
  }

  // Generar contrato desde la vista del cliente
  async generarContrato(clienteId: number): Promise<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; urlArchivo?: string }> {
    return this.request<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; urlArchivo?: string }>(`/api/clientes/${clienteId}/generar-contrato`, {
      method: 'POST',
    });
  }

  // Cargar contrato firmado
  async cargarContratoFirmado(clienteId: number, archivo: File, documentoId?: number): Promise<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; tipoDocumento?: string }> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (documentoId) {
      formData.append('documentoId', documentoId.toString());
    }
    
    return this.request<{ success: boolean; message: string; documentoId?: number; nombreArchivo?: string; tipoDocumento?: string }>(`/api/clientes/${clienteId}/cargar-contrato-firmado`, {
      method: 'POST',
      body: formData,
      headers: {} // No establecer Content-Type, el navegador lo hará automáticamente con FormData
    });
  }

  // Obtener armas por categoría
  async getArmasByCategoria(categoriaId: number): Promise<any[]> {
    return this.request<any[]>(`/api/arma/categoria/${categoriaId}`);
  }

  // Obtener armas disponibles
  async getArmasDisponibles(): Promise<any[]> {
    return this.request<any[]>('/api/arma/disponibles');
  }

  // ========================================
  // GESTIÓN DE INVENTARIO
  // ========================================

  // Obtener armas con stock disponible
  async getArmasConStock(): Promise<any[]> {
    return this.request<any[]>('/api/inventario/armas-disponibles');
  }

  // Verificar stock de una arma
  async getStockArma(armaId: number): Promise<number> {
    return this.request<number>(`/api/inventario/stock/${armaId}`);
  }

  // Verificar si hay stock suficiente
  async verificarStock(armaId: number, cantidad: number): Promise<boolean> {
    return this.request<boolean>(`/api/inventario/verificar-stock/${armaId}/${cantidad}`);
  }

  // Asignar número de serie a una reserva
  async asignarNumeroSerie(reservaId: number, numeroSerie: string): Promise<any> {
    return this.request<any>(`/api/cliente-arma/${reservaId}/asignar-serie?numeroSerie=${encodeURIComponent(numeroSerie)}`, {
      method: 'PUT'
    });
  }

  // Obtener reservas pendientes para asignación de series
  async getReservasPendientes(): Promise<any[]> {
    return this.request<any[]>('/api/cliente-arma/pendientes');
  }

  // Obtener stock de todas las armas
  async getStockTodasArmas(): Promise<any[]> {
    return this.request<any[]>('/api/inventario/stock/todas');
  }

  // Obtener todos los clientes (con información del vendedor)
  async getTodosClientes(): Promise<any[]> {
    return this.request<any[]>('/api/clientes/todos');
  }

  // Obtener clientes disponibles para asignar a grupos de importación
  async getClientesDisponibles(grupoId?: number): Promise<any[]> {
    const url = grupoId 
      ? `/api/grupos-importacion/clientes-disponibles?grupoId=${grupoId}`
      : '/api/grupos-importacion/clientes-disponibles';
    return this.request<any[]>(url);
  }

  // Obtener categorías de armas
  async getCategoriasArma(): Promise<any[]> {
    return this.request<any[]>('/api/categoria-arma');
  }

  // Crear nueva arma
  async createArma(arma: any): Promise<any> {
    return this.request<any>('/api/arma', {
      method: 'POST',
      body: JSON.stringify(arma)
    });
  }

  // Crear arma con imagen
  async createArmaWithImage(formData: FormData): Promise<any> {
    console.log('🔍 API - createArmaWithImage - Iniciando petición');
    console.log('🔍 API - FormData entries:');
    for (let [key, value] of formData.entries()) {
      console.log(`🔍 API - FormData[${key}]:`, value);
    }
    
    const token = this.getToken();
    console.log('🔍 API - Token disponible:', token ? 'SÍ' : 'NO');
    
    return this.request<any>('/api/arma/with-image', {
      method: 'POST',
      body: formData,
      headers: {
        // Preservar explícitamente el token para FormData
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Actualizar arma
  async updateArma(id: number, arma: any): Promise<any> {
    return this.request<any>(`/api/arma/${id}`, {
      method: 'PUT',
      body: JSON.stringify(arma)
    });
  }

  // Actualizar arma con imagen
  async updateArmaWithImage(id: number, formData: FormData): Promise<any> {
    const token = this.getToken();
    console.log('🔍 API - updateArmaWithImage - Token disponible:', token ? 'SÍ' : 'NO');
    
    return this.request<any>(`/api/arma/${id}/with-image`, {
      method: 'PUT',
      body: formData,
      headers: {
        // Preservar explícitamente el token para FormData
        'Authorization': `Bearer ${token}`
      }
    });
  }

  // Eliminar arma
  async deleteArma(id: number): Promise<void> {
    return this.request<void>(`/api/arma/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE CATEGORÍAS DE ARMAS
  // ========================================

  // Obtener todas las categorías de armas
  async getWeaponCategories(): Promise<any[]> {
    return this.request<any[]>('/api/categoria-arma');
  }

  // Obtener categoría de arma por ID
  async getWeaponCategoryById(id: number): Promise<any> {
    return this.request<any>(`/api/categoria-arma/${id}`);
  }

  // Crear nueva categoría de arma
  async createWeaponCategory(category: any): Promise<any> {
    return this.request<any>('/api/categoria-arma', {
      method: 'POST',
      body: JSON.stringify(category)
    });
  }

  // Actualizar categoría de arma
  async updateWeaponCategory(id: number, category: any): Promise<any> {
    return this.request<any>(`/api/categoria-arma/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category)
    });
  }

  // Eliminar categoría de arma
  async deleteWeaponCategory(id: number): Promise<void> {
    return this.request<void>(`/api/categoria-arma/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE LICENCIAS
  // ========================================

  // Obtener todas las licencias
  async getLicenses(): Promise<any[]> {
    return this.request<any[]>('/api/licencia');
  }

  // Obtener licencia por ID
  async getLicenseById(id: number): Promise<any> {
    return this.request<any>(`/api/licencia/${id}`);
  }

  // Crear nueva licencia
  async createLicense(license: any): Promise<any> {
    return this.request<any>('/api/licencia', {
      method: 'POST',
      body: JSON.stringify(license)
    });
  }

  // Actualizar licencia
  async updateLicense(id: number, license: any): Promise<any> {
    return this.request<any>(`/api/licencia/${id}`, {
      method: 'PUT',
      body: JSON.stringify(license)
    });
  }

  // Eliminar licencia
  async deleteLicense(id: number): Promise<void> {
    return this.request<void>(`/api/licencia/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // CONFIGURACIÓN DEL SISTEMA
  // ========================================

  // Obtener configuración del sistema
  async getConfiguracionSistema(): Promise<any> {
    return this.request<any>('/api/configuracion-sistema');
  }

  // ========================================
  // RESERVAS DE ARMAS
  // ========================================

  // Crear reserva de arma para un cliente
  async crearReservaArma(clienteId: number, armaId: number, cantidad: number, precioUnitario: number, _precioTotal: number): Promise<any> {
    const params = new URLSearchParams({
      clienteId: clienteId.toString(),
      armaId: armaId.toString(),
      cantidad: cantidad.toString(),
      precioUnitario: precioUnitario.toString()
    });
    
    return this.request<any>(`/api/cliente-arma?${params.toString()}`, {
      method: 'POST'
    });
  }

  // Obtener armas reservadas de un cliente
  async getArmasCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/cliente-arma/cliente/${clienteId}`);
  }

  // Actualizar arma en una reserva existente (Jefe de Ventas)
  async actualizarArmaReserva(clienteArmaId: number, nuevaArmaId: number, nuevoPrecioUnitario?: number): Promise<any> {
    const params = new URLSearchParams({
      nuevaArmaId: nuevaArmaId.toString()
    });
    if (nuevoPrecioUnitario !== undefined) {
      params.append('nuevoPrecioUnitario', nuevoPrecioUnitario.toString());
    }
    
    return this.request<any>(`/api/cliente-arma/${clienteArmaId}/actualizar-arma?${params.toString()}`, {
      method: 'PUT'
    });
  }

  // Obtener armas en stock del vendedor (armas asignadas a clientes fantasma)
  async getArmasEnStockVendedor(usuarioId: number): Promise<any[]> {
    return this.request<any[]>(`/api/cliente-arma/stock-vendedor/${usuarioId}`);
  }

  // Reasignar un arma de un cliente a otro (útil para transferir del stock del vendedor a un cliente real)
  async reasignarArmaACliente(clienteArmaId: number, nuevoClienteId: number): Promise<any> {
    return this.request<any>(`/api/cliente-arma/${clienteArmaId}/reasignar/${nuevoClienteId}`, {
      method: 'PUT'
    });
  }

  // Obtener armas con estado REASIGNADO
  async getArmasReasignadas(): Promise<any[]> {
    return this.request<any[]>(`/api/cliente-arma/reasignadas`);
  }

  // Cambiar estado del cliente a DESISTIMIENTO con observación
  async cambiarEstadoDesistimiento(clienteId: number, observacion: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>(`/api/clientes/${clienteId}/estado-desistimiento`, {
      method: 'PATCH',
      body: JSON.stringify({ observacion })
    });
  }

  // Obtener pagos de un cliente
  async getPagosCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/pagos/cliente/${clienteId}`);
  }

  // Obtener contratos de un cliente
  async getContratosCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/contratos/cliente/${clienteId}`);
  }

  // ========================================
  // GESTIÓN DE ROLES
  // ========================================

  // Obtener todos los roles
  async getRoles(): Promise<any[]> {
    return this.request<any[]>('/api/roles');
  }

  // Obtener rol por ID
  async getRoleById(id: number): Promise<any> {
    return this.request<any>(`/api/roles/${id}`);
  }

  // Crear nuevo rol
  async createRole(role: any): Promise<any> {
    return this.request<any>('/api/roles', {
      method: 'POST',
      body: JSON.stringify(role)
    });
  }

  // Actualizar rol
  async updateRole(id: number, role: any): Promise<any> {
    return this.request<any>(`/api/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(role)
    });
  }

  // Eliminar rol
  async deleteRole(id: number): Promise<void> {
    return this.request<void>(`/api/roles/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPOS DE IDENTIFICACIÓN
  // ========================================

  // Obtener todos los tipos de identificación
  async getIdentificationTypes(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-identificacion');
  }

  // Obtener tipo de identificación por ID
  async getIdentificationTypeById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-identificacion/${id}`);
  }

  // Crear nuevo tipo de identificación
  async createIdentificationType(identificationType: any): Promise<any> {
    return this.request<any>('/api/tipo-identificacion', {
      method: 'POST',
      body: JSON.stringify(identificationType)
    });
  }

  // Actualizar tipo de identificación
  async updateIdentificationType(id: number, identificationType: any): Promise<any> {
    return this.request<any>(`/api/tipo-identificacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(identificationType)
    });
  }

  // Eliminar tipo de identificación
  async deleteIdentificationType(id: number): Promise<void> {
    return this.request<void>(`/api/tipo-identificacion/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPOS DE IMPORTACIÓN
  // ========================================

  // Obtener todos los tipos de importación
  async getImportTypes(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-importacion');
  }

  // Obtener tipo de importación por ID
  async getImportTypeById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-importacion/${id}`);
  }

  // Crear nuevo tipo de importación
  async createImportType(importType: any): Promise<any> {
    return this.request<any>('/api/tipo-importacion', {
      method: 'POST',
      body: JSON.stringify(importType)
    });
  }

  // Actualizar tipo de importación
  async updateImportType(id: number, importType: any): Promise<any> {
    return this.request<any>(`/api/tipo-importacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(importType)
    });
  }

  // Eliminar tipo de importación
  async deleteImportType(id: number): Promise<void> {
    return this.request<void>(`/api/tipo-importacion/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPO CLIENTE IMPORTACIÓN
  // ========================================

  // Obtener todas las relaciones
  async getTipoClienteImportacion(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-cliente-importacion');
  }

  // Obtener relación por ID
  async getTipoClienteImportacionById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-cliente-importacion/${id}`);
  }

  // Obtener por tipo de cliente
  async getTipoClienteImportacionByTipoCliente(tipoClienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/tipo-cliente-importacion/tipo-cliente/${tipoClienteId}`);
  }

  // Crear nueva relación
  async createTipoClienteImportacion(relacion: any): Promise<any> {
    return this.request<any>('/api/tipo-cliente-importacion', {
      method: 'POST',
      body: JSON.stringify(relacion)
    });
  }

  // Eliminar relación
  async deleteTipoClienteImportacion(id: number): Promise<void> {
    return this.request<void>(`/api/tipo-cliente-importacion/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // GESTIÓN DE TIPOS DE CLIENTE
  // ========================================

  // Obtener todos los tipos de cliente
  async getClientTypes(): Promise<any[]> {
    return this.request<any[]>('/api/tipo-cliente');
  }

  // Obtener tipo de cliente por ID
  async getClientTypeById(id: number): Promise<any> {
    return this.request<any>(`/api/tipo-cliente/${id}`);
  }

  // Crear nuevo tipo de cliente
  async createClientType(clientType: any): Promise<any> {
    return this.request<any>('/api/tipo-cliente', {
      method: 'POST',
      body: JSON.stringify(clientType)
    });
  }

  // Actualizar tipo de cliente
  async updateClientType(id: number, clientType: any): Promise<any> {
    return this.request<any>(`/api/tipo-cliente/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientType)
    });
  }

  // Eliminar tipo de cliente
  async deleteClientType(id: number): Promise<void> {
    return this.request<void>(`/api/tipo-cliente/${id}`, {
      method: 'DELETE'
    });
  }

  // ========================================
  // ASIGNACIÓN DE SERIES
  // ========================================

  // Obtener reservas pendientes de asignación de serie
  async getReservasPendientesAsignacion(): Promise<any[]> {
    return this.request<any[]>('/api/asignacion-series/pendientes');
  }

  // Obtener series disponibles para un arma
  async getSeriesDisponibles(armaId: number): Promise<any[]> {
    return this.request<any[]>(`/api/asignacion-series/series-disponibles/${armaId}`);
  }

  // Asignar una serie a una reserva de cliente
  async asignarSerie(clienteArmaId: number, numeroSerie: string): Promise<any> {
    return this.request<any>('/api/asignacion-series/asignar', {
      method: 'POST',
      body: JSON.stringify({ clienteArmaId, numeroSerie })
    });
  }

  // ========================================
  // AUTORIZACIONES DE VENTA
  // ========================================

  // Generar autorización de venta para un cliente
  async generarAutorizacion(clienteId: string, numeroFactura: string, tramite: string): Promise<any> {
    return this.request<any>('/api/autorizaciones/generar', {
      method: 'POST',
      body: JSON.stringify({ clienteId, numeroFactura, tramite })
    });
  }

  // Obtener autorizaciones de un cliente
  async getAutorizacionesPorCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/autorizaciones/cliente/${clienteId}`);
  }

}

// Instancia singleton
export const apiService = new ApiService();
export default apiService; 