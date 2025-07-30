import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockApiService } from '../../services/mockApiService';
import Header from '../../components/Header';
import type { Pago } from '../../types';

const Pagos: React.FC = () => {
  const { user } = useAuth();
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clienteId: 0,
    planPagoId: 0,
    numeroComprobante: '',
    montoTotal: 0,
    saldoPendiente: 0,
    metodoPago: 'EFECTIVO' as const,
    fechaPago: '',
    estado: 'PENDIENTE' as const,
    observaciones: ''
  });

  useEffect(() => {
    loadPagos();
  }, []);

  const loadPagos = async () => {
    try {
      setIsLoading(true);
      const pagosData = await mockApiService.getPagos();
      setPagos(pagosData);
    } catch (error) {
      console.error('Error al cargar pagos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getApiService = () => {
    return mockApiService;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newPago = await mockApiService.createPago(formData);
      setPagos(prev => [newPago, ...prev]);
      setShowForm(false);
      setFormData({
        clienteId: 0,
        planPagoId: 0,
        numeroComprobante: '',
        montoTotal: 0,
        saldoPendiente: 0,
        metodoPago: 'EFECTIVO' as const,
        fechaPago: '',
        estado: 'PENDIENTE' as const,
        observaciones: ''
      });
    } catch (error) {
      console.error('Error al crear pago:', error);
    }
  };

  const handleClienteChange = async (clienteId: string) => {
    if (clienteId) {
      try {
        const service = await getApiService();
        const saldo = await service.getSaldoCliente(parseInt(clienteId));
        setFormData(prev => ({
          ...prev,
          saldoPendiente: saldo.saldo
        }));
      } catch (error) {
        console.error('Error al obtener saldo:', error);
      }
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'PAGADO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'VENCIDO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'PENDIENTE':
        return '⏳';
      case 'PAGADO':
        return '✅';
      case 'VENCIDO':
        return '❌';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Pagos" subtitle="Gestión de pagos y finanzas" />
        <div className="p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando pagos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Pagos" subtitle="Gestión de pagos y finanzas" />
      <div className="p-6">
        {/* Botón para crear nuevo pago */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
          >
            Crear Nuevo Pago
          </button>
        </div>

        {/* Tabla de pagos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Pagos</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Comprobante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {pagos.map((pago, index) => (
                  <tr key={pago.id} className={`hover:bg-gray-50 transition-colors duration-150 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Cliente #{pago.clienteId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {pago.numeroComprobante}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${pago.montoTotal.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {pago.metodoPago}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pago.estado === 'PAGADO' ? 'bg-green-100 text-green-800' :
                        pago.estado === 'PENDIENTE' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(pago.fechaPago).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900 font-medium">
                          Ver
                        </button>
                        <button className="text-green-600 hover:text-green-900 font-medium">
                          Editar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pagos; 