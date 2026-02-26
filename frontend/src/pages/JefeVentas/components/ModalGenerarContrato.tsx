import React, { useState, useEffect } from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalGenerarContratoState {
  isOpen: boolean;
  datosContrato: any | null;
  isLoading: boolean;
}

interface DatosEditados {
  email?: string;
  telefonoPrincipal?: string;
  direccion?: string;
}

interface ModalGenerarContratoProps {
  state: ModalGenerarContratoState;
  onGenerar: (datosEditados?: DatosEditados) => void;
  onClose: () => void;
}

const ModalGenerarContrato: React.FC<ModalGenerarContratoProps> = ({ state, onGenerar, onClose }) => {
  const [editando, setEditando] = useState(false);
  const [datosEditados, setDatosEditados] = useState<DatosEditados>({});

  // Reset editing state when modal opens/closes
  useEffect(() => {
    if (!state.isOpen) {
      setEditando(false);
      setDatosEditados({});
    }
  }, [state.isOpen]);

  if (!state.isOpen) return null;

  const esCivil = state.datosContrato?.cliente?.tipoClienteEsCivil ?? false;
  const cliente = state.datosContrato?.cliente;
  const pago = state.datosContrato?.pago;

  const handleEditarDatos = () => {
    setEditando(true);
    setDatosEditados({
      email: cliente?.email || '',
      telefonoPrincipal: cliente?.telefonoPrincipal || '',
      direccion: cliente?.direccion || '',
    });
  };

  const handleCancelarEdicion = () => {
    setEditando(false);
    setDatosEditados({});
  };

  const handleGenerar = () => {
    if (editando) {
      // Check if any field actually changed
      const cambios: DatosEditados = {};
      if (datosEditados.email !== (cliente?.email || '')) cambios.email = datosEditados.email;
      if (datosEditados.telefonoPrincipal !== (cliente?.telefonoPrincipal || '')) cambios.telefonoPrincipal = datosEditados.telefonoPrincipal;
      if (datosEditados.direccion !== (cliente?.direccion || '')) cambios.direccion = datosEditados.direccion;

      if (Object.keys(cambios).length > 0) {
        onGenerar(cambios);
      } else {
        onGenerar();
      }
    } else {
      onGenerar();
    }
  };

  const formatFecha = (fecha: string) => {
    if (!fecha) return 'N/A';
    try {
      const [year, month, day] = fecha.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return fecha;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Generar Documento</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {state.isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              <p className="mt-4 text-gray-600">
                Cargando datos para generar {esCivil ? 'solicitud de compra' : 'documentos'}...
              </p>
            </div>
          ) : state.datosContrato ? (
            <>
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Confirma estos datos antes de generar {esCivil ? 'la solicitud de compra' : 'los documentos'}.
                </p>
              </div>

              {/* Datos del Cliente */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Datos del Cliente</h3>
                  {!editando ? (
                    <button
                      onClick={handleEditarDatos}
                      className="px-3 py-1 text-sm bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors flex items-center"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Editar datos
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelarEdicion}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancelar edicion
                    </button>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{formatNombreCompleto(cliente?.nombres, cliente?.apellidos)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Numero de Identificacion</p>
                    <p className="font-medium">{cliente?.numeroIdentificacion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    {editando ? (
                      <input
                        type="email"
                        value={datosEditados.email || ''}
                        onChange={(e) => setDatosEditados(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    ) : (
                      <p className="font-medium">{cliente?.email || 'N/A'}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telefono</p>
                    {editando ? (
                      <input
                        type="text"
                        value={datosEditados.telefonoPrincipal || ''}
                        onChange={(e) => setDatosEditados(prev => ({ ...prev, telefonoPrincipal: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    ) : (
                      <p className="font-medium">{cliente?.telefonoPrincipal || 'N/A'}</p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Direccion</p>
                    {editando ? (
                      <input
                        type="text"
                        value={datosEditados.direccion || ''}
                        onChange={(e) => setDatosEditados(prev => ({ ...prev, direccion: e.target.value }))}
                        className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    ) : (
                      <p className="font-medium">{cliente?.direccion || 'N/A'}</p>
                    )}
                  </div>
                </div>
                {editando && (
                  <p className="mt-2 text-xs text-amber-700">
                    Los campos editados se guardaran automaticamente al generar los documentos.
                  </p>
                )}
              </div>

              {/* Datos del Pago */}
              {pago && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Pago</h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monto Total</p>
                      <p className="font-medium">${parseFloat(pago.montoTotal || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Pago</p>
                      <p className="font-medium">{pago.tipoPago || 'N/A'}</p>
                    </div>
                    {pago.numeroCuotas && (
                      <div>
                        <p className="text-sm text-gray-600">Numero de Cuotas</p>
                        <p className="font-medium">{pago.numeroCuotas}</p>
                      </div>
                    )}
                  </div>

                  {/* Detalle de Cuotas */}
                  {pago.cuotas && pago.cuotas.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Detalle de Cuotas</h4>
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100 text-gray-600">
                              <th className="px-4 py-2 text-left font-medium">#</th>
                              <th className="px-4 py-2 text-left font-medium">Monto</th>
                              <th className="px-4 py-2 text-left font-medium">Fecha Vencimiento</th>
                              <th className="px-4 py-2 text-left font-medium">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pago.cuotas.map((cuota: any) => (
                              <tr key={cuota.numeroCuota} className="border-t border-gray-100">
                                <td className="px-4 py-2">{cuota.numeroCuota}</td>
                                <td className="px-4 py-2">${parseFloat(cuota.monto || 0).toFixed(2)}</td>
                                <td className="px-4 py-2">{formatFecha(cuota.fechaVencimiento)}</td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    cuota.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
                                    cuota.estado === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {cuota.estado || 'PENDIENTE'}
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
              )}

              {/* Armas Asignadas */}
              {state.datosContrato.armas && state.datosContrato.armas.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Armas Asignadas</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    {state.datosContrato.armas.map((arma: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                        <p className="font-medium">{arma.modelo || arma.nombre || arma.armaModelo || arma.armaNombre || 'N/A'}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                          <div>
                            <span className="text-gray-600">Cantidad:</span> {arma.cantidad || 1}
                          </div>
                          <div>
                            <span className="text-gray-600">Precio Unitario:</span> ${parseFloat(arma.precioUnitario || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Botones */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  disabled={state.isLoading}
                >
                  Cancelar
                </button>
                {(() => {
                  const emailVerificado = cliente?.emailVerificado === true;
                  const documentosCompletos = state.datosContrato?.documentosCompletos === true;
                  const isDisabled = state.isLoading || !emailVerificado || !documentosCompletos;
                  const textoBoton = esCivil ? 'Generar Solicitud de Compra' : 'Generar Documentos';

                  return (
                    <button
                      onClick={handleGenerar}
                      disabled={isDisabled}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      title={
                        state.isLoading
                          ? 'Cargando...'
                          : !emailVerificado
                          ? 'Email no validado'
                          : !documentosCompletos
                          ? 'Documentos incompletos'
                          : textoBoton.toLowerCase()
                      }
                    >
                      {state.isLoading ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {textoBoton}
                        </>
                      )}
                    </button>
                  );
                })()}
              </div>

              {/* Warnings */}
              {(!(cliente?.emailVerificado === true) ||
                !(state.datosContrato?.documentosCompletos === true)) && (
                <div className="mt-4 space-y-2">
                  {!(cliente?.emailVerificado === true) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        El cliente no tiene su email validado. Debe validar los datos personales del cliente primero.
                      </p>
                    </div>
                  )}
                  {!(state.datosContrato?.documentosCompletos === true) && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">
                        El cliente no tiene todos sus documentos obligatorios cargados. Debe completar todos los documentos antes de generar {esCivil ? 'la solicitud de compra' : 'los documentos'}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No se pudieron cargar los datos para la generacion.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalGenerarContrato;
