import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

// DTO que coincide EXACTAMENTE con el backend ReservaPendienteDTO
interface ReservaPendienteDTO {
  id: number;
  // Datos del cliente (planos, no anidados)
  clienteId: number;
  clienteNombres: string;
  clienteApellidos: string;
  clienteNumeroIdentificacion: string;
  // Datos del arma (planos, no anidados)
  armaId: number;
  armaCodigo: string;
  armaModelo?: string;
  armaNombre?: string; // Deprecated - usar armaModelo
  armaCalibre: string;
  armaCapacidad: number;
  // Datos de la reserva
  cantidad: number;
  precioUnitario: number;
  estado: string;
  fechaAsignacion: string;
  fechaCreacion: string;
}

interface ArmaSerie {
  id: number;
  numeroSerie: string;
  estado: string;
  lote: string | null;
  observaciones: string | null;
  fechaCarga: string;
}

const AsignacionSeries: React.FC = () => {
  const [reservasPendientes, setReservasPendientes] = useState<ReservaPendienteDTO[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaPendienteDTO | null>(null);
  const [seriesDisponibles, setSeriesDisponibles] = useState<ArmaSerie[]>([]);
  const [serieSeleccionadaNumero, setSerieSeleccionadaNumero] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [asignando, setAsignando] = useState(false);

  // Cargar reservas pendientes al montar el componente
  useEffect(() => {
    cargarReservasPendientes();
  }, []);

  const cargarReservasPendientes = async () => {
    setLoading(true);
    try {
      const data = await apiService.getReservasPendientesAsignacion();
      setReservasPendientes(data);
      console.log('✅ Reservas pendientes cargadas:', data.length);
    } catch (error) {
      console.error('❌ Error cargando reservas pendientes:', error);
      alert('Error cargando reservas pendientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSeleccionarReserva = async (reserva: ReservaPendienteDTO) => {
    setReservaSeleccionada(reserva);
    setSerieSeleccionadaNumero(null);
    setLoadingSeries(true);

    try {
      const series = await apiService.getSeriesDisponibles(reserva.armaId);
      setSeriesDisponibles(series);
      console.log(`✅ Series disponibles para arma ${reserva.armaCodigo}:`, series.length);
    } catch (error) {
      console.error('❌ Error cargando series disponibles:', error);
      alert('Error cargando series disponibles');
      setSeriesDisponibles([]);
    } finally {
      setLoadingSeries(false);
    }
  };

  const handleAsignarSerie = async () => {
    if (!reservaSeleccionada || !serieSeleccionadaNumero) {
      alert('Debe seleccionar una serie');
      return;
    }

    if (!confirm('¿Está seguro de asignar esta serie al cliente?')) {
      return;
    }

    setAsignando(true);
    try {
      await apiService.asignarSerie(reservaSeleccionada.id, serieSeleccionadaNumero);
      alert('✅ Serie asignada exitosamente');
      
      // Recargar reservas pendientes
      await cargarReservasPendientes();
      
      // Limpiar selección
      setReservaSeleccionada(null);
      setSeriesDisponibles([]);
      setSerieSeleccionadaNumero(null);
    } catch (error: any) {
      console.error('❌ Error asignando serie:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
      alert(`❌ Error asignando serie: ${errorMessage}`);
    } finally {
      setAsignando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🎯 Asignación de Series de Armas
          </h1>
          <p className="mt-2 text-gray-600">
            Asigna números de serie a las armas reservadas por los clientes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel izquierdo: Reservas pendientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                📋 Reservas Pendientes ({reservasPendientes.length})
              </h2>
              <button
                onClick={cargarReservasPendientes}
                disabled={loading}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                🔄 Actualizar
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Cargando...
              </div>
            ) : reservasPendientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">✅ No hay reservas pendientes de asignar</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {reservasPendientes.map((reserva) => (
                  <div
                    key={reserva.id}
                    onClick={() => handleSeleccionarReserva(reserva)}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      reservaSeleccionada?.id === reserva.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {reserva.clienteNombres} {reserva.clienteApellidos}
                        </p>
                        <p className="text-sm text-gray-600">
                          CI: {reserva.clienteNumeroIdentificacion}
                        </p>
                      </div>
                      <div className="ml-4 text-right">
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          {reserva.estado}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="font-medium text-gray-900">
                        🔫 {reserva.armaModelo || reserva.armaNombre || 'N/A'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600">
                          {reserva.armaCodigo} - {reserva.armaCalibre}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          ${reserva.precioUnitario.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel derecho: Series disponibles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              🔢 Series Disponibles
            </h2>

            {!reservaSeleccionada ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">👈 Selecciona una reserva para ver las series disponibles</p>
              </div>
            ) : loadingSeries ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Cargando series...
              </div>
            ) : seriesDisponibles.length === 0 ? (
              <div className="text-center py-8 text-red-500">
                <p className="text-lg">❌ No hay series disponibles para esta arma</p>
                <p className="text-sm mt-2">Contacte al administrador para cargar series</p>
              </div>
            ) : (
              <>
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">
                    Arma: {reservaSeleccionada.armaModelo || reservaSeleccionada.armaNombre || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Cliente: {reservaSeleccionada.clienteNombres} {reservaSeleccionada.clienteApellidos}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {seriesDisponibles.length} series disponibles
                  </p>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto mb-4">
                  {seriesDisponibles.map((serie) => (
                    <div
                      key={serie.id}
                      onClick={() => setSerieSeleccionadaNumero(serie.numeroSerie)}
                      className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        serieSeleccionadaNumero === serie.numeroSerie
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-mono font-semibold text-gray-900">
                            {serie.numeroSerie}
                          </p>
                          {serie.lote && (
                            <p className="text-xs text-gray-500">Lote: {serie.lote}</p>
                          )}
                          {serie.observaciones && (
                            <p className="text-xs text-gray-600 mt-1">{serie.observaciones}</p>
                          )}
                        </div>
                        <div className="ml-4">
                          {serieSeleccionadaNumero === serie.numeroSerie && (
                            <span className="inline-block w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                              ✓
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleAsignarSerie}
                  disabled={!serieSeleccionadaNumero || asignando}
                  className="w-full py-3 px-6 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {asignando ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Asignando...
                    </span>
                  ) : (
                    '✅ Asignar Serie Seleccionada'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AsignacionSeries;

