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
  async pagarCuota(cuotaId: number, referenciaPago: string, usuarioConfirmadorId: number): Promise<any> {
    return this.request<any>(`/api/pagos/cuota/${cuotaId}/pagar?referenciaPago=${encodeURIComponent(referenciaPago)}&usuarioConfirmadorId=${usuarioConfirmadorId}`, {
      method: 'POST'
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

  // Obtener preguntas por tipo de cliente
  async getPreguntasCliente(tipoClienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/pregunta-cliente/tipo/${tipoClienteId}`);
  }

  // Obtener documentos requeridos por tipo de cliente
  async getDocumentosRequeridos(tipoClienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/tipo-documento/tipo-cliente/${tipoClienteId}`);
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
    // Obtener el usuario actual del token JWT
    const currentUser = await this.getCurrentUser();
    formData.append('usuarioId', currentUser.id.toString());
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
  async getArmas(): Promise<any[]> {
          // Obteniendo armas desde API
    try {
      const response = await this.request<any>('/api/arma');
      // Respuesta recibida del backend
      // Validando respuesta de armas
      if (Array.isArray(response)) {
        return response;
      }
      
      // Si no es array, mostrar error
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

  // Crear cuota de pago
  async crearCuotaPago(cuotaData: any): Promise<any> {
    return this.request<any>('/api/cuotas-pago', {
      method: 'POST',
      body: JSON.stringify(cuotaData),
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

  // Obtener armas por categoría
  async getArmasByCategoria(categoriaId: number): Promise<any[]> {
    return this.request<any[]>(`/api/arma/categoria/${categoriaId}`);
  }

  // Obtener armas disponibles
  async getArmasDisponibles(): Promise<any[]> {
    return this.request<any[]>('/api/arma/disponibles');
  }

  // ========================================
  // GESTIÓN DE INVENTARIO Y EXPOFERIA
  // ========================================

  // Obtener estado de expoferia
  async getExpoferiaEstado(): Promise<boolean> {
    return this.request<boolean>('/api/inventario/expoferia/estado');
  }

  // Obtener nombre de expoferia
  async getExpoferiaNombre(): Promise<string> {
    return this.request<string>('/api/inventario/expoferia/nombre');
  }

  // Activar/desactivar expoferia
  async setExpoferiaActiva(activa: boolean): Promise<string> {
    return this.request<string>(`/api/inventario/expoferia/${activa}`, {
      method: 'POST'
    });
  }

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

  // Obtener pagos de un cliente
  async getPagosCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/pagos/cliente/${clienteId}`);
  }

  // Obtener contratos de un cliente
  async getContratosCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/api/contratos/cliente/${clienteId}`);
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