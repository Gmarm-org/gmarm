// API Service para comunicación con el backend
const API_BASE_URL = 'http://localhost:8080';

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
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  estado: string;
  roles: string[];
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
  telefonoPrincipal: string;
  tipoCliente: string;
  estado: string;
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

    return headers;
  }

  // Método base para requests
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          window.location.href = '/login';
          throw new Error('Sesión expirada');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}`);
      }

      return await response.json();
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

  async getUsers(page: number = 0, size: number = 10): Promise<ApiResponse<User[]>> {
    return this.request<ApiResponse<User[]>>(`/usuarios?page=${page}&size=${size}`);
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/usuarios/${id}`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return this.request<User>('/usuarios', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return this.request<User>(`/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/usuarios/${id}`, { method: 'DELETE' });
  }

  async getVendedores(): Promise<User[]> {
    return this.request<User[]>('/usuarios/vendedores');
  }

  async assignRoles(userId: number, roleIds: number[]): Promise<void> {
    await this.request(`/usuarios/${userId}/roles`, {
      method: 'POST',
      body: JSON.stringify({ roleIds }),
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

  // Obtener cantones por provincia
  async getCantones(provincia: string): Promise<string[]> {
    return this.request<string[]>(`/api/localizacion/cantones/${encodeURIComponent(provincia)}`);
  }

  async getCliente(id: number): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`);
  }

  async createCliente(clienteData: Partial<Client>): Promise<Client> {
    return this.request<Client>('/api/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  async updateCliente(id: number, clienteData: Partial<Client>): Promise<Client> {
    return this.request<Client>(`/api/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
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
    return this.request<ApiResponse<GrupoImportacion[]>>(`/grupos-importacion?page=${page}&size=${size}`);
  }

  async getGrupoImportacion(id: number): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>(`/grupos-importacion/${id}`);
  }

  async createGrupoImportacion(grupoData: Partial<GrupoImportacion>): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>('/grupos-importacion', {
      method: 'POST',
      body: JSON.stringify(grupoData),
    });
  }

  async updateGrupoImportacion(id: number, grupoData: Partial<GrupoImportacion>): Promise<GrupoImportacion> {
    return this.request<GrupoImportacion>(`/grupos-importacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grupoData),
    });
  }

  async getGruposActivos(): Promise<GrupoImportacion[]> {
    return this.request<GrupoImportacion[]>('/grupos-importacion/activos');
  }

  async agregarClienteAGrupo(grupoId: number, clienteId: number): Promise<void> {
    await this.request(`/grupos-importacion/${grupoId}/clientes/${clienteId}`, {
      method: 'POST',
    });
  }

  async configurarCupo(grupoId: number, tipoCliente: string, cupoAsignado: number): Promise<void> {
    await this.request(`/grupos-importacion/${grupoId}/cupos`, {
      method: 'POST',
      body: JSON.stringify({ tipoCliente, cupoAsignado }),
    });
  }

  // ========================================
  // PAGOS
  // ========================================

  async getPagos(page: number = 0, size: number = 10): Promise<ApiResponse<Pago[]>> {
    return this.request<ApiResponse<Pago[]>>(`/pagos?page=${page}&size=${size}`);
  }

  async getPago(id: number): Promise<Pago> {
    return this.request<Pago>(`/pagos/${id}`);
  }

  async createPago(pagoData: Partial<Pago>): Promise<Pago> {
    return this.request<Pago>('/pagos', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    });
  }

  async getPagosPorCliente(clienteId: number): Promise<Pago[]> {
    return this.request<Pago[]>(`/pagos/cliente/${clienteId}`);
  }

  async getSaldoCliente(clienteId: number): Promise<SaldoCliente> {
    return this.request<SaldoCliente>(`/pagos/cliente/${clienteId}/saldo`);
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

  // ========================================
  // DOCUMENTOS DE CLIENTE
  // ========================================

  // Cargar documento para un cliente
  async cargarDocumentoCliente(clienteId: number, tipoDocumentoId: number, archivo: File, descripcion?: string): Promise<any> {
    const formData = new FormData();
    formData.append('clienteId', clienteId.toString());
    formData.append('tipoDocumentoId', tipoDocumentoId.toString());
    formData.append('archivo', archivo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

    return this.request<any>('/api/documentos-cliente/cargar', {
      method: 'POST',
      body: formData,
      headers: {
        // No incluir Content-Type para FormData
      }
    });
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
  async actualizarDocumentoCliente(documentoId: number, archivo: File, descripcion?: string): Promise<any> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (descripcion) {
      formData.append('descripcion', descripcion);
    }

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

  // ========================================
  // GESTIÓN DE ARMAS
  // ========================================

  // Obtener todas las armas
  async getArmas(): Promise<any[]> {
    console.log('🔫 API Service - Iniciando llamada a /api/arma');
    try {
      const response = await this.request<any>('/api/arma');
      console.log('🔫 API Service - RESPUESTA COMPLETA DEL BACKEND:', response);
      console.log('🔫 API Service - Tipo de respuesta:', typeof response);
      console.log('🔫 API Service - Es array:', Array.isArray(response));
      console.log('🔫 API Service - Longitud del array:', Array.isArray(response) ? response.length : 'NO ES ARRAY');
      
      // Si es array, devolver directamente
      if (Array.isArray(response)) {
        console.log('🔫 API Service - ✅ Respuesta es array, devolviendo directamente');
        console.log('🔫 API Service - Primeras 3 armas:', response.slice(0, 3));
        console.log('🔫 API Service - Últimas 3 armas:', response.slice(-3));
        return response;
      }
      
      // Si no es array, mostrar error
      console.error('🔫 API Service - ❌ Respuesta NO es array:', response);
      console.error('🔫 API Service - Estructura de respuesta:', JSON.stringify(response, null, 2));
      return [];
      
    } catch (error) {
      console.error('🔫 API Service - Error en getArmas:', error);
      throw error;
    }
  }

  // Obtener arma por ID
  async getArmaById(id: number): Promise<any> {
    return this.request<any>(`/api/arma/${id}`);
  }

  // Obtener armas por categoría
  async getArmasByCategoria(categoriaId: number): Promise<any[]> {
    return this.request<any[]>(`/api/arma/categoria/${categoriaId}`);
  }

  // Obtener armas disponibles
  async getArmasDisponibles(): Promise<any[]> {
    return this.request<any[]>('/api/arma/disponibles');
  }
}

// Instancia singleton
export const apiService = new ApiService();
export default apiService; 