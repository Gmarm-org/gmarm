import React, { useState } from 'react';
import { apiService } from '../../../services/api';
import type { CuotaPago, PagoCompleto } from '../types';

interface ModalCuotasProps {
  pago: PagoCompleto;
  onClose: () => void;
  onDataReload: () => Promise<void>;
  onPagoUpdate: (pago: PagoCompleto) => void;
}

const ModalCuotas: React.FC<ModalCuotasProps> = ({ pago, onClose, onDataReload, onPagoUpdate }) => {
  const [procesando, setProcesando] = useState(false);
  const [cuotaEditando, setCuotaEditando] = useState<CuotaPago | null>(null);
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [montoPago, setMontoPago] = useState<number>(0);
  const [comprobanteArchivo, setComprobanteArchivo] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [mostrarModalAgregarCuota, setMostrarModalAgregarCuota] = useState(false);
  const [nuevaCuota, setNuevaCuota] = useState({ monto: 0, fechaVencimiento: '', referenciaPago: '' });

  const handlePagarCuota = (cuota: CuotaPago) => {
    setCuotaEditando(cuota);
    setReferenciaPago('');
    setMontoPago(cuota.monto);
    setComprobanteArchivo(null);
    setObservaciones('');
    // Formato manual para evitar problemas de timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setFechaPago(`${year}-${month}-${day}`);
  };

  const confirmarPagoCuota = async () => {
    if (!cuotaEditando || !referenciaPago || !fechaPago) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setProcesando(true);
    try {
      // Obtener usuario actual para el confirmador
      const usuario = await apiService.getMe();

      // Subir comprobante si existe
      let comprobanteArchivoRuta = null;
      if (comprobanteArchivo) {
        try {
          // TODO: Implementar endpoint de subida de comprobante
          const formData = new FormData();
          formData.append('archivo', comprobanteArchivo);
          formData.append('tipo', 'comprobante_cuota');
          formData.append('cuotaId', cuotaEditando.id.toString());
        } catch (error) {
          console.warn('Error subiendo comprobante:', error);
        }
      }

      await apiService.pagarCuota(
        cuotaEditando.id,
        referenciaPago,
        usuario.id,
        montoPago || cuotaEditando.monto,
        undefined,
        comprobanteArchivoRuta || undefined,
        observaciones || undefined
      );

      alert('Cuota registrada exitosamente');

      // Recargar datos y cerrar modal
      await onDataReload();
      onClose();
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert(`Error registrando el pago: ${error}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleAgregarCuota = async () => {
    if (!nuevaCuota.monto || !nuevaCuota.fechaVencimiento) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setProcesando(true);
    try {
      await apiService.crearCuotaPago(pago.id, nuevaCuota);
      alert('Cuota agregada exitosamente');
      await onDataReload();

      // Recargar cuotas del pago seleccionado
      const cuotasData = await apiService.getCuotasPorPago(pago.id);
      onPagoUpdate({ ...pago, cuotas: cuotasData });

      setMostrarModalAgregarCuota(false);
      setNuevaCuota({ monto: 0, fechaVencimiento: '', referenciaPago: '' });
    } catch (error) {
      console.error('Error agregando cuota:', error);
      alert(`Error agregando la cuota: ${error}`);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      {/* Modal principal de Cuotas */}
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">
              Cuotas de Pago - Cliente: {pago.cliente?.nombres} {pago.cliente?.apellidos}
            </h3>
            <button
              onClick={() => {
                onClose();
                setCuotaEditando(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mb-4 flex justify-between items-center">
            <button
              onClick={() => setMostrarModalAgregarCuota(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              ➕ Agregar Cuota
            </button>
          </div>

          {pago.cuotas && pago.cuotas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nro. Recibo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pago.cuotas.map((cuota) => (
                    <tr key={cuota.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{cuota.numeroCuota}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">${cuota.monto.toFixed(2)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{new Date(cuota.fechaVencimiento).toLocaleDateString('es-EC')}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          cuota.estado === 'PAGADA' ? 'bg-green-100 text-green-800' :
                          cuota.estado === 'VENCIDA' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {cuota.estado}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString('es-EC') : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        {cuota.numeroRecibo || '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col gap-1">
                          {cuota.estado !== 'PAGADA' && (
                            <button
                              onClick={() => handlePagarCuota(cuota)}
                              className="text-green-600 hover:text-green-900 font-medium text-left"
                            >
                              Registrar Pago
                            </button>
                          )}
                          {cuota.estado === 'PAGADA' && (
                            <>
                              <button
                                onClick={async () => {
                                  try {
                                    setProcesando(true);
                                    // Primero generar el recibo si no existe
                                    await apiService.generarRecibo(cuota.id);
                                    // Luego descargarlo
                                    await apiService.descargarRecibo(cuota.id);
                                  } catch (error) {
                                    console.error('Error descargando recibo:', error);
                                    alert(`Error al descargar el recibo: ${error}`);
                                  } finally {
                                    setProcesando(false);
                                  }
                                }}
                                disabled={procesando}
                                className="text-blue-600 hover:text-blue-900 font-medium text-left disabled:opacity-50"
                              >
                                📥 Descargar RECIBO
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    setProcesando(true);
                                    // El backend obtiene automáticamente los correos desde configuracion_sistema
                                    // (CORREOS_RECIBO) y agrega el correo del cliente

                                    // Primero generar el recibo si no existe
                                    await apiService.generarRecibo(cuota.id);
                                    // Luego enviarlo por correo (backend maneja los correos automáticamente)
                                    await apiService.enviarReciboPorCorreo(cuota.id);
                                    alert('Recibo enviado exitosamente');
                                  } catch (error: any) {
                                    console.error('Error enviando recibo:', error);
                                    const errorMessage = error?.message || error?.error || 'Error desconocido';
                                    alert(`Error al enviar el recibo: ${errorMessage}`);
                                  } finally {
                                    setProcesando(false);
                                  }
                                }}
                                disabled={procesando}
                                className="text-purple-600 hover:text-purple-900 font-medium text-left disabled:opacity-50"
                              >
                                📧 Enviar por Correo
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No hay cuotas registradas para este pago.
            </div>
          )}
        </div>
      </div>

      {/* Sub-modal: Agregar Cuota */}
      {mostrarModalAgregarCuota && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Agregar Nueva Cuota</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={nuevaCuota.monto}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, monto: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Vencimiento *
              </label>
              <input
                type="date"
                value={nuevaCuota.fechaVencimiento}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, fechaVencimiento: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia de Pago
              </label>
              <input
                type="text"
                value={nuevaCuota.referenciaPago}
                onChange={(e) => setNuevaCuota({ ...nuevaCuota, referenciaPago: e.target.value })}
                placeholder="Opcional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setMostrarModalAgregarCuota(false);
                  setNuevaCuota({ monto: 0, fechaVencimiento: '', referenciaPago: '' });
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleAgregarCuota}
                disabled={procesando}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {procesando ? 'Agregando...' : 'Agregar Cuota'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-modal: Registrar Pago de Cuota */}
      {cuotaEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago de Cuota #{cuotaEditando.numeroCuota}</h3>

            {/* Información de solo lectura */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha de Vencimiento
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(cuotaEditando.fechaVencimiento).toLocaleDateString('es-EC')}
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Saldo Pendiente Total
                </label>
                <p className="text-sm font-semibold text-red-600">
                  ${(pago.montoTotal - (pago.cuotas?.filter(c => c.estado === 'PAGADA').reduce((sum, c) => sum + c.monto, 0) || 0)).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Campos editables */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Recibo
              </label>
              <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700 text-sm">
                Se genera automáticamente al registrar el pago (formato: RC-IMPORTADOR-AÑO-000100).
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor de Pago * (Editable)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoPago}
                onChange={(e) => setMontoPago(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Monto original: ${cuotaEditando.monto.toFixed(2)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referencia de Pago *
              </label>
              <input
                type="text"
                value={referenciaPago}
                onChange={(e) => setReferenciaPago(e.target.value)}
                placeholder="Nro. transferencia, cheque, etc."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago *
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprobante o Transferencia (PDF/Foto)
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setComprobanteArchivo(e.target.files?.[0] || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Observaciones
              </label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
                placeholder="Observaciones adicionales..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setCuotaEditando(null);
                  setReferenciaPago('');
                  setFechaPago('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarPagoCuota}
                disabled={procesando}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {procesando ? 'Procesando...' : 'Confirmar Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ModalCuotas;
