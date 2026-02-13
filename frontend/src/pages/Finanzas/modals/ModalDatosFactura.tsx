import React from 'react';
import type { Client } from '../../Vendedor/types';

interface ModalDatosFacturaProps {
  cliente: Client;
  montoFactura: number;
  ivaPercent: number | null;
  descripcionArma: string;
  onClose: () => void;
}

const ModalDatosFactura: React.FC<ModalDatosFacturaProps> = ({
  cliente,
  montoFactura,
  ivaPercent,
  descripcionArma,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Datos de Factura</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Cedula / RUC</label>
              <p className="text-sm font-semibold text-gray-900">{cliente.numeroIdentificacion}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nombre Completo</label>
              <p className="text-sm font-semibold text-gray-900">{cliente.nombres} {cliente.apellidos}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Correo Electronico</label>
              <p className="text-sm font-semibold text-gray-900">{cliente.email}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Telefono</label>
              <p className="text-sm font-semibold text-gray-900">{cliente.telefonoPrincipal}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Direccion</label>
              <p className="text-sm font-semibold text-gray-900">{cliente.direccion || 'N/A'}</p>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-300">
              <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
              <p className="text-sm font-semibold text-gray-900">{descripcionArma || 'Cargando...'}</p>
            </div>

            <div className="md:col-span-2 pt-4 border-t border-gray-300">
              <div className="space-y-2">
                {ivaPercent !== null ? (
                  <>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Subtotal</label>
                      <p className="text-sm font-semibold text-gray-900">${(montoFactura / (1 + ivaPercent / 100)).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">IVA ({ivaPercent}%)</label>
                      <p className="text-sm font-semibold text-gray-900">${(montoFactura - (montoFactura / (1 + ivaPercent / 100))).toFixed(2)}</p>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-gray-700">IVA</label>
                    <p className="text-sm text-yellow-600">Cargando configuracion...</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                  <label className="text-base font-bold text-gray-900">Total</label>
                  <p className="text-2xl font-bold text-blue-600">${montoFactura.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalDatosFactura;
