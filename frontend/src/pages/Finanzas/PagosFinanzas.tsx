import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';

interface CuotaPago {
  id: number;
  numeroCuota: number;
  monto: number;
  fechaVencimiento: string;
  estado: string;
  fechaPago?: string;
  referenciaPago?: string;
  pagoId: number;
}

interface PagoCompleto {
  id: number;
  clienteId: number;
  cliente?: Client;
  montoTotal: number;
  tipoPago: string;
  estado: string;
  fechaCreacion: string;
  cuotas?: CuotaPago[];
}

const PagosFinanzas: React.FC = () => {
  const [pagos, setPagos] = useState<PagoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModalCuotas, setMostrarModalCuotas] = useState(false);
  const [pagoSeleccionado, setPagoSeleccionado] = useState<PagoCompleto | null>(null);
  const [cuotaEditando, setCuotaEditando] = useState<CuotaPago | null>(null);
  const [referenciaPago, setReferenciaPago] = useState('');
  const [fechaPago, setFechaPago] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [mostrarDatosFactura, setMostrarDatosFactura] = useState(false);
  const [clienteFactura, setClienteFactura] = useState<Client | null>(null);
  const [montoFactura, setMontoFactura] = useState<number>(0);
  const [ivaPercent, setIvaPercent] = useState<number>(15); // IVA por defecto 15%

  useEffect(() => {
    cargarDatos();
    cargarIVA();
  }, []);

  const cargarIVA = async () => {
    try {
      const configuraciones = await apiService.getConfiguracionSistema();
      if (configuraciones && Array.isArray(configuraciones)) {
        const ivaData = configuraciones.find((config: any) => config.clave === 'IVA');
        if (ivaData && ivaData.valor) {
          setIvaPercent(parseFloat(ivaData.valor));
        }
      }
    } catch (error) {
      console.warn('No se pudo cargar el IVA desde configuración, usando 15% por defecto');
    }
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      // Cargar todos los clientes del sistema
      const clientesData = await apiService.getTodosClientes();

      // Para cada cliente, cargar sus pagos
      const pagosTemp: PagoCompleto[] = [];
      for (const cliente of clientesData) {
        try {
          const pagosCliente = await apiService.getPagosCliente(cliente.id);
          for (const pago of pagosCliente) {
            // Cargar cuotas del pago si es tipo crédito
            let cuotas: CuotaPago[] = [];
            if (pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') {
              try {
                const cuotasData = await apiService.getCuotasPorPago(pago.id);
                cuotas = cuotasData;
              } catch (error) {
                console.warn(`No se pudieron cargar cuotas para pago ${pago.id}`);
              }
            }
            
            pagosTemp.push({
              ...pago,
              cliente,
              cuotas
            });
          }
        } catch (error) {
          console.warn(`No se pudieron cargar pagos para cliente ${cliente.id}`);
        }
      }
      
      setPagos(pagosTemp);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerCuotas = async (pago: PagoCompleto) => {
    setPagoSeleccionado(pago);
    
    // Si no tiene cuotas cargadas, cargarlas
    if (!pago.cuotas || pago.cuotas.length === 0) {
      try {
        const cuotasData = await apiService.getCuotasPorPago(pago.id);
        setPagoSeleccionado({
          ...pago,
          cuotas: cuotasData
        });
      } catch (error) {
        console.error('Error cargando cuotas:', error);
        setPagoSeleccionado({ ...pago, cuotas: [] });
      }
    }
    
    setMostrarModalCuotas(true);
  };

  const handlePagarCuota = (cuota: CuotaPago) => {
    setCuotaEditando(cuota);
    setReferenciaPago('');
    // Formato manual para evitar problemas de timezone
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setFechaPago(`${year}-${month}-${day}`);
  };

  const confirmarPagoCuota = async () => {
    if (!cuotaEditando || !referenciaPago || !fechaPago) {
      alert('Por favor complete todos los campos');
      return;
    }

    setProcesando(true);
    try {
      // Obtener usuario actual para el confirmador
      const usuario = await apiService.getMe();
      
      await apiService.pagarCuota(cuotaEditando.id, referenciaPago, usuario.id);

      alert('✅ Cuota registrada exitosamente');
      
      // Recargar datos
      await cargarDatos();
      
      // Cerrar modal
      setMostrarModalCuotas(false);
      setCuotaEditando(null);
      setReferenciaPago('');
      setFechaPago('');
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert(`Error registrando el pago: ${error}`);
    } finally {
      setProcesando(false);
    }
  };

  const handleVerDatosFactura = (pago: PagoCompleto) => {
    if (pago.cliente) {
      setClienteFactura(pago.cliente);
      setMontoFactura(pago.montoTotal);
      setMostrarDatosFactura(true);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8">
        <p className="text-gray-600">Cargando pagos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Gestión de Pagos</h2>
          <p className="text-sm text-gray-600 mt-1">Visualiza y gestiona todos los pagos del sistema</p>
        </div>

        {pagos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No hay pagos registrados en el sistema</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {pago.cliente ? (
                        <div>
                          <div className="font-medium text-gray-900">
                            {pago.cliente.nombres} {pago.cliente.apellidos}
                          </div>
                          <div className="text-gray-500 text-xs">
                            {pago.cliente.numeroIdentificacion}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${pago.montoTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        pago.tipoPago === 'CONTADO' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {pago.tipoPago === 'CONTADO' ? 'CONTADO' : 'CRÉDITO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        pago.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' :
                        pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(pago.fechaCreacion).toLocaleDateString('es-EC')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col gap-1">
                        {(pago.tipoPago === 'CREDITO' || pago.tipoPago === 'CUOTAS') && (
                          <button
                            onClick={() => handleVerCuotas(pago)}
                            className="text-blue-600 hover:text-blue-900 font-medium text-left"
                          >
                            Ver Cuotas
                          </button>
                        )}
                        {pago.estado === 'COMPLETADO' && (
                          <button
                            onClick={() => handleVerDatosFactura(pago)}
                            className="text-green-600 hover:text-green-900 font-medium text-left"
                          >
                            Ver Datos Factura
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cuotas */}
      {mostrarModalCuotas && pagoSeleccionado && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Cuotas de Pago - Cliente: {pagoSeleccionado.cliente?.nombres} {pagoSeleccionado.cliente?.apellidos}
              </h3>
              <button
                onClick={() => {
                  setMostrarModalCuotas(false);
                  setCuotaEditando(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {pagoSeleccionado.cuotas && pagoSeleccionado.cuotas.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cuota</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pagoSeleccionado.cuotas.map((cuota) => (
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
                          {cuota.estado !== 'PAGADA' && (
                            <button
                              onClick={() => handlePagarCuota(cuota)}
                              className="text-green-600 hover:text-green-900 font-medium"
                            >
                              Registrar Pago
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600 py-4">No hay cuotas registradas para este pago</p>
            )}
          </div>
        </div>
      )}

      {/* Modal para registrar pago de cuota */}
      {cuotaEditando && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Registrar Pago de Cuota #{cuotaEditando.numeroCuota}</h3>
            
            {/* Información de solo lectura */}
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Número de Comprobante
                </label>
                <p className="text-sm font-semibold text-gray-900">CUOTA-{cuotaEditando.id.toString().padStart(6, '0')}</p>
              </div>
              
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Valor de Pago
                </label>
                <p className="text-sm font-semibold text-gray-900">${cuotaEditando.monto.toFixed(2)}</p>
              </div>

              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Fecha de Vencimiento
                </label>
                <p className="text-sm font-semibold text-gray-900">
                  {new Date(cuotaEditando.fechaVencimiento).toLocaleDateString('es-EC')}
                </p>
              </div>

              {cuotaEditando.estado && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Saldo Pendiente
                  </label>
                  <p className="text-sm font-semibold text-red-600">
                    ${cuotaEditando.monto.toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            {/* Campos editables */}
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

      {/* Modal para ver datos de factura */}
      {mostrarDatosFactura && clienteFactura && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Datos de Factura</h3>
              <button
                onClick={() => setMostrarDatosFactura(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Cédula / RUC
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.numeroIdentificacion}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Nombre Completo
                  </label>
                  <p className="text-sm font-semibold text-gray-900">
                    {clienteFactura.nombres} {clienteFactura.apellidos}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.email}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Teléfono
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.telefonoPrincipal}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Dirección
                  </label>
                  <p className="text-sm font-semibold text-gray-900">{clienteFactura.direccion || 'N/A'}</p>
                </div>

                <div className="md:col-span-2 pt-4 border-t border-gray-300">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">Subtotal</label>
                      <p className="text-sm font-semibold text-gray-900">${(montoFactura / (1 + ivaPercent / 100)).toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium text-gray-700">IVA ({ivaPercent}%)</label>
                      <p className="text-sm font-semibold text-gray-900">${(montoFactura - (montoFactura / (1 + ivaPercent / 100))).toFixed(2)}</p>
                    </div>
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
                onClick={() => setMostrarDatosFactura(false)}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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

export default PagosFinanzas;

