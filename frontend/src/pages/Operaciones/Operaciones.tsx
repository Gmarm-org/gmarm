import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { apiService } from '../../services/api';
import AsignacionSeries from '../AsignacionSeries';
import GrupoImportacionDetalle from './components/GrupoImportacionDetalle';
import StatusBadge, { estadoOperacionVariant, estadoOperacionLabel } from '../../components/common/StatusBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

interface GrupoImportacion {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  documentosCargados?: number;
  documentosFaltantes?: number;
  documentosRequeridosCargados?: number;
  puedeNotificarPago?: boolean;
}

const Operaciones: React.FC = () => {
  const [vistaActual, setVistaActual] = useState<'grupos' | 'series'>('grupos');
  const [grupos, setGrupos] = useState<GrupoImportacion[]>([]);
  const [gruposFiltrados, setGruposFiltrados] = useState<GrupoImportacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    if (vistaActual === 'grupos') {
      cargarGrupos();
    }
  }, [vistaActual]);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      const data = await apiService.getGruposParaOperaciones();
      setGrupos(data);
      aplicarFiltros(data);
    } catch (error) {
      console.error('Error cargando grupos:', error);
      alert('Error al cargar los grupos de importación');
    } finally {
      setLoading(false);
    }
  };

  const aplicarFiltros = (gruposList: GrupoImportacion[]) => {
    let filtrados = [...gruposList];

    // Filtro por estado
    if (filtroEstado !== 'TODOS') {
      filtrados = filtrados.filter(g => g.estado === filtroEstado);
    }

    // Búsqueda por nombre o descripción
    if (busqueda.trim()) {
      const busquedaLower = busqueda.toLowerCase();
      filtrados = filtrados.filter(g => 
        g.nombre?.toLowerCase().includes(busquedaLower) ||
        g.descripcion?.toLowerCase().includes(busquedaLower)
      );
    }

    setGruposFiltrados(filtrados);
  };

  useEffect(() => {
    aplicarFiltros(grupos);
  }, [filtroEstado, busqueda, grupos]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Operaciones" subtitle="Gestión de grupos de importación y documentos" />

      <div className="w-full px-6 py-6">
        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => {
              setVistaActual('grupos');
              setGrupoSeleccionado(null);
            }}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'grupos'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📦 Grupos de Importación
          </button>
          
          <button
            onClick={() => setVistaActual('series')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'series'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔢 Asignación de Series
          </button>
        </div>

        {/* Contenido: Grupos de Importación */}
        {vistaActual === 'grupos' && (
          <>
            {grupoSeleccionado ? (
              <GrupoImportacionDetalle
                grupoId={grupoSeleccionado}
                onVolver={() => {
                  setGrupoSeleccionado(null);
                  cargarGrupos();
                }}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">📋 Grupos de Importación</h2>
                  <button
                    onClick={cargarGrupos}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                  >
                    🔄 Actualizar
                  </button>
                </div>

                {/* Filtros y Búsqueda */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Búsqueda */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      🔍 Búsqueda
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre o descripción..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Filtro por Estado */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      📊 Filtrar por Estado
                    </label>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="TODOS">Todos los estados</option>
                      <option value="SOLICITAR_PROFORMA_FABRICA">Solicitar Proforma</option>
                      <option value="EN_PROCESO_OPERACIONES">En Proceso</option>
                      <option value="NOTIFICAR_AGENTE_ADUANERO">Notificar Agente</option>
                      <option value="EN_ESPERA_DOCUMENTOS_CLIENTE">Esperando Documentos</option>
                      <option value="COMPLETADO">Completado</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <LoadingSpinner />
                ) : gruposFiltrados.length === 0 ? (
                  <EmptyState
                    message={grupos.length === 0
                      ? 'No hay grupos de importación en proceso de operaciones'
                      : undefined}
                    searchTerm={busqueda || (filtroEstado !== 'TODOS' ? filtroEstado : undefined)}
                    onClearFilters={() => { setBusqueda(''); setFiltroEstado('TODOS'); }}
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Grupo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Documentos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha Actualización
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {gruposFiltrados.map((grupo) => (
                          <tr key={grupo.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{grupo.nombre}</div>
                                {grupo.descripcion && (
                                  <div className="text-sm text-gray-500">{grupo.descripcion}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <StatusBadge label={estadoOperacionLabel(grupo.estado)} variant={estadoOperacionVariant(grupo.estado)} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {/* Indicadores de documentos */}
                              {grupo.documentosCargados !== undefined && grupo.documentosFaltantes !== undefined ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${
                                      grupo.documentosFaltantes === 0 
                                        ? 'text-green-600' 
                                        : grupo.documentosFaltantes <= 3
                                        ? 'text-orange-600'
                                        : 'text-red-600'
                                    }`}>
                                      📄 {grupo.documentosCargados}/{grupo.documentosCargados + grupo.documentosFaltantes} documentos
                                    </span>
                                  </div>
                                  {grupo.documentosRequeridosCargados !== undefined && (
                                    <div className="text-xs text-gray-600">
                                      Requeridos: {grupo.documentosRequeridosCargados}/3
                                      {grupo.puedeNotificarPago && (
                                        <span className="ml-2 text-green-600 font-medium">✓ Listo para notificar pago</span>
                                      )}
                                    </div>
                                  )}
                                  {grupo.documentosFaltantes > 0 && (
                                    <div className="text-xs text-orange-600">
                                      ⚠️ Faltan {grupo.documentosFaltantes} documento(s)
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">Cargando...</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {grupo.fechaActualizacion 
                                ? new Date(grupo.fechaActualizacion).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : new Date(grupo.fechaCreacion).toLocaleDateString('es-ES', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => setGrupoSeleccionado(grupo.id)}
                                className="text-blue-600 hover:text-blue-900 bg-blue-50 px-4 py-2 rounded-md"
                              >
                                Ver Detalle
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Contenido: Asignación de Series */}
        {vistaActual === 'series' && (
          <AsignacionSeries />
        )}
      </div>
    </div>
  );
};

export default Operaciones;
