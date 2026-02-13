import React from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface ModalReasignarArmaProps {
  isOpen: boolean;
  cliente: { nombres?: string; apellidos?: string } | null;
  onClose: () => void;
}

const ModalReasignarArma: React.FC<ModalReasignarArmaProps> = ({ isOpen, cliente, onClose }) => {
  if (!isOpen || !cliente) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Reasignar Arma</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-gray-600 mb-4">
          Cliente actual: {formatNombreCompleto(cliente.nombres, cliente.apellidos)}
        </p>
        <p className="text-gray-600 mb-4">
          Esta funcionalidad requiere seleccionar un nuevo cliente. Por favor, use la pestaña "REASIGNAR ARMAS" para esta operación.
        </p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalReasignarArma;
