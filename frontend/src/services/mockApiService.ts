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
  mockClientQuestions,
  mockRequiredDocuments,
  mockAdditionalDocuments,
  clientTypeToProcessId,
  mockLicencias
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
import type {
  Licencia,
  LicenciaCreateRequest,
  LicenciaSearchParams,
  Page
} from './api';

// Funciones de simulación
const simulateApiDelay = async (): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));
};

const simulateRandomError = (): boolean => {
  return Math.random() < 0.1; // 10% de probabilidad de error
};

// Interfaces adicionales para mockApiService
interface ClientQuestion {
  id: number;
  pregunta: string;
  tipo_proceso_id: number;
  orden: number;
  obligatoria: boolean;
}

class MockApiService {
  private token: string | null = null;
  private currentUser: User | null = null;

  // Simular login
  async login(_credentials: LoginRequest): Promise<LoginResponse> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error de conexión simulado');
    }

    // Credenciales de prueba removidas para fase piloto
    // El sistema ahora usa solo autenticación real del backend
    throw new Error('Servicio mock deshabilitado para fase piloto');
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

  // Método específico para vendedores - obtiene solo sus clientes
  async getMisClientes(page: number = 0, size: number = 10): Promise<ApiResponse<Client[]>> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al cargar clientes del vendedor');
    }

    const start = page * size;
    const end = start + size;
    const paginatedClients = mockClients.slice(start, end);

    return {
      success: true,
      data: paginatedClients,
      message: 'Clientes del vendedor cargados exitosamente'
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

  // Crear cliente
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
      telefonoSecundario: clienteData.telefonoSecundario || '',
      tipoCliente: clienteData.tipoCliente || '',
      tipoClienteNombre: clienteData.tipoCliente || '',
      tipoClienteCodigo: 'CIV',
      tipoClienteId: 1,
      tipoProcesoNombre: 'Cupo Civil',
      tipoIdentificacion: clienteData.tipoIdentificacion || '',
      tipoIdentificacionNombre: clienteData.tipoIdentificacion || '',
      tipoIdentificacionId: 1,
      estadoMilitar: clienteData.estadoMilitar,
      representanteLegal: clienteData.representanteLegal,
      ruc: clienteData.ruc,
      nombreEmpresa: clienteData.nombreEmpresa,
      direccionFiscal: clienteData.direccionFiscal,
      telefonoReferencia: clienteData.telefonoReferencia,
      correoEmpresa: clienteData.correoEmpresa,
      provinciaEmpresa: clienteData.provinciaEmpresa,
      cantonEmpresa: clienteData.cantonEmpresa,
      provincia: clienteData.provincia || '',
      canton: clienteData.canton || '',
      vendedorId: clienteData.vendedorId || '1',
      estado: clienteData.estado || 'FALTAN_DOCUMENTOS',
      documentos: clienteData.documentos || [],
      respuestas: clienteData.respuestas || []
    };

    mockClients.push(newCliente);
    return newCliente;
  }

  // Actualizar cliente
  async updateCliente(id: string, clienteData: Partial<Client>): Promise<Client> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al actualizar cliente');
    }

    const clienteIndex = mockClients.findIndex(c => c.id === id);
    if (clienteIndex === -1) {
      throw new Error('Cliente no encontrado');
    }

    // Actualizar el cliente existente
    const updatedCliente: Client = {
      ...mockClients[clienteIndex],
      ...clienteData,
      id: id, // Mantener el ID original
      estado: clienteData.estado || mockClients[clienteIndex].estado || 'FALTAN_DOCUMENTOS',
      documentos: clienteData.documentos || mockClients[clienteIndex].documentos || [],
      respuestas: clienteData.respuestas || mockClients[clienteIndex].respuestas || []
    };

    mockClients[clienteIndex] = updatedCliente;
    return updatedCliente;
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
  // DOCUMENTOS Y PREGUNTAS DINÁMICAS
  // ========================================

  // Obtener preguntas por tipo de cliente
  async getClientQuestions(clientType: string, estadoMilitar?: string): Promise<ClientQuestion[]> {
    await simulateApiDelay();

    let processId = clientTypeToProcessId[clientType as keyof typeof clientTypeToProcessId];

    // Si es Uniformado y está en servicio pasivo, usar preguntas de Civil
    if (clientType === 'Uniformado' && estadoMilitar === 'PASIVO') {
      processId = 1; // Civil
    }

    return mockClientQuestions
      .filter(q => q.tipo_proceso_id === processId)
      .sort((a, b) => a.orden - b.orden);
  }

  // Obtener documentos por tipo de cliente
  async getDocumentsByClientType(clientType: string, estadoMilitar?: string): Promise<any[]> {
    await simulateApiDelay();

    let processId = clientTypeToProcessId[clientType as keyof typeof clientTypeToProcessId];

    // Si es Uniformado y está en servicio pasivo, usar documentos de Civil
    if (clientType === 'Uniformado' && estadoMilitar === 'PASIVO') {
      processId = 1; // Civil
    }

    // Documentos con links (para todos excepto Compañía de Seguridad)
    const documentsWithLinks = clientType !== 'Compañía de Seguridad'
      ? mockRequiredDocuments
      : [];

    // Documentos adicionales específicos del tipo de cliente
    const additionalDocuments = mockAdditionalDocuments
      .filter(d => d.tipo_proceso_id === processId);

    // Combinar ambos tipos de documentos
    return [...documentsWithLinks, ...additionalDocuments];
  }

  // ========================================
  // LICENCIAS
  // ========================================

  async createLicencia(licenciaData: LicenciaCreateRequest, usuarioId: number): Promise<Licencia> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al crear licencia');
    }

    const newLicencia = {
      id: mockLicencias.length + 1,
      numero: licenciaData.numero,
      nombre: licenciaData.nombre,
      ruc: licenciaData.ruc,
      cuentaBancaria: licenciaData.cuentaBancaria,
      nombreBanco: licenciaData.nombreBanco,
      tipoCuenta: licenciaData.tipoCuenta,
      cedulaCuenta: licenciaData.cedulaCuenta,
      email: licenciaData.email,
      telefono: licenciaData.telefono,
      fechaVencimiento: licenciaData.fechaVencimiento,
      tipoLicencia: licenciaData.tipoLicencia,
      descripcion: licenciaData.descripcion,
      fechaEmision: licenciaData.fechaEmision,
      cupoTotal: licenciaData.cupoTotal,
      cupoDisponible: licenciaData.cupoTotal,
      cupoCivil: licenciaData.cupoCivil,
      cupoMilitar: licenciaData.cupoMilitar,
      cupoEmpresa: licenciaData.cupoEmpresa,
      cupoDeportista: licenciaData.cupoDeportista,
      observaciones: licenciaData.observaciones,
      estado: (licenciaData.estado as 'ACTIVA' | 'INACTIVA' | 'VENCIDA' | 'SUSPENDIDA') || 'ACTIVA',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      usuarioCreador: {
        id: usuarioId,
        nombres: 'Usuario',
        apellidos: 'Sistema'
      },
      usuarioActualizador: undefined
    };

    mockLicencias.push(newLicencia);
    return newLicencia as Licencia;
  }

  async buscarLicencias(params: LicenciaSearchParams): Promise<Page<Licencia>> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al cargar licencias');
    }

    const page = params.page || 0;
    const size = params.size || 10;
    const start = page * size;
    const end = start + size;

    let filteredLicencias = [...mockLicencias];

    // Aplicar filtros
    if (params.numeroLicencia) {
      filteredLicencias = filteredLicencias.filter(l => 
        l.numero.toLowerCase().includes(params.numeroLicencia!.toLowerCase())
      );
    }

    if (params.tipoLicencia) {
      filteredLicencias = filteredLicencias.filter(l => l.tipoLicencia === params.tipoLicencia);
    }

    if (params.estado) {
      filteredLicencias = filteredLicencias.filter(l => l.estado === params.estado);
    }

    // Ordenar por fecha de actualización (más reciente primero)
    filteredLicencias.sort((a, b) => 
      new Date(b.fechaActualizacion || b.fechaCreacion).getTime() - 
      new Date(a.fechaActualizacion || a.fechaCreacion).getTime()
    );

    const total = filteredLicencias.length;
    const content = filteredLicencias.slice(start, end);

    return {
      content: content as Licencia[],
      totalElements: total,
      totalPages: Math.ceil(total / size),
      size,
      number: page,
      first: page === 0,
      last: end >= total,
      numberOfElements: content.length
    };
  }

  async getLicencia(id: number): Promise<Licencia> {
    await simulateApiDelay();

    const licencia = mockLicencias.find(l => l.id === id);
    if (!licencia) {
      throw new Error('Licencia no encontrada');
    }

    return licencia as Licencia;
  }

  async updateLicencia(id: number, licenciaData: Partial<LicenciaCreateRequest>, usuarioId: number): Promise<Licencia> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al actualizar licencia');
    }

    const licenciaIndex = mockLicencias.findIndex(l => l.id === id);
    if (licenciaIndex === -1) {
      throw new Error('Licencia no encontrada');
    }

    const updatedLicencia = {
      ...mockLicencias[licenciaIndex],
      ...licenciaData,
      id: id,
      fechaActualizacion: new Date().toISOString(),
      usuarioActualizador: {
        id: usuarioId,
        nombres: 'Usuario',
        apellidos: 'Sistema'
      }
    };

    mockLicencias[licenciaIndex] = updatedLicencia;
    return updatedLicencia as Licencia;
  }

  async deleteLicencia(id: number): Promise<void> {
    await simulateApiDelay();

    if (simulateRandomError()) {
      throw new Error('Error al eliminar licencia');
    }

    const licenciaIndex = mockLicencias.findIndex(l => l.id === id);
    if (licenciaIndex === -1) {
      throw new Error('Licencia no encontrada para eliminar');
    }

    mockLicencias.splice(licenciaIndex, 1);
  }

  // ========================================
  // UTILIDADES
  // ========================================

  setToken(token: string) {
    this.token = token;
    
    // Si tenemos un token pero no un usuario, intentar restaurar el usuario
    if (token && !this.currentUser) {
      // Buscar un usuario con rol de dirección de ventas para simular la restauración
      const userWithRole = mockUsers.find(u => 
        u.roles?.some(role => role.rol?.codigo === 'SALES_CHIEF')
      );
      if (userWithRole) {
        this.currentUser = userWithRole;
      }
    }
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