import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalAutorizacionProps {
  isOpen: boolean;
  cliente: any | null;
  autorizaciones: Record<string, any[]>;
  weaponAssignment: { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string } | undefined;
  numeroFactura: string;
  onNumeroFacturaChange: (value: string) => void;
  tramite: string;
  onTramiteChange: (value: string) => void;
  generando: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

const ModalAutorizacion: React.FC<ModalAutorizacionProps> = ({
  isOpen,
  cliente,
  autorizaciones,
  weaponAssignment,
  numeroFactura,
  onNumeroFacturaChange,
  tramite,
  onTramiteChange,
  generando,
  onConfirm,
  onClose,
}) => {
  if (!isOpen || !cliente) return null;

  const tieneAutorizacionExistente = autorizaciones[cliente.id] && autorizaciones[cliente.id].length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              {tieneAutorizacionExistente ? (
                <>
                  <h2 className="text-2xl font-bold text-gray-800">Regenerar Autorización de Venta</h2>
                  <p className="text-amber-600 mt-1 font-medium">Esta acción sobrescribirá la autorización existente</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-gray-800">Generar Autorización de Venta</h2>
                  <p className="text-gray-600 mt-1">Complete los datos necesarios para generar el documento</p>
                </>
              )}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Campos de entrada */}
          <div className="space-y-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nro. Factura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => onNumeroFacturaChange(e.target.value)}
                  placeholder="Ej: 001-901-000000326"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trámite <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tramite}
                  onChange={(e) => onTramiteChange(e.target.value)}
                  placeholder="TRA-XXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                {!tramite && cliente?.grupoImportacionId && (
                  <p className="text-xs text-amber-600 mt-1">
                    El trámite no se ha definido en el grupo de importación
                  </p>
                )}
                {tramite && cliente?.grupoImportacionId && (
                  <p className="text-xs text-green-600 mt-1">
                    Trámite cargado desde el grupo de importación
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Información del Cliente */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del Cliente
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Nombre:</span>
                <span className="font-medium ml-2">{formatNombreCompleto(cliente.nombres, cliente.apellidos)}</span>
              </div>
              <div>
                <span className="text-gray-600">CI:</span>
                <span className="font-mono ml-2">{cliente.numeroIdentificacion}</span>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <span className="ml-2">{cliente.tipoClienteNombre || cliente.tipoProcesoNombre}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2">{cliente.email || '-'}</span>
              </div>
            </div>
          </div>

          {/* Información del Arma */}
          {weaponAssignment && (
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Datos del Arma
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Modelo:</span>
                  <span className="font-medium ml-2">{weaponAssignment.weapon.modelo || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-600">Calibre:</span>
                  <span className="ml-2">{weaponAssignment.weapon.calibre}</span>
                </div>
                <div>
                  <span className="text-gray-600">Serie:</span>
                  <span className="font-mono ml-2 font-bold text-blue-600">{weaponAssignment.numeroSerie}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2">PISTOLA</span>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={generando}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={generando}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md disabled:opacity-50 flex items-center space-x-2"
            >
              {generando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {tieneAutorizacionExistente ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                  </svg>
                  <span>{tieneAutorizacionExistente ? 'Regenerar Documento' : 'Generar Documento'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModalAutorizacion;
