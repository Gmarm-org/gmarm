import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface GrupoImportacion {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  tipoGrupo?: 'CUPO' | 'JUSTIFICATIVO';
  limitesCategoria?: Array<{
    categoriaArmaId: number;
    categoriaArmaNombre: string;
    categoriaArmaCodigo: string;
    limiteMaximo: number;
  }>;
  cuposDisponiblesPorCategoria?: Record<number, number>;
  licencia?: {
    id: number;
    numero: string;
    nombre?: string;
  };
}

interface GrupoImportacionResumen {
  grupoId: number;
  grupoNombre: string;
  grupoCodigo: string;
  clientesCiviles: number;
  clientesUniformados: number;
  clientesEmpresas: number;
  clientesDeportistas: number;
  totalClientes: number;
  fechaUltimaActualizacion: string;
  cupoCivilTotal?: number;
  cupoCivilDisponible?: number;
  cupoCivilRestante?: number;
}

interface GrupoImportacionDetalleModalProps {
  grupoId: number;
  onClose: () => void;
  onRefresh: () => void;
}

const GrupoImportacionDetalleModal: React.FC<GrupoImportacionDetalleModalProps> = ({ 
  grupoId, 
  onClose 
}) => {
  const [grupo, setGrupo] = useState<GrupoImportacion | null>(null);
  const [resumen, setResumen] = useState<GrupoImportacionResumen | null>(null);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [grupoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [grupoData, resumenData, clientesData] = await Promise.all([
        apiService.getGrupoImportacion(grupoId).catch((err) => {
          console.error('Error cargando grupo:', err);
          return null;
        }),
        apiService.getResumenGrupo(grupoId).catch((err) => {
          console.error('Error cargando resumen:', err);
          return null;
        }),
        apiService.getClientesDelGrupo(grupoId).catch((err) => {
          console.error('Error cargando clientes:', err);
          return [];
        }),
      ]);
      setGrupo(grupoData);
      setResumen(resumenData);
      setClientes(clientesData || []);
      
      // Solo mostrar alert si realmente falló algo crítico
      if (!grupoData && !resumenData) {
        alert('No se pudieron cargar los datos del grupo. Por favor, intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error cargando datos del grupo:', error);
      // No mostrar alert genérico, ya se maneja arriba
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            📦 Detalle del Grupo de Importación
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Información General */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ID del Grupo</label>
              <p className="text-lg font-semibold">{grupo?.id || resumen?.grupoId || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Nombre</label>
              <p className="text-lg font-semibold">{grupo?.nombre || resumen?.grupoNombre || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Estado</label>
              <p className="text-lg font-semibold">{grupo?.estado || 'N/A'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Licencia</label>
              <p className="text-lg font-semibold">
                {grupo?.licencia?.numero || <span className="text-gray-400 italic">Sin licencia</span>}
              </p>
              {grupo?.licencia?.nombre && (
                <p className="text-sm text-gray-500">{grupo.licencia.nombre}</p>
              )}
            </div>
          </div>

          {/* Resumen de Clientes */}
          {resumen && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3">📊 Resumen de Clientes</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{resumen.clientesCiviles}</div>
                  <div className="text-sm text-gray-600">Civiles</div>
                  {resumen.cupoCivilRestante !== undefined && resumen.cupoCivilRestante <= 5 && resumen.cupoCivilRestante > 0 && (
                    <div className={`mt-2 px-2 py-1 rounded text-xs font-medium ${
                      resumen.cupoCivilRestante <= 1 
                        ? 'bg-blue-100 text-blue-800' 
                        : resumen.cupoCivilRestante <= 3
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-blue-50 text-blue-600'
                    }`}>
                      ℹ️ {resumen.cupoCivilRestante === 1 ? 'Casi completo' : `${resumen.cupoCivilRestante} cupos restantes`}
                    </div>
                  )}
                  {resumen.cupoCivilRestante !== undefined && resumen.cupoCivilRestante === 0 && (
                    <div className="mt-2 px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                      ✅ Cupo completo ({resumen.cupoCivilTotal || 25}/{resumen.cupoCivilTotal || 25})
                    </div>
                  )}
                  {resumen.cupoCivilRestante !== undefined && resumen.cupoCivilRestante > 5 && (
                    <div className="mt-1 text-xs text-gray-500">
                      Disponible: {resumen.cupoCivilRestante}/{resumen.cupoCivilTotal || 25}
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{resumen.clientesUniformados}</div>
                  <div className="text-sm text-gray-600">Uniformados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{resumen.clientesEmpresas}</div>
                  <div className="text-sm text-gray-600">Empresas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{resumen.clientesDeportistas}</div>
                  <div className="text-sm text-gray-600">Deportistas</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <span className="text-sm text-gray-500">Total: </span>
                <span className="text-lg font-bold">{resumen.totalClientes}</span>
              </div>
            </div>
          )}

          {/* Alertas de Cupos por Categoría (solo para tipo CUPO) */}
          {grupo?.tipoGrupo === 'CUPO' && grupo.limitesCategoria && grupo.limitesCategoria.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">📊 Cupos Disponibles por Categoría</h3>
              <div className="space-y-2">
                {grupo.limitesCategoria.map((limite) => {
                  const cuposDisponibles = grupo.cuposDisponiblesPorCategoria?.[limite.categoriaArmaId] ?? limite.limiteMaximo;
                  const quedanPocos = cuposDisponibles <= 5 && cuposDisponibles > 0;
                  const sinCupo = cuposDisponibles === 0;
                  
                  return (
                    <div 
                      key={limite.categoriaArmaId}
                      className={`p-3 rounded-lg border ${
                        sinCupo
                          ? 'bg-red-50 border-red-300'
                          : quedanPocos
                          ? 'bg-yellow-50 border-yellow-300'
                          : 'bg-green-50 border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-semibold text-gray-900">{limite.categoriaArmaNombre}</span>
                          <span className="text-xs text-gray-500 ml-2">({limite.categoriaArmaCodigo})</span>
                        </div>
                        <div className={`text-lg font-bold ${
                          sinCupo
                            ? 'text-red-700'
                            : quedanPocos
                            ? 'text-yellow-700'
                            : 'text-green-700'
                        }`}>
                          {cuposDisponibles}/{limite.limiteMaximo} disponibles
                        </div>
                      </div>
                      {sinCupo && (
                        <div className="mt-2 text-xs text-red-700 font-medium">
                          ⚠️ Cupo completo - No se pueden asignar más clientes de esta categoría
                        </div>
                      )}
                      {quedanPocos && !sinCupo && (
                        <div className="mt-2 text-xs text-yellow-700 font-medium">
                          ⚠️ Quedan pocos cupos disponibles - {cuposDisponibles} restantes
                        </div>
                      )}
                      {!quedanPocos && !sinCupo && (
                        <div className="mt-1 text-xs text-green-700">
                          ✅ Cupo disponible: {cuposDisponibles} de {limite.limiteMaximo}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Clientes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">👥 Clientes Asignados</h3>
            {clientes.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay clientes asignados a este grupo</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombres</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellidos</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td className="px-4 py-2 text-sm">{cliente.clienteCedula}</td>
                        <td className="px-4 py-2 text-sm">{cliente.clienteNombres}</td>
                        <td className="px-4 py-2 text-sm">{cliente.clienteApellidos}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {cliente.estado}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default GrupoImportacionDetalleModal;

