import React, { useState } from 'react';
import { apiService } from '../../../services/api';
import { formatNombreCompleto } from '../../../utils/formatUtils';
import type { ClienteConVendedor } from '../types';

interface ClientDetailModalProps {
  cliente: ClienteConVendedor;
  onClose: () => void;
  loadingDetalleCliente: boolean;
  armasCliente: any[];
  documentosCliente: any[];
  contratosCliente: any[];
  setContratosCliente: (contratos: any[]) => void;
  pagosCliente: any[];
  vistaActual: string;
  user: any;
  onAbrirModalGenerarContrato: () => void;
  onAbrirModalEditarArma: (arma: any) => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  cliente,
  onClose,
  loadingDetalleCliente,
  armasCliente,
  documentosCliente,
  contratosCliente,
  setContratosCliente,
  pagosCliente,
  vistaActual,
  user,
  onAbrirModalGenerarContrato,
  onAbrirModalEditarArma,
}) => {
  const [mostrarCargarFirmado, setMostrarCargarFirmado] = useState<number | null>(null);
  const [archivoFirmado, setArchivoFirmado] = useState<File | null>(null);
  const [cargandoFirmado, setCargandoFirmado] = useState(false);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {formatNombreCompleto(cliente.nombres, cliente.apellidos)}
              </h2>
              <p className="text-gray-600">CI: {cliente.numeroIdentificacion}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Datos Personales */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos Personales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Tipo de Cliente</p>
                <p className="font-medium">{cliente.tipoClienteNombre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{cliente.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Teléfono</p>
                <p className="font-medium">{cliente.telefonoPrincipal}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Dirección</p>
                <p className="font-medium">{cliente.direccion || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Vendedor Responsable</p>
                <p className="font-medium text-blue-600">
                  {formatNombreCompleto(cliente.vendedorNombre, cliente.vendedorApellidos)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  cliente.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                  cliente.estado === 'SERIE_ASIGNADA' ? 'bg-green-100 text-green-800' :
                  cliente.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                  cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'bg-yellow-100 text-yellow-800' :
                  cliente.estado === 'EN_PROCESO' ? 'bg-blue-100 text-blue-800' :
                  cliente.estado === 'EN_CURSO_IMPORTACION' ? 'bg-purple-100 text-purple-800' :
                  cliente.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {cliente.estado === 'PENDIENTE_DOCUMENTOS' ? 'Faltan documentos' :
                   cliente.estado === 'LISTO_IMPORTACION' ? 'Listo para importación' :
                   cliente.estado === 'EN_CURSO_IMPORTACION' ? 'En curso de importación' :
                   cliente.estado === 'SERIE_ASIGNADA' ? 'Serie asignada' :
                   cliente.estado === 'EN_PROCESO' ? 'En proceso' :
                   cliente.estado === 'BLOQUEADO' ? 'Bloqueado' :
                   cliente.estado || 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Validado por Cliente</p>
                <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  cliente.emailVerificado === true ? 'bg-green-100 text-green-800' :
                  cliente.emailVerificado === false ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {cliente.emailVerificado === true ? 'Validado' :
                   cliente.emailVerificado === false ? 'Datos incorrectos' :
                   'Pendiente'}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600">Grupo de Importación</p>
                <p className="font-medium text-blue-600">{cliente.grupoImportacionNombre || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Licencia</p>
                {cliente.licenciaNombre ? (
                  <div>
                    <p className="font-medium text-purple-600">{cliente.licenciaNombre}</p>
                    {cliente.licenciaNumero && (
                      <p className="text-xs text-gray-500">Número: {cliente.licenciaNumero}</p>
                    )}
                  </div>
                ) : (
                  <p className="font-medium text-gray-400">N/A</p>
                )}
              </div>
            </div>
          </div>

          {loadingDetalleCliente ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Cargando información completa...</p>
            </div>
          ) : (
            <>
              {/* Armas Asignadas */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Armas Asignadas ({armasCliente.length})
                </h3>
                {armasCliente.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    No hay armas asignadas
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {armasCliente.map((arma, index) => (
                      <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                          <div>
                            <p className="text-sm text-gray-600">Arma</p>
                            <p className="font-semibold text-blue-600">{arma.armaModelo || arma.armaNombre || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Número de Serie</p>
                            <p className="font-mono font-semibold">{arma.numeroSerie || 'Sin asignar'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Cantidad</p>
                            <p className="font-medium">{arma.cantidad || 1}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Precio Unitario</p>
                            <p className="font-medium">${arma.precioUnitario?.toFixed(2) || '0.00'}</p>
                          </div>
                          <div className="flex items-end">
                            {arma.estado !== 'ASIGNADA' && arma.estado !== 'COMPLETADA' ? (
                              <button
                                onClick={() => onAbrirModalEditarArma(arma)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                                title="Editar arma asignada"
                              >
                                Editar Arma
                              </button>
                            ) : (
                              <span className="text-xs text-gray-500">No editable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documentos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentos ({documentosCliente.length})
                </h3>
                {documentosCliente.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    No hay documentos subidos
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {documentosCliente.map((doc, index) => (
                        <div key={index} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between">
                          <div className="flex items-center flex-1">
                            <svg className="w-8 h-8 text-blue-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{doc.tipoDocumentoNombre || 'Documento'}</p>
                              <p className="text-xs text-gray-500">{doc.nombreArchivo || 'archivo.pdf'}</p>
                              {doc.descripcion && (
                                <p className="text-xs text-gray-400 mt-1">{doc.descripcion}</p>
                              )}
                            </div>
                          </div>
                          {doc.id && (
                            <div className="flex space-x-2 ml-3">
                              <button
                                onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve/${doc.id}`, '_blank')}
                                className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs flex items-center"
                                title="Ver documento"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                Ver
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve/${doc.id}`;
                                  link.download = doc.nombreArchivo || 'documento.pdf';
                                  link.click();
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs flex items-center"
                                title="Descargar documento"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Descargar
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contratos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Documentos Generados ({contratosCliente.length})
                </h3>
                {contratosCliente.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    No hay documentos generados
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {contratosCliente.map((contrato, index) => {
                      const handleCargarContratoFirmado = async () => {
                        if (!archivoFirmado) return;

                        setCargandoFirmado(true);
                        try {
                          await apiService.cargarContratoFirmado(Number(cliente.id), archivoFirmado, contrato.id);
                          alert('Documento firmado cargado exitosamente');
                          const contratos = await apiService.getContratosCliente(Number(cliente.id));
                          setContratosCliente(contratos);
                          setMostrarCargarFirmado(null);
                          setArchivoFirmado(null);
                        } catch (error: any) {
                          console.error('Error cargando contrato firmado:', error);
                          const errorMessage = error?.responseData?.error || error?.message || 'Error desconocido';
                          alert('Error al cargar documento firmado: ' + errorMessage);
                        } finally {
                          setCargandoFirmado(false);
                        }
                      };

                      return (
                        <div key={index} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="font-semibold text-blue-600">{contrato.nombreArchivo || 'Documento Generado'}</p>
                              {contrato.fechaCreacion && (
                                <p className="text-sm text-gray-600">Fecha: {new Date(contrato.fechaCreacion).toLocaleDateString('es-ES')}</p>
                              )}
                              {contrato.descripcion && (
                                <p className="text-sm text-gray-500 mt-1">{contrato.descripcion}</p>
                              )}
                              {contrato.estado === 'FIRMADO' && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  ✅ Firmado
                                </span>
                              )}
                            </div>
                            {contrato.id && (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${contrato.id}`, '_blank')}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  Ver PDF
                                </button>
                                <button
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/documentos/serve-generated/${contrato.id}`;
                                    link.download = contrato.nombreArchivo || 'contrato.pdf';
                                    link.click();
                                  }}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                  Descargar
                                </button>
                                {contrato.estado !== 'FIRMADO' && (
                                  <button
                                    onClick={() => setMostrarCargarFirmado(mostrarCargarFirmado === contrato.id ? null : contrato.id)}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center"
                                  >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Cargar Documento Firmado
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                          {mostrarCargarFirmado === contrato.id && (
                            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Seleccionar Documento Firmado (PDF)
                              </label>
                              <input
                                type="file"
                                accept=".pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setArchivoFirmado(file);
                                  }
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700"
                              />
                              {archivoFirmado && (
                                <div className="mt-3 flex justify-end space-x-2">
                                  <button
                                    onClick={() => {
                                      setMostrarCargarFirmado(null);
                                      setArchivoFirmado(null);
                                    }}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                    disabled={cargandoFirmado}
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={handleCargarContratoFirmado}
                                    disabled={cargandoFirmado}
                                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center disabled:opacity-50"
                                  >
                                    {cargandoFirmado ? (
                                      <>
                                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Cargando...
                                      </>
                                    ) : (
                                      contrato.nombreArchivo?.toLowerCase().includes('solicitud_compra') ||
                                      contrato.nombreArchivo?.toLowerCase().includes('solicitud de compra')
                                        ? 'Cargar Solicitud de Compra Firmada'
                                        : 'Cargar Contrato Firmado'
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Plan de Pagos */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Plan de Pagos ({pagosCliente.length} cuotas)
                </h3>
                {pagosCliente.length === 0 ? (
                  <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-600">
                    No hay plan de pagos registrado
                  </div>
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-200">
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Cuota</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Monto</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Fecha Vencimiento</th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-700">Estado</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {pagosCliente.map((pago, index) => (
                            <tr key={index}>
                              <td className="px-3 py-2 text-sm">Cuota #{pago.numeroCuota || index + 1}</td>
                              <td className="px-3 py-2 text-sm font-semibold">${pago.monto?.toFixed(2) || '0.00'}</td>
                              <td className="px-3 py-2 text-sm">{pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toLocaleDateString('es-ES') : 'N/A'}</td>
                              <td className="px-3 py-2 text-center">
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                                  pago.estado === 'VENCIDO' ? 'bg-red-100 text-red-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {pago.estado || 'PENDIENTE'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            {vistaActual !== 'clientes-asignados' && user?.roles?.some((role: any) => {
              const codigo = role.rol?.codigo || (role as any).codigo;
              return codigo === 'SALES_CHIEF';
            }) && (() => {
              const esClienteFantasma = cliente?.estado === 'PENDIENTE_ASIGNACION_CLIENTE';
              const tieneArmasAsignadas = armasCliente.length > 0;
              if (esClienteFantasma || !tieneArmasAsignadas) {
                return null;
              }

              const esCivil = (cliente as any)?.tipoClienteEsCivil ?? false;
              const esUniformado = ((cliente as any)?.tipoClienteEsMilitar ?? false) || ((cliente as any)?.tipoClienteEsPolicia ?? false);
              const solicitudFirmada = contratosCliente.some(doc => doc.tipoDocumento === 'SOLICITUD_COMPRA' && doc.estado === 'FIRMADO');
              const contratoFirmado = contratosCliente.some(doc => doc.tipoDocumento === 'CONTRATO' && doc.estado === 'FIRMADO');
              const cotizacionFirmada = contratosCliente.some(doc => doc.tipoDocumento === 'COTIZACION' && doc.estado === 'FIRMADO');

              if (esCivil && solicitudFirmada) {
                return null;
              }
              if (esUniformado && solicitudFirmada && contratoFirmado && cotizacionFirmada) {
                return null;
              }

              const textoBoton = esCivil ? "Generar Solicitud de Compra" : "Generar Documentos";

              return (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onAbrirModalGenerarContrato();
                  }}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {textoBoton}
                </button>
              );
            })()}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailModal;
