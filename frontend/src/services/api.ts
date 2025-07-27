// API Service para comunicación con el backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// Tipos de respuesta
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
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
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    this.clearToken();
  }

  async refreshToken(): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/refresh', {
      method: 'POST',
    });
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
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

  async getClientes(page: number = 0, size: number = 10): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/clientes?page=${page}&size=${size}`);
  }

  async getCliente(id: number): Promise<any> {
    return this.request<any>(`/clientes/${id}`);
  }

  async createCliente(clienteData: any): Promise<any> {
    return this.request<any>('/clientes', {
      method: 'POST',
      body: JSON.stringify(clienteData),
    });
  }

  async updateCliente(id: number, clienteData: any): Promise<any> {
    return this.request<any>(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clienteData),
    });
  }

  async deleteCliente(id: number): Promise<void> {
    await this.request(`/clientes/${id}`, { method: 'DELETE' });
  }

  async getClientesPorVendedor(vendedorId: number): Promise<any[]> {
    return this.request<any[]>(`/clientes/por-vendedor/${vendedorId}`);
  }

  async buscarClientePorIdentificacion(numero: string): Promise<any> {
    return this.request<any>(`/clientes/por-identificacion/${numero}`);
  }

  async validarIdentificacion(numero: string): Promise<{ existe: boolean; mensaje: string }> {
    return this.request<{ existe: boolean; mensaje: string }>(`/clientes/validar-identificacion/${numero}`);
  }

  async cambiarEstadoCliente(id: number, estado: string): Promise<void> {
    await this.request(`/clientes/${id}/estado?nuevoEstado=${estado}`, {
      method: 'PUT',
    });
  }

  // ========================================
  // LICENCIAS
  // ========================================

  async getLicencias(page: number = 0, size: number = 10): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/licencias?page=${page}&size=${size}`);
  }

  async getLicencia(id: number): Promise<any> {
    return this.request<any>(`/licencias/${id}`);
  }

  async createLicencia(licenciaData: any): Promise<any> {
    return this.request<any>('/licencias', {
      method: 'POST',
      body: JSON.stringify(licenciaData),
    });
  }

  async updateLicencia(id: number, licenciaData: any): Promise<any> {
    return this.request<any>(`/licencias/${id}`, {
      method: 'PUT',
      body: JSON.stringify(licenciaData),
    });
  }

  async getLicenciasActivas(): Promise<any[]> {
    return this.request<any[]>('/licencias/activas');
  }

  async getLicenciasConCupoCivil(): Promise<any[]> {
    return this.request<any[]>('/licencias/cupo-civil-disponible');
  }

  async decrementarCupoLicencia(id: number): Promise<void> {
    await this.request(`/licencias/${id}/decrementar-cupo`, { method: 'POST' });
  }

  // ========================================
  // GRUPOS DE IMPORTACIÓN
  // ========================================

  async getGruposImportacion(page: number = 0, size: number = 10): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/grupos-importacion?page=${page}&size=${size}`);
  }

  async getGrupoImportacion(id: number): Promise<any> {
    return this.request<any>(`/grupos-importacion/${id}`);
  }

  async createGrupoImportacion(grupoData: any): Promise<any> {
    return this.request<any>('/grupos-importacion', {
      method: 'POST',
      body: JSON.stringify(grupoData),
    });
  }

  async updateGrupoImportacion(id: number, grupoData: any): Promise<any> {
    return this.request<any>(`/grupos-importacion/${id}`, {
      method: 'PUT',
      body: JSON.stringify(grupoData),
    });
  }

  async getGruposActivos(): Promise<any[]> {
    return this.request<any[]>('/grupos-importacion/activos');
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

  async getPagos(page: number = 0, size: number = 10): Promise<ApiResponse<any[]>> {
    return this.request<ApiResponse<any[]>>(`/pagos?page=${page}&size=${size}`);
  }

  async getPago(id: number): Promise<any> {
    return this.request<any>(`/pagos/${id}`);
  }

  async createPago(pagoData: any): Promise<any> {
    return this.request<any>('/pagos', {
      method: 'POST',
      body: JSON.stringify(pagoData),
    });
  }

  async getPagosPorCliente(clienteId: number): Promise<any[]> {
    return this.request<any[]>(`/pagos/cliente/${clienteId}`);
  }

  async getSaldoCliente(clienteId: number): Promise<any> {
    return this.request<any>(`/pagos/cliente/${clienteId}/saldo`);
  }

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
}

// Instancia singleton
export const apiService = new ApiService();
export default apiService; 