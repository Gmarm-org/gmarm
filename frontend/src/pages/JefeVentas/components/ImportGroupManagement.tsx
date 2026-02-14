import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import ModalCrearGrupo from './ModalCrearGrupo';
import GrupoImportacionDetalleModal from './GrupoImportacionDetalleModal';
import AgregarClientesModal from './AgregarClientesModal';

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

interface GrupoImportacion {
  id: number;
  nombre: string;
  descripcion?: string;
  estado: string;
  fechaCreacion: string;
  fechaActualizacion?: string;
  licencia?: {
    id: number;
    numero: string;
    nombre?: string;
  };
  documentosGenerados?: Array<{
    id: number;
    nombreArchivo: string;
    fechaGeneracion: string;
  }>;
}

const ImportGroupManagement: React.FC = () => {
  const [grupos, setGrupos] = useState<GrupoImportacionResumen[]>([]);
  const [gruposCompletos, setGruposCompletos] = useState<GrupoImportacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [puedeDefinirPedido, setPuedeDefinirPedido] = useState<Record<number, boolean>>({});
  const [motivoDefinirPedido, setMotivoDefinirPedido] = useState<Record<number, string>>({});
  const [definiendoPedido, setDefiniendoPedido] = useState<number | null>(null);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<number | null>(null);
  const [mostrarAgregarClientes, setMostrarAgregarClientes] = useState<number | null>(null);
  const [mostrarCrearGrupo, setMostrarCrearGrupo] = useState(false);
  const [grupoAEditar, setGrupoAEditar] = useState<number | null>(null);
  const [documentoGenerado, setDocumentoGenerado] = useState<{
    documentoId: number;
    nombreArchivo: string;
    grupoId: number;
  } | null>(null);

  useEffect(() => {
    cargarGrupos();
  }, []);

  const cargarGrupos = async () => {
    setLoading(true);
    try {
      const response = await apiService.getGruposParaJefeVentas(0, 100);
      const resumenes = Array.isArray(response) ? response : (response as any)?.content || (response as any)?.data || [];
      
      setGrupos(resumenes || []);

      const gruposCompletosPromises = resumenes.map(async (resumen: GrupoImportacionResumen) => {
        try {
          const grupoCompleto = await apiService.getGrupoImportacion(resumen.grupoId);
          return grupoCompleto;
        } catch {
          return null;
        }
      });

      const gruposCompletosData = (await Promise.all(gruposCompletosPromises)).filter((g: GrupoImportacion | null): g is GrupoImportacion => g !== null);
      setGruposCompletos(gruposCompletosData);

      const puedeDefinirPromises = resumenes.map(async (resumen: GrupoImportacionResumen) => {
        try {
          const resultado = await apiService.puedeDefinirPedido(resumen.grupoId);
          return { grupoId: resumen.grupoId, puede: resultado.puedeDefinir, mensaje: resultado.mensaje };
        } catch {
          return { grupoId: resumen.grupoId, puede: false, mensaje: 'No se pudo verificar el estado del grupo' };
        }
      });

      const resultados = await Promise.all(puedeDefinirPromises);
      const puedeDefinirMap: Record<number, boolean> = {};
      const motivoMap: Record<number, string> = {};
      resultados.forEach((r: { grupoId: number; puede: boolean; mensaje?: string }) => {
        puedeDefinirMap[r.grupoId] = r.puede;
        if (r.mensaje) {
          motivoMap[r.grupoId] = r.mensaje;
        }
      });
      setPuedeDefinirPedido(puedeDefinirMap);
      setMotivoDefinirPedido(motivoMap);

    } catch (error: any) {
      if (error?.message?.includes('404') || error?.message?.includes('Not Found')) {
        setGrupos([]);
      } else {
        console.error('Error cargando grupos:', error instanceof Error ? error.message : 'Error desconocido');
        if (!error?.message?.includes('403')) {
          alert('Error al cargar los grupos de importación');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDefinirPedido = async (grupoId: number) => {
    if (!confirm('¿Estás seguro de definir el pedido? Esto generará el documento Excel y cambiará el estado del grupo.')) {
      return;
    }

    try {
      setDefiniendoPedido(grupoId);
      const resultado = await apiService.definirPedido(grupoId);
      setDocumentoGenerado({
        documentoId: resultado.documentoId,
        nombreArchivo: resultado.nombreArchivo,
        grupoId: grupoId
      });
      cargarGrupos();
    } catch (error: any) {
      console.error('Error definiendo pedido:', error instanceof Error ? error.message : 'Error desconocido');
      alert(error.message || 'Error al definir el pedido');
    } finally {
      setDefiniendoPedido(null);
    }
  };

  const verPDF = (documentoId: number) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${documentoId}`;
    window.open(url, '_blank');
  };

  const descargarPDF = (documentoId: number, nombreArchivo: string) => {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${documentoId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getEstadoBadge = (estado: string) => {
    const estados: Record<string, { bg: string; text: string; label: string }> = {
      'BORRADOR': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Borrador' },
      'EN_PREPARACION': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'En Preparación' },
      'EN_PROCESO_ASIGNACION_CLIENTES': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Asignando Clientes' },
      'SOLICITAR_PROFORMA_FABRICA': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Solicitar Proforma' },
      'EN_PROCESO_OPERACIONES': { bg: 'bg-purple-100', text: 'text-purple-800', label: 'En Operaciones' },
      'NOTIFICAR_AGENTE_ADUANERO': { bg: 'bg-indigo-100', text: 'text-indigo-800', label: 'Notificar Agente' },
      'EN_ESPERA_DOCUMENTOS_CLIENTE': { bg: 'bg-pink-100', text: 'text-pink-800', label: 'Esperando Documentos' },
      'COMPLETADO': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completado' },
      'CANCELADO': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
      'SUSPENDIDO': { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Suspendido' },
    };

    const estadoConfig = estados[estado] || { bg: 'bg-gray-100', text: 'text-gray-800', label: estado };
    
    return (
      <span className={`px-2 py-1 ${estadoConfig.bg} ${estadoConfig.text} text-xs font-medium rounded-full`}>
        {estadoConfig.label}
      </span>
    );
  };

  const obtenerGrupoCompleto = (grupoId: number): GrupoImportacion | undefined => {
    return gruposCompletos.find(g => g.id === grupoId);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const gruposProximosACompletar = grupos.filter(g => 
    g.cupoCivilRestante !== undefined && g.cupoCivilRestante <= 5 && g.cupoCivilRestante > 0
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">📦 Importaciones</h2>
          {gruposProximosACompletar.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                ℹ️ {gruposProximosACompletar.length} grupo(s) próximo(s) a completar cupo civil (≤5 cupos restantes) - Listos para Operaciones
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarCrearGrupo(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center gap-2"
          >
            ➕ Crear Grupo
          </button>
          <button
            onClick={cargarGrupos}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID / Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Última Actualización
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {grupos.map((resumen) => {
                const grupoCompleto = obtenerGrupoCompleto(resumen.grupoId);
                const puedeDefinir = puedeDefinirPedido[resumen.grupoId] || false;
                const estaDefiniendo = definiendoPedido === resumen.grupoId;

                const proximoACompletar = resumen.cupoCivilRestante !== undefined && 
                                         resumen.cupoCivilRestante <= 5 && 
                                         resumen.cupoCivilRestante > 0;
                const cupoCompleto = resumen.cupoCivilRestante !== undefined && resumen.cupoCivilRestante === 0;

                return (
                  <tr 
                    key={resumen.grupoId} 
                    className={`hover:bg-gray-50 ${
                      proximoACompletar 
                        ? 'bg-blue-50 border-l-4 border-blue-400' 
                        : cupoCompleto
                        ? 'bg-green-50 border-l-4 border-green-400'
                        : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">ID: {resumen.grupoId}</div>
                        <div className="text-sm text-gray-500">{resumen.grupoNombre}</div>
                        <div className="text-xs text-gray-400">{resumen.grupoCodigo}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {resumen.fechaUltimaActualizacion
                        ? new Date(resumen.fechaUltimaActualizacion).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {grupoCompleto ? getEstadoBadge(grupoCompleto.estado) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grupoCompleto?.licencia?.numero || (
                          <span className="text-gray-400 italic">Sin licencia</span>
                        )}
                      </div>
                      {grupoCompleto?.licencia?.nombre && (
                        <div className="text-xs text-gray-500">{grupoCompleto.licencia.nombre}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setGrupoSeleccionado(resumen.grupoId)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs font-medium"
                        >
                          👁️ Ver
                        </button>

                        {/* Botón Editar - solo visible si el pedido NO está definido */}
                        {(!grupoCompleto ||
                          grupoCompleto.estado === 'BORRADOR' ||
                          grupoCompleto.estado === 'EN_PREPARACION' ||
                          grupoCompleto.estado === 'EN_PROCESO_ASIGNACION_CLIENTES') && (
                          <button
                            onClick={() => setGrupoAEditar(resumen.grupoId)}
                            className="text-purple-600 hover:text-purple-900 bg-purple-50 px-3 py-1 rounded-md text-xs font-medium"
                            title="Editar vendedores y límites del grupo"
                          >
                            ✏️ Editar
                          </button>
                        )}
                        
                        {/* Botón Agregar Clientes - siempre visible, deshabilitado si el estado no lo permite */}
                        {(() => {
                          const puedeAgregar = !grupoCompleto || // Si no se ha cargado, permitir
                            grupoCompleto.estado === 'EN_PROCESO_ASIGNACION_CLIENTES' ||
                            grupoCompleto.estado === 'EN_PREPARACION' ||
                            grupoCompleto.estado === 'BORRADOR';
                          
                          return (
                            <button
                              onClick={() => puedeAgregar && setMostrarAgregarClientes(resumen.grupoId)}
                              disabled={!puedeAgregar}
                              className={`px-3 py-1 rounded-md text-xs font-medium ${
                                puedeAgregar
                                  ? 'text-green-600 hover:text-green-900 bg-green-50 cursor-pointer'
                                  : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                              }`}
                              title={puedeAgregar 
                                ? 'Agregar clientes al grupo de importación'
                                : 'No se pueden agregar clientes en el estado actual del grupo'}
                            >
                              ➕ Agregar Clientes
                            </button>
                          );
                        })()}
                        
                        <button
                          onClick={() => puedeDefinir && handleDefinirPedido(resumen.grupoId)}
                          disabled={!puedeDefinir || estaDefiniendo}
                          title={!puedeDefinir ? (motivoDefinirPedido[resumen.grupoId] || 'Existen clientes sin todos los documentos cargados, verifica y vuelve a intentar cuando todos los clientes estén cargados') : 'Definir pedido de importación'}
                          className={`px-3 py-1 rounded-md text-xs font-medium ${
                            !puedeDefinir
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : estaDefiniendo
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {estaDefiniendo ? 'Definiendo...' : '📋 Definir Pedido'}
                        </button>
                        
                        {/* Botón Ver Documento - mostrar si hay documentos generados */}
                        {grupoCompleto?.documentosGenerados && grupoCompleto.documentosGenerados.length > 0 && (
                          <button
                            onClick={() => {
                              const ultimoDocumento = grupoCompleto.documentosGenerados![grupoCompleto.documentosGenerados!.length - 1];
                              verPDF(ultimoDocumento.id);
                            }}
                            className="px-3 py-1 rounded-md text-xs font-medium text-purple-600 hover:text-purple-900 bg-purple-50"
                            title="Ver documento generado"
                          >
                            📄 Ver Documento
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {grupos.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay importaciones creadas</p>
            <p className="text-gray-400 text-sm mt-2">
              Las importaciones aparecerán aquí cuando sean creadas
            </p>
          </div>
        )}
      </div>


      {grupoSeleccionado && (
        <GrupoImportacionDetalleModal
          grupoId={grupoSeleccionado}
          onClose={() => setGrupoSeleccionado(null)}
          onRefresh={cargarGrupos}
        />
      )}

      {mostrarAgregarClientes && (
        <AgregarClientesModal
          grupoId={mostrarAgregarClientes}
          onClose={() => setMostrarAgregarClientes(null)}
          onRefresh={cargarGrupos}
        />
      )}

      {mostrarCrearGrupo && (
        <ModalCrearGrupo
          onClose={() => setMostrarCrearGrupo(false)}
          onSuccess={() => {
            setMostrarCrearGrupo(false);
            cargarGrupos();
          }}
          modo="crear"
        />
      )}
      
      {grupoAEditar && (
        <ModalCrearGrupo
          grupoId={grupoAEditar}
          modo="editar"
          onClose={() => setGrupoAEditar(null)}
          onSuccess={() => {
            setGrupoAEditar(null);
            cargarGrupos();
          }}
        />
      )}

      {/* Modal para ver/descargar PDF después de generar */}
      {documentoGenerado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">✅ Pedido Definido Exitosamente</h3>
              <button
                onClick={() => setDocumentoGenerado(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                El documento Excel del pedido ha sido generado exitosamente:
              </p>
              <p className="font-semibold text-blue-600 bg-blue-50 p-2 rounded-lg">
                {documentoGenerado.nombreArchivo}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => verPDF(documentoGenerado.documentoId)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver Documento Excel
              </button>
              
              <button
                onClick={() => descargarPDF(documentoGenerado.documentoId, documentoGenerado.nombreArchivo)}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Descargar Documento Excel
              </button>
              
              <button
                onClick={() => setDocumentoGenerado(null)}
                className="w-full px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportGroupManagement;
