import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalGenerarContratoState {
  isOpen: boolean;
  datosContrato: any | null;
  isLoading: boolean;
}

interface ModalGenerarContratoProps {
  state: ModalGenerarContratoState;
  onGenerar: () => void;
  onClose: () => void;
}

const ModalGenerarContrato: React.FC<ModalGenerarContratoProps> = ({ state, onGenerar, onClose }) => {
  if (!state.isOpen) return null;

  const esCivil = state.datosContrato?.cliente?.tipoClienteEsCivil ?? false;

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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Cliente</h3>
                <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{formatNombreCompleto(state.datosContrato.cliente?.nombres, state.datosContrato.cliente?.apellidos)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Número de Identificación</p>
                    <p className="font-medium">{state.datosContrato.cliente?.numeroIdentificacion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{state.datosContrato.cliente?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{state.datosContrato.cliente?.telefonoPrincipal || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{state.datosContrato.cliente?.direccion || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Datos del Pago */}
              {state.datosContrato.pago && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Datos del Pago</h3>
                  <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Monto Total</p>
                      <p className="font-medium">${parseFloat(state.datosContrato.pago.montoTotal || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Pago</p>
                      <p className="font-medium">{state.datosContrato.pago.tipoPago || 'N/A'}</p>
                    </div>
                    {state.datosContrato.pago.numeroCuotas && (
                      <div>
                        <p className="text-sm text-gray-600">Número de Cuotas</p>
                        <p className="font-medium">{state.datosContrato.pago.numeroCuotas}</p>
                      </div>
                    )}
                  </div>
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
                  const emailVerificado = state.datosContrato?.cliente?.emailVerificado === true;
                  const documentosCompletos = state.datosContrato?.documentosCompletos === true;
                  const isDisabled = state.isLoading || !emailVerificado || !documentosCompletos;
                  const textoBoton = esCivil ? 'Generar Solicitud de Compra' : 'Generar Documentos';

                  return (
                    <button
                      onClick={onGenerar}
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
              {(!(state.datosContrato?.cliente?.emailVerificado === true) ||
                !(state.datosContrato?.documentosCompletos === true)) && (
                <div className="mt-4 space-y-2">
                  {!(state.datosContrato?.cliente?.emailVerificado === true) && (
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
              <p className="text-gray-600">No se pudieron cargar los datos para la generación.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalGenerarContrato;
