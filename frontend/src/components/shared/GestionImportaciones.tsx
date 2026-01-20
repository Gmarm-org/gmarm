import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import ModalCargarDocumento from './modals/ModalCargarDocumento';
import ModalGenerarAutorizaciones from './modals/ModalGenerarAutorizaciones';
import ModalRegistrarPagos from './modals/ModalRegistrarPagos';

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
  estado?: string;
}

interface ClienteGrupo {
  id: number;
  clienteId: number;
  clienteNombres: string;
  clienteApellidos: string;
  clienteCedula: string;
  estado: string;
  documentosCompletos?: boolean;
}

interface ProcesoImportacion {
  id: number;
  etapa: string;
  etapaLabel: string;
  fechaPlanificada: string | null;
  completado: boolean;
  enAlerta: boolean;
  diasRestantes: number | null;
}

const etapasOrden: string[] = [
  'INGRESO_DOCUMENTACION',
  'INSPECCION',
  'RESOLUCION',
  'PREVIA_IMPORTACION_INICIO',
  'PREVIA_IMPORTACION_FINALIZADA',
  'PAGO_FABRICA',
  'AWB',
  'GUIA_AVIANCA',
  'AFORO',
  'GUIA_LIBRE_TRANSITO',
  'SALIDA_AEROPUERTO',
  'LIBERACION_CUPO',
  'LIQUIDACION'
];

const etiquetasEtapas: Record<string, string> = {
  INGRESO_DOCUMENTACION: 'Ingreso Documentación',
  INSPECCION: 'Inspección',
  RESOLUCION: 'Resolución',
  PREVIA_IMPORTACION_INICIO: 'Previa Importación Inicio',
  PREVIA_IMPORTACION_FINALIZADA: 'Previa Importación Finalizada',
  PAGO_FABRICA: 'Pago a Fábrica',
  AWB: 'AWB',
  GUIA_AVIANCA: 'Guía Avianca',
  AFORO: 'Aforo',
  GUIA_LIBRE_TRANSITO: 'Guía Libre Tránsito',
  SALIDA_AEROPUERTO: 'Salida Aeropuerto',
  LIBERACION_CUPO: 'Liberación Cupo',
  LIQUIDACION: 'Liquidación'
};

const GestionImportaciones: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoImportacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 20;
  const [procesosPorGrupo, setProcesosPorGrupo] = useState<Record<number, ProcesoImportacion[]>>({});
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [clientesGrupo, setClientesGrupo] = useState<ClienteGrupo[]>([]);
  const [mostrarModalPago, setMostrarModalPago] = useState<number | null>(null);
  const [mostrarModalAutorizacion, setMostrarModalAutorizacion] = useState<number | null>(null);
  const [mostrarModalDocumento, setMostrarModalDocumento] = useState<number | null>(null);
  const [alertasProceso, setAlertasProceso] = useState<Array<{
    grupoImportacionId: number;
    grupoNombre: string;
    etapaLabel?: string;
    fechaPlanificada?: string;
    diasRestantes?: number;
  }>>([]);

  useEffect(() => {
    cargarGrupos();
  }, [page]);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      const response = await apiService.getGruposParaGestionImportaciones(page, pageSize);
      const data = Array.isArray(response) ? response : (response as any)?.content || (response as any)?.data || [];
      setGrupos(data);
      if (!Array.isArray(response) && (response as any)?.totalPages !== undefined) {
        setTotalPages((response as any).totalPages || 1);
      } else {
        setTotalPages(1);
      }

      const procesosData: Record<number, ProcesoImportacion[]> = {};
      await Promise.all(
        data.map(async (grupo: GrupoImportacionResumen) => {
          try {
            const procesos = await apiService.getProcesosGrupoImportacion(grupo.grupoId);
            procesosData[grupo.grupoId] = Array.isArray(procesos) ? procesos : [];
          } catch (error) {
            console.warn('No se pudo cargar procesos para grupo', grupo.grupoId, error);
            procesosData[grupo.grupoId] = [];
          }
        })
      );
      setProcesosPorGrupo(procesosData);
      try {
        const alertas = await apiService.getAlertasProcesosImportacion();
        setAlertasProceso(Array.isArray(alertas) ? alertas : []);
      } catch (error) {
        console.warn('No se pudieron cargar alertas de procesos:', error);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      alert('Error al cargar los grupos de importación');
    } finally {
      setLoading(false);
    }
  };

  const cargarClientesGrupo = async (grupoId: number) => {
    try {
      const clientes = await apiService.getClientesDelGrupo(grupoId);
      setClientesGrupo(clientes);
    } catch (error) {
      console.error('Error cargando clientes del grupo:', error);
      alert('Error al cargar los clientes del grupo');
    }
  };

  const actualizarProceso = async (grupoId: number, etapa: string, cambios: Partial<ProcesoImportacion>) => {
    try {
      const updates = [
        {
          etapa,
          fechaPlanificada: cambios.fechaPlanificada ?? null,
          completado: typeof cambios.completado === 'boolean' ? cambios.completado : null
        }
      ];
      const data = await apiService.actualizarProcesosGrupoImportacion(grupoId, updates);
      setProcesosPorGrupo((prev) => ({
        ...prev,
        [grupoId]: Array.isArray(data) ? data : prev[grupoId]
      }));
    } catch (error) {
      console.error('Error actualizando proceso:', error);
      alert('No se pudo actualizar el proceso');
    }
  };

  // TODO: Obtener estado real del grupo desde el backend
  // const getEstadoBadge = (estado: string) => {
  //   const estados: Record<string, { bg: string; text: string; label: string }> = {
  //     'NOTIFICAR_AGENTE_ADUANERO': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Notificar Agente' },
  //     'EN_ESPERA_DOCUMENTOS_CLIENTE': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Esperando Documentos' },
  //     'COMPLETADO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
  //   };
  //   const estadoConfig = estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-800', label: estado };
  //   return (
  //     <span className={`px-2 py-1 ${estadoConfig.bg} ${estadoConfig.text} text-xs font-medium rounded-full`}>
  //       {estadoConfig.label}
  //     </span>
  //   );
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📦 Gestión de Importaciones</h2>
          {alertasProceso.length > 0 && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              ⚠️ {alertasProceso.length} alerta(s) de procesos pendientes con fecha cercana.
            </div>
          )}
          <p className="text-sm text-gray-600 mt-1">
            Lista de grupos de importación activos
          </p>
        </div>
        <button
          onClick={cargarGrupos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
        >
          🔄 Actualizar
        </button>
      </div>

      {grupos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No hay grupos de importación creados</p>
          <p className="text-gray-400 text-sm mt-2">
            Los grupos aparecerán aquí cuando sean creados
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detalle</th>
                {etapasOrden.map((etapa) => (
                  <th key={etapa} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {etiquetasEtapas[etapa] || etapa}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grupos.map((grupo) => {
                const procesos = procesosPorGrupo[grupo.grupoId] || [];
                const procesosMap = new Map(procesos.map((p) => [p.etapa, p]));
                const estadoGrupo = grupo.estado;
                const checklistHabilitado = estadoGrupo && !['BORRADOR', 'EN_PREPARACION', 'EN_PROCESO_ASIGNACION_CLIENTES'].includes(estadoGrupo);

                return (
                  <React.Fragment key={grupo.grupoId}>
                    <tr>
                      <td className="px-3 py-2 text-sm text-gray-900 whitespace-nowrap">
                        <div className="font-semibold">{grupo.grupoNombre}</div>
                        <div className="text-xs text-gray-500">{grupo.grupoCodigo}</div>
                        <div className="text-xs text-gray-400">
                          Última actualización: {grupo.fechaUltimaActualizacion
                            ? new Date(grupo.fechaUltimaActualizacion).toLocaleDateString('es-ES')
                            : '-'}
                        </div>
                      </td>
                      {etapasOrden.map((etapa) => {
                        const proceso = procesosMap.get(etapa);
                        return (
                          <td key={etapa} className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={!!proceso?.completado}
                              disabled={!checklistHabilitado}
                              onChange={(event) => actualizarProceso(grupo.grupoId, etapa, { completado: event.target.checked })}
                              className="h-4 w-4 text-blue-600 disabled:opacity-50"
                            />
                          </td>
                        );
                      })}
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-3 py-2 text-xs text-gray-500">Fecha límite</td>
                      {etapasOrden.map((etapa) => {
                        const proceso = procesosMap.get(etapa);
                        return (
                          <td key={etapa} className="px-3 py-2 text-center">
                            <input
                              type="date"
                              value={proceso?.fechaPlanificada ?? ''}
                              disabled={!checklistHabilitado}
                              onChange={(event) => actualizarProceso(grupo.grupoId, etapa, { fechaPlanificada: event.target.value || null })}
                              className="border border-gray-300 rounded px-2 py-1 text-xs disabled:bg-gray-100 disabled:text-gray-400"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            disabled={page === 0}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm disabled:opacity-50"
          >
            ← Anterior
          </button>
          <div className="text-sm text-gray-600">
            Página {page + 1} de {totalPages}
          </div>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm disabled:opacity-50"
          >
            Siguiente →
          </button>
        </div>
      )}

      {alertasProceso.length > 0 && (
        <div className="mt-6 border border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="text-sm font-semibold text-red-700 mb-2">Alertas de procesos pendientes</h3>
          <div className="space-y-2 text-sm text-gray-700">
            {alertasProceso.map((alerta) => (
              <div key={`${alerta.grupoImportacionId}-${alerta.etapaLabel || alerta.fechaPlanificada}`} className="flex flex-wrap gap-2">
                <span className="font-medium">{alerta.grupoNombre}</span>
                <span>• {alerta.etapaLabel || 'Proceso'}</span>
                {alerta.fechaPlanificada && <span>• {alerta.fechaPlanificada}</span>}
                {alerta.diasRestantes !== undefined && alerta.diasRestantes !== null && (
                  <span className="text-red-600">• {alerta.diasRestantes} días</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Detalle del Grupo */}
      {grupoSeleccionado && (
        <DetalleGrupoModal
          grupoId={grupoSeleccionado}
          clientes={clientesGrupo}
          onClose={() => {
            setGrupoSeleccionado(null);
            setClientesGrupo([]);
          }}
          onRefresh={cargarGrupos}
        />
      )}

      {/* Modal de Cargar Documento Comando Conjunto */}
      {mostrarModalDocumento && (
        <ModalCargarDocumento
          grupoId={mostrarModalDocumento}
          onClose={() => setMostrarModalDocumento(null)}
          onSuccess={() => {
            setMostrarModalDocumento(null);
            cargarGrupos();
          }}
        />
      )}

      {/* Modal de Generar Autorizaciones */}
      {mostrarModalAutorizacion && (
        <ModalGenerarAutorizaciones
          grupoId={mostrarModalAutorizacion}
          clientes={clientesGrupo.length > 0 ? clientesGrupo : []}
          onClose={async () => {
            setMostrarModalAutorizacion(null);
            // Cargar clientes si no están cargados
            if (clientesGrupo.length === 0) {
              await cargarClientesGrupo(mostrarModalAutorizacion);
            }
          }}
          onRefresh={cargarGrupos}
        />
      )}

      {/* Modal de Registrar Pagos */}
      {mostrarModalPago && (
        <ModalRegistrarPagos
          grupoId={mostrarModalPago}
          clientes={clientesGrupo.length > 0 ? clientesGrupo : []}
          onClose={async () => {
            setMostrarModalPago(null);
            // Cargar clientes si no están cargados
            if (clientesGrupo.length === 0) {
              await cargarClientesGrupo(mostrarModalPago);
            }
          }}
          onRefresh={cargarGrupos}
        />
      )}
    </div>
  );
};

// Componente Modal de Detalle
interface DetalleGrupoModalProps {
  grupoId: number;
  clientes: ClienteGrupo[];
  onClose: () => void;
  onRefresh: () => void;
}

const DetalleGrupoModal: React.FC<DetalleGrupoModalProps> = ({ clientes, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📦 Detalle del Grupo</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold mb-3">👥 Clientes del Grupo</h3>
          {clientes.length === 0 ? (
            <p className="text-gray-500">Cargando clientes...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombres</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellidos</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Documentos</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientes.map((cliente) => {
                    const documentosCompletos = cliente.documentosCompletos !== false; // Default a true si no viene
                    
                    return (
                      <tr key={cliente.id}>
                        <td className="px-4 py-2 text-sm">{cliente.clienteCedula}</td>
                        <td className="px-4 py-2 text-sm">{cliente.clienteNombres}</td>
                        <td className="px-4 py-2 text-sm">{cliente.clienteApellidos}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {cliente.estado}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          {documentosCompletos ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              ✓ Completos
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                              ⚠ Faltan documentos
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => {
                              // TODO: Abrir modal para gestionar documentos del cliente
                              alert('Funcionalidad en desarrollo');
                            }}
                            className="text-blue-600 hover:text-blue-900 text-sm"
                          >
                            Ver Documentos
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

export default GestionImportaciones;

