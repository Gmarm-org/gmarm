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
  const [gruposDisponibles, setGruposDisponibles] = useState<any[]>([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [cargandoGrupos, setCargandoGrupos] = useState(false);
  const [reservasPendientes, setReservasPendientes] = useState<ReservaPendienteDTO[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ReservaPendienteDTO | null>(null);
  const [seriesDisponibles, setSeriesDisponibles] = useState<ArmaSerie[]>([]);
  const [serieSeleccionadaNumero, setSerieSeleccionadaNumero] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [asignando, setAsignando] = useState(false);

  // Cargar grupos disponibles al montar
  useEffect(() => {
    cargarGruposDisponibles();
  }, []);

  // Cargar reservas cuando se selecciona un grupo
  useEffect(() => {
    if (grupoSeleccionado) {
      cargarReservasPendientes();
    } else {
      setReservasPendientes([]);
    }
  }, [grupoSeleccionado]);

  const cargarGruposDisponibles = async () => {
    setCargandoGrupos(true);
    try {
      const response = await apiService.getGruposParaJefeVentas(0, 100);
      const grupos = Array.isArray(response) ? response : (response as any)?.content || [];
      
      // Filtrar grupos con pedido definido Y que tengan armas sin asignar serie
      const gruposFiltrados = grupos.filter((g: any) => {
        const estado = g.grupoEstado || g.estado;
        const tienePedidoDefinido = estado && !['BORRADOR', 'EN_PREPARACION', 'EN_PROCESO_ASIGNACION_CLIENTES'].includes(estado);
        const armasSinAsignar = g.armasSinAsignar || 0;
        const tieneArmasPendientes = armasSinAsignar > 0;
        
        console.log(`🔍 Grupo ${g.grupoCodigo || g.grupoId}: ${armasSinAsignar} armas sin asignar → ${tieneArmasPendientes ? 'MOSTRAR' : 'OCULTAR'}`);
        
        return tienePedidoDefinido && tieneArmasPendientes;
      });
      
      const gruposMapeados = gruposFiltrados.map((g: any) => ({
        id: g.grupoId || g.id,
        nombre: g.grupoNombre || g.nombre,
        codigo: g.grupoCodigo || g.codigo,
        estado: g.grupoEstado || g.estado,
        armasSinAsignar: g.armasSinAsignar || 0,
        seriesAsignadas: g.seriesAsignadas || 0,
        totalArmasSolicitadas: g.totalArmasSolicitadas || 0
      }));
      
      setGruposDisponibles(gruposMapeados);
      console.log('✅ Grupos con armas pendientes de asignar:', gruposMapeados.length);
      
      if (gruposMapeados.length === 0) {
        console.log('ℹ️ No hay grupos con armas pendientes de asignación de series.');
      }
    } catch (error) {
      console.error('❌ Error cargando grupos:', error);
    } finally {
      setCargandoGrupos(false);
    }
  };

  const cargarReservasPendientes = async () => {
    if (!grupoSeleccionado) return;
    
    setLoading(true);
    try {
      // Obtener todas las reservas pendientes y filtrar por grupo
      const data = await apiService.getReservasPendientesAsignacion();
      
      // TODO: El backend debería filtrar por grupoId, pero por ahora filtramos en el frontend
      // Filtrar por clienteArma que pertenezcan al grupo seleccionado
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

        {/* Selección de Grupo de Importación */}
        <div className="mb-6 bg-white rounded-lg shadow-md p-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grupo de Importación *
          </label>
          <select
            value={grupoSeleccionado || ''}
            onChange={(e) => setGrupoSeleccionado(e.target.value ? parseInt(e.target.value) : null)}
            disabled={cargandoGrupos || gruposDisponibles.length === 0}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              cargandoGrupos || gruposDisponibles.length === 0
                ? 'bg-gray-100 border-gray-300 text-gray-500 cursor-not-allowed'
                : 'border-gray-300'
            }`}
            required
          >
            <option value="">
              {cargandoGrupos 
                ? 'Cargando grupos...' 
                : gruposDisponibles.length === 0 
                  ? 'No hay grupos con armas pendientes de asignación' 
                  : '-- Seleccione un grupo de importación --'}
            </option>
            {gruposDisponibles.map((grupo) => {
              const info = ` (${grupo.armasSinAsignar} armas sin serie)`;
              return (
                <option key={grupo.id} value={grupo.id}>
                  {grupo.codigo} - {grupo.nombre}{info}
                </option>
              );
            })}
          </select>
          {!cargandoGrupos && gruposDisponibles.length === 0 && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                ℹ️ No hay grupos con armas pendientes
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Todos los grupos tienen sus series asignadas o no hay grupos con pedido definido.
              </p>
            </div>
          )}
          {!cargandoGrupos && gruposDisponibles.length > 0 && !grupoSeleccionado && (
            <p className="text-xs text-gray-500 mt-1">
              {gruposDisponibles.length} grupo(s) disponible(s) para asignación
            </p>
          )}
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

            {!grupoSeleccionado ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg">👈 Selecciona un grupo de importación para ver las reservas pendientes</p>
              </div>
            ) : loading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                Cargando...
              </div>
            ) : reservasPendientes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-lg">✅ No hay reservas pendientes de asignar en este grupo</p>
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

