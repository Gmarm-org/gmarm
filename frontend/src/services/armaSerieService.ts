const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export interface ArmaSerie {
  id: number;
  numeroSerie: string;
  armaId: number;
  armaModelo?: string;
  armaNombre?: string; // Deprecated - usar armaModelo
  armaCodigo: string;
  armaCalibre: string;
  estado: 'DISPONIBLE' | 'ASIGNADO' | 'RESERVADA';
  estadoDescripcion: string;
  fechaCarga: string;
  fechaAsignacion?: string;
  clienteArmaId?: number;
  clienteNombre?: string;
  clienteApellidos?: string;
  clienteIdentificacion?: string;
  usuarioAsignadorId?: number;
  usuarioAsignadorNombre?: string;
  lote?: string;
  observaciones?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export interface EstadisticaSeries {
  armaId: number;
  armaModelo?: string;
  armaNombre?: string; // Deprecated - usar armaModelo
  total: number;
  disponibles: number;
  asignadas: number;
  vendidas: number;
}

export interface ResultadoCarga {
  success: boolean;
  totalProcesadas: number;
  totalCargadas: number;
  totalDuplicados: number;
  totalErrores: number;
  duplicados: string[];
  errores: string[];
  arma: string;
  lote?: string;
  error?: string;
}

const armaSerieService = {
  /**
   * Carga números de serie desde un archivo
   */
  async cargarSeriesDesdeArchivo(
    archivo: File,
    armaId?: number,
    lote?: string
  ): Promise<ResultadoCarga> {
    const formData = new FormData();
    formData.append('archivo', archivo);
    if (armaId) {
      formData.append('armaId', armaId.toString());
    }
    if (lote) {
      formData.append('lote', lote);
    }

    const response = await fetch(`${API_BASE_URL}/api/arma-serie/cargar`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }

    return await response.json();
  },

  /**
   * Asigna un número de serie a un cliente
   */
  async asignarSerieACliente(
    clienteArmaId: number,
    numeroSerie: string,
    usuarioAsignadorId: number
  ): Promise<{ success: boolean; message: string; data: ArmaSerie }> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/asignar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteArmaId, numeroSerie, usuarioAsignadorId }),
    });

    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Obtiene series disponibles de un arma
   */
  async getSeriesDisponibles(armaId: number): Promise<ArmaSerie[]> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/disponibles/${armaId}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Obtiene todas las series de un arma
   */
  async getSeriesByArma(armaId: number): Promise<ArmaSerie[]> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/arma/${armaId}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Obtiene estadísticas de series
   */
  async getEstadisticas(): Promise<EstadisticaSeries[]> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/estadisticas`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Obtiene una serie por su número
   */
  async getSerieByNumero(numeroSerie: string): Promise<ArmaSerie> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/numero/${numeroSerie}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Obtiene series por estado
   */
  async getSeriesByEstado(estado: string): Promise<ArmaSerie[]> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/estado/${estado}`);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Libera una serie
   */
  async liberarSerie(serieId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/liberar/${serieId}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },

  /**
   * Marca una serie como vendida
   */
  async marcarComoVendida(serieId: number): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${API_BASE_URL}/api/arma-serie/vendida/${serieId}`, {
      method: 'PUT',
    });
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    return await response.json();
  },
};

export default armaSerieService;
