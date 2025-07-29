// ========================================
// API SERVICE MOCK PARA QA
// ========================================

import { 
  mockUsers, 
  mockClients, 
  mockPagos, 
  mockSaldos, 
  mockWeapons,
  mockClientTypes,
  mockIdentificationTypes,
  mockProvinces,
  mockCantons,
  simulateApiDelay,
  simulateRandomError
} from '../data/mockData';
import type { 
  User, 
  Client, 
  Pago, 
  SaldoCliente, 
  ApiResponse,
  LoginRequest,
  LoginResponse
} from '../types';

class MockApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  // Simular login
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error de conexión simulado');
    }

    const user = mockUsers.find(u => u.email === credentials.email);
    
    if (!user || credentials.password !== 'password123') {
      throw new Error('Credenciales inválidas');
    }

    // Simular roles según el email
    let roles: any[] = [];
    switch (credentials.email) {
      case 'admin@test.com':
        roles = [{ usuarioId: user.id, rolId: 1, fechaAsignacion: new Date().toISOString(), activo: true, rol: { id: 1, nombre: 'ADMIN', descripcion: 'Administrador', estado: true } }];
        break;
      case 'vendedor@test.com':
        roles = [{ usuarioId: user.id, rolId: 2, fechaAsignacion: new Date().toISOString(), activo: true, rol: { id: 2, nombre: 'VENDEDOR', descripcion: 'Vendedor', estado: true } }];
        break;
      case 'finanzas@test.com':
        roles = [{ usuarioId: user.id, rolId: 3, fechaAsignacion: new Date().toISOString(), activo: true, rol: { id: 3, nombre: 'FINANZAS', descripcion: 'Finanzas', estado: true } }];
        break;
      case 'jefe@test.com':
        roles = [{ usuarioId: user.id, rolId: 4, fechaAsignacion: new Date().toISOString(), activo: true, rol: { id: 4, nombre: 'JEFE_VENTAS', descripcion: 'Jefe de Ventas', estado: true } }];
        break;
    }

    this.currentUser = { ...user, roles };
    this.token = 'mock-jwt-token-' + Date.now();

    return {
      token: this.token,
      tokenType: 'Bearer',
      expiresIn: 3600,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nombres: user.nombres,
        apellidos: user.apellidos,
        roles
      }
    };
  }

  // Simular logout
  async logout(): Promise<void> {
    await simulateApiDelay();
    this.token = null;
    this.currentUser = null;
  }

  // Obtener usuario actual
  async getCurrentUser(): Promise<User> {
    await simulateApiDelay();
    
    if (!this.currentUser) {
      throw new Error('Usuario no autenticado');
    }
    
    return this.currentUser;
  }

  // Verificar autenticación
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  // Obtener roles del usuario
  async getUserRoles(): Promise<string[]> {
    await simulateApiDelay();
    if (!this.currentUser || !this.currentUser.roles) return [];
    
    return this.currentUser.roles.map(role => role.rol?.nombre || '').filter(nombre => nombre !== '');
  }

  // Verificar si tiene un rol específico
  async hasRole(role: string): Promise<boolean> {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return this.currentUser.roles.some(userRole => userRole.rol?.nombre === role);
  }

  // Verificar si tiene alguno de los roles
  async hasAnyRole(roles: string[]): Promise<boolean> {
    if (!this.currentUser || !this.currentUser.roles) return false;
    return this.currentUser.roles.some(userRole => 
      roles.includes(userRole.rol?.nombre || '')
    );
  }

  // ========================================
  // CLIENTES
  // ========================================

  async getClientes(page: number = 0, size: number = 10): Promise<ApiResponse<Client[]>> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al cargar clientes');
    }

    const start = page * size;
    const end = start + size;
    const paginatedClients = mockClients.slice(start, end);

    return {
      success: true,
      data: paginatedClients,
      message: 'Clientes cargados exitosamente'
    };
  }

  async getCliente(id: number): Promise<Client> {
    await simulateApiDelay();
    
    const cliente = mockClients.find(c => c.id === id.toString());
    if (!cliente) {
      throw new Error('Cliente no encontrado');
    }
    
    return cliente;
  }

  async createCliente(clienteData: Partial<Client>): Promise<Client> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al crear cliente');
    }

    const newCliente: Client = {
      id: (mockClients.length + 1).toString(),
      numeroIdentificacion: clienteData.numeroIdentificacion || '',
      nombres: clienteData.nombres || '',
      apellidos: clienteData.apellidos || '',
      email: clienteData.email || '',
      fechaNacimiento: clienteData.fechaNacimiento || '',
      direccion: clienteData.direccion || '',
      telefonoPrincipal: clienteData.telefonoPrincipal || '',
      telefonoSecundario: clienteData.telefonoSecundario,
      tipoCliente: clienteData.tipoCliente || '',
      tipoIdentificacion: clienteData.tipoIdentificacion || '',
      estadoMilitar: clienteData.estadoMilitar,
      representanteLegal: clienteData.representanteLegal,
      ruc: clienteData.ruc,
      nombreEmpresa: clienteData.nombreEmpresa,
      direccionFiscal: clienteData.direccionFiscal,
      telefonoReferencia: clienteData.telefonoReferencia,
      correoEmpresa: clienteData.correoEmpresa,
      provinciaEmpresa: clienteData.provinciaEmpresa,
      cantonEmpresa: clienteData.cantonEmpresa,
      provincia: clienteData.provincia,
      canton: clienteData.canton,
      vendedorId: clienteData.vendedorId
    };

    mockClients.push(newCliente);
    return newCliente;
  }

  // ========================================
  // PAGOS
  // ========================================

  async getPagos(page: number = 0, size: number = 10): Promise<ApiResponse<Pago[]>> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al cargar pagos');
    }

    const start = page * size;
    const end = start + size;
    const paginatedPagos = mockPagos.slice(start, end);

    return {
      success: true,
      data: paginatedPagos,
      message: 'Pagos cargados exitosamente'
    };
  }

  async getPago(id: number): Promise<Pago> {
    await simulateApiDelay();
    
    const pago = mockPagos.find(p => p.id === id);
    if (!pago) {
      throw new Error('Pago no encontrado');
    }
    
    return pago;
  }

  async createPago(pagoData: Partial<Pago>): Promise<Pago> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al crear pago');
    }

    const newPago: Pago = {
      id: mockPagos.length + 1,
      clienteId: pagoData.clienteId || 0,
      cliente: mockClients.find(c => c.id === pagoData.clienteId?.toString()),
      planPagoId: pagoData.planPagoId,
      planPago: pagoData.planPago,
      numeroComprobante: `COMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      montoTotal: pagoData.montoTotal || 0,
      saldoPendiente: pagoData.saldoPendiente || 0,
      metodoPago: pagoData.metodoPago || '',
      fechaPago: pagoData.fechaPago,
      estado: pagoData.estado || 'PENDIENTE',
      observaciones: pagoData.observaciones,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString()
    };

    mockPagos.push(newPago);
    return newPago;
  }

  async getPagosPorCliente(clienteId: number): Promise<Pago[]> {
    await simulateApiDelay();
    return mockPagos.filter(p => p.clienteId === clienteId);
  }

  async getSaldoCliente(clienteId: number): Promise<SaldoCliente> {
    await simulateApiDelay();
    
    const saldo = mockSaldos.find(s => s.clienteId === clienteId);
    if (!saldo) {
      return {
        clienteId,
        saldo: 0,
        tieneSaldoPendiente: false
      };
    }
    
    return saldo;
  }

  // ========================================
  // CATÁLOGOS
  // ========================================

  async getClientTypes(): Promise<any[]> {
    await simulateApiDelay();
    return mockClientTypes;
  }

  async getIdentificationTypes(): Promise<any[]> {
    await simulateApiDelay();
    return mockIdentificationTypes;
  }

  async getProvinces(): Promise<any[]> {
    await simulateApiDelay();
    return mockProvinces;
  }

  async getCantons(provinceId: string): Promise<any[]> {
    await simulateApiDelay();
    return mockCantons[provinceId as keyof typeof mockCantons] || [];
  }

  async getWeapons(): Promise<any[]> {
    await simulateApiDelay();
    return mockWeapons;
  }

  // ========================================
  // USUARIOS
  // ========================================

  async getUsers(page: number = 0, size: number = 10): Promise<ApiResponse<User[]>> {
    await simulateApiDelay();
    
    const start = page * size;
    const end = start + size;
    const paginatedUsers = mockUsers.slice(start, end);

    return {
      success: true,
      data: paginatedUsers,
      message: 'Usuarios cargados exitosamente'
    };
  }

  // Obtener usuario por ID
  async getUser(id: number): Promise<User> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al obtener usuario');
    }

    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    return user;
  }

  // Actualizar usuario
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    await simulateApiDelay();
    
    if (simulateRandomError()) {
      throw new Error('Error al actualizar usuario');
    }

    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('Usuario no encontrado');
    }

    // Actualizar el usuario en el array mock
    mockUsers[userIndex] = { ...mockUsers[userIndex], ...userData };
    
    // Si es el usuario actual, actualizarlo también
    if (this.currentUser && this.currentUser.id === id) {
      this.currentUser = { ...this.currentUser, ...userData };
    }

    return mockUsers[userIndex];
  }

  // ========================================
  // UTILIDADES
  // ========================================

  setToken(token: string) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  clearToken() {
    this.token = null;
    this.currentUser = null;
  }
}

export const mockApiService = new MockApiService(); 