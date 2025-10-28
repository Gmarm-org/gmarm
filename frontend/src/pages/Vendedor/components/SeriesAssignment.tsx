import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface Serie {
  id: number;
  numeroSerie: string;
  estado: string;
}

interface SeriesAssignmentProps {
  armaId: number;
  armaNombre: string;
  clienteNombres: string;
  clienteApellidos: string;
  onSerieSelected: (serieId: number, numeroSerie: string) => void;
  onBack: () => void;
}

const SeriesAssignment: React.FC<SeriesAssignmentProps> = ({
  armaId,
  armaNombre,
  clienteNombres,
  clienteApellidos,
  onSerieSelected,
  onBack
}) => {
  const [seriesDisponibles, setSeriesDisponibles] = useState<Serie[]>([]);
  const [serieSeleccionada, setSerieSeleccionada] = useState<Serie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarSeriesDisponibles();
  }, [armaId]);

  const cargarSeriesDisponibles = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔢 Cargando series disponibles para arma:', armaId);
      
      // Obtener series disponibles
      const series = await apiService.getSeriesDisponibles(armaId);
      
      console.log('✅ Series disponibles cargadas:', series.length);
      setSeriesDisponibles(series);
      
      if (series.length === 0) {
        setError('No hay series disponibles para este arma en este momento.');
      }
    } catch (err) {
      console.error('❌ Error cargando series:', err);
      setError('Error al cargar las series disponibles. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSerieClick = (serie: Serie) => {
    setSerieSeleccionada(serie);
  };

  const handleConfirmar = () => {
    if (serieSeleccionada) {
      console.log('✅ Serie seleccionada:', serieSeleccionada);
      onSerieSelected(serieSeleccionada.id, serieSeleccionada.numeroSerie);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Botón Atrás */}
      <button 
        onClick={onBack}
        className="absolute left-4 top-4 sm:left-8 sm:top-8 bg-white text-red-600 hover:bg-red-50 rounded-lg px-4 py-3 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2 font-semibold group"
        title="Volver a selección de armas"
      >
        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Volver</span>
      </button>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-4xl">🔢</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Asignación de Serie</h1>
              <p className="text-blue-100 mt-1">Selecciona el número de serie del arma</p>
            </div>
          </div>
        </div>

        {/* Información del Cliente y Arma */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Cliente</p>
                <p className="text-lg font-bold text-gray-900">
                  {clienteNombres} {clienteApellidos}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🔫</span>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Arma Seleccionada</p>
                <p className="text-lg font-bold text-gray-900">{armaNombre}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando series disponibles...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <div>
                <h3 className="text-lg font-bold text-red-900">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
            <button
              onClick={cargarSeriesDisponibles}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Series Grid */}
        {!loading && !error && seriesDisponibles.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {seriesDisponibles.map((serie) => (
                <div
                  key={serie.id}
                  onClick={() => handleSerieClick(serie)}
                  className={`
                    bg-white rounded-xl p-6 cursor-pointer transition-all duration-200
                    ${serieSeleccionada?.id === serie.id
                      ? 'border-4 border-blue-500 shadow-2xl scale-105'
                      : 'border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">
                        {serieSeleccionada?.id === serie.id ? '✅' : '🔢'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Número de Serie</p>
                    <p className="text-lg font-bold text-gray-900 font-mono break-all">
                      {serie.numeroSerie}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Botones de Acción */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  {serieSeleccionada ? (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">✅</span>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Serie seleccionada</p>
                        <p className="text-xl font-bold text-gray-900 font-mono">
                          {serieSeleccionada.numeroSerie}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">👆</span>
                      <p className="text-gray-600 font-medium">
                        Selecciona un número de serie para continuar
                      </p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleConfirmar}
                  disabled={!serieSeleccionada}
                  className={`
                    px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 flex items-center gap-3
                    ${serieSeleccionada
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-2xl hover:scale-105'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }
                  `}
                >
                  <span>Continuar</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SeriesAssignment;

