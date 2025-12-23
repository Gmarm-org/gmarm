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

const GestionImportaciones: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoImportacionResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [clientesGrupo, setClientesGrupo] = useState<ClienteGrupo[]>([]);
  const [mostrarModalPago, setMostrarModalPago] = useState<number | null>(null);
  const [mostrarModalAutorizacion, setMostrarModalAutorizacion] = useState<number | null>(null);
  const [mostrarModalDocumento, setMostrarModalDocumento] = useState<number | null>(null);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      const data = await apiService.getGruposParaGestionImportaciones();
      setGrupos(data);
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
          <p className="text-sm text-gray-600 mt-1">
            Grupos en estados avanzados: Notificar Agente Aduanero o Esperando Documentos
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
          <p className="text-gray-500 text-lg">No hay grupos de importación en gestión avanzada</p>
          <p className="text-gray-400 text-sm mt-2">
            Los grupos aparecerán aquí cuando estén en estado "Notificar Agente Aduanero" o "Esperando Documentos"
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grupos.map((grupo) => (
            <div key={grupo.grupoId} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{grupo.grupoNombre}</h3>
                  <p className="text-sm text-gray-500">Código: {grupo.grupoCodigo}</p>
                  <p className="text-sm text-gray-500">
                    Última actualización: {grupo.fechaUltimaActualizacion 
                      ? new Date(grupo.fechaUltimaActualizacion).toLocaleDateString('es-ES')
                      : '-'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {/* TODO: Obtener estado real del grupo desde el backend */}
                  <button
                    onClick={() => {
                      setGrupoSeleccionado(grupo.grupoId);
                      cargarClientesGrupo(grupo.grupoId);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>

              {/* Resumen de clientes */}
              <div className="grid grid-cols-5 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{grupo.clientesCiviles}</div>
                  <div className="text-xs text-gray-600">Civiles</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{grupo.clientesUniformados}</div>
                  <div className="text-xs text-gray-600">Uniformados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{grupo.clientesEmpresas}</div>
                  <div className="text-xs text-gray-600">Empresas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{grupo.clientesDeportistas}</div>
                  <div className="text-xs text-gray-600">Deportistas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">{grupo.totalClientes}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={async () => {
                    setMostrarModalPago(grupo.grupoId);
                    // Cargar clientes si no están cargados
                    if (clientesGrupo.length === 0) {
                      await cargarClientesGrupo(grupo.grupoId);
                    }
                  }}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  💰 Registrar Pagos
                </button>
                <button
                  onClick={() => setMostrarModalDocumento(grupo.grupoId)}
                  className="px-3 py-1 bg-purple-600 text-white rounded-md text-sm hover:bg-purple-700"
                >
                  📄 Cargar Documento Comando Conjunto
                </button>
                <button
                  onClick={async () => {
                    setMostrarModalAutorizacion(grupo.grupoId);
                    // Cargar clientes si no están cargados
                    if (clientesGrupo.length === 0) {
                      await cargarClientesGrupo(grupo.grupoId);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  📋 Generar Autorizaciones
                </button>
                <button
                  onClick={async () => {
                    if (!confirm('¿Confirmas cambiar el estado del grupo a "Notificar Agente Aduanero"?')) {
                      return;
                    }
                    try {
                      setProcesando(true);
                      await apiService.notificarAgenteAduanero(grupo.grupoId);
                      alert('Estado del grupo actualizado exitosamente');
                      cargarGrupos();
                    } catch (error: any) {
                      console.error('Error cambiando estado:', error);
                      alert(error.message || 'Error al cambiar el estado del grupo');
                    } finally {
                      setProcesando(false);
                    }
                  }}
                  disabled={procesando}
                  className="px-3 py-1 bg-orange-600 text-white rounded-md text-sm hover:bg-orange-700 disabled:bg-gray-400"
                >
                  {procesando ? 'Procesando...' : '📢 Notificar Agente Aduanero'}
                </button>
              </div>
            </div>
          ))}
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

