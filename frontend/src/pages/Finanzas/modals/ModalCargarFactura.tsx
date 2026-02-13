import React, { useState } from 'react';
import { apiService } from '../../../services/api';
import type { PagoCompleto } from '../types';

interface ModalCargarFacturaProps {
  pago: PagoCompleto;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

const ModalCargarFactura: React.FC<ModalCargarFacturaProps> = ({ pago, onClose, onSuccess }) => {
  const [archivoFactura, setArchivoFactura] = useState<File | null>(null);
  const [cargandoFactura, setCargandoFactura] = useState(false);

  const confirmarCargarFactura = async () => {
    if (!pago.cliente) {
      alert('Error: No se pudo obtener la información del cliente');
      return;
    }

    if (!archivoFactura) {
      alert('Por favor seleccione un archivo de factura');
      return;
    }

    setCargandoFactura(true);
    try {
      // Obtener tipos de documento del catálogo
      const tiposDocumento = await apiService.getTiposDocumento();

      // Buscar el tipo de documento "FACTURA"
      const tipoFactura = tiposDocumento.find((td: any) =>
        td.nombre?.toLowerCase().includes('factura') ||
        td.codigo?.toLowerCase().includes('factura')
      );

      if (!tipoFactura || !tipoFactura.id) {
        throw new Error('No se encontró el tipo de documento "FACTURA" en el sistema. Por favor, contacte al administrador.');
      }

      // Cargar el documento
      await apiService.cargarDocumentoCliente(
        parseInt(pago.cliente.id),
        tipoFactura.id,
        archivoFactura,
        `Factura de pago ID: ${pago.id}`
      );

      alert('Factura cargada exitosamente');
      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error cargando factura:', error);
      alert(`Error al cargar la factura: ${error.message || 'Error desconocido'}`);
    } finally {
      setCargandoFactura(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Cargar Factura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cliente
          </label>
          <p className="text-sm text-gray-900">
            {pago.cliente?.nombres} {pago.cliente?.apellidos}
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Archivo de Factura (PDF/Foto) *
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setArchivoFactura(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={confirmarCargarFactura}
            disabled={cargandoFactura || !archivoFactura}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {cargandoFactura ? 'Cargando...' : 'Cargar Factura'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCargarFactura;
