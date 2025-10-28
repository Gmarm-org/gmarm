import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';
import Header from '../../components/Header';
import AsignacionSeries from '../AsignacionSeries';
import { useAuth } from '../../contexts/AuthContext';

interface StockArma {
  armaId: number;
  armaNombre: string;
  armaCodigo: string;
  armaCalibre: string;
  cantidadTotal: number;
  cantidadDisponible: number;
  cantidadAsignada?: number; // Armas con pago completado
  precioVenta: number;
}

interface ClienteConVendedor extends Client {
  vendedorNombre?: string;
  vendedorApellidos?: string;
  fechaCreacion?: string;
}

const JefeVentas: React.FC = () => {
  const { user } = useAuth();
  const [vistaActual, setVistaActual] = useState<'clientes' | 'clientes-asignados' | 'stock' | 'importaciones' | 'asignar' | 'series'>('clientes');
  
  // Verificar si el usuario tiene permisos para ver Asignación de Series
  const puedeVerAsignacionSeries = user?.roles?.some(
    role => {
      const codigo = role.rol?.codigo || (role as any).codigo;
      console.log('🔍 JefeVentas - Verificando rol para asignación de series:', codigo);
      return codigo === 'SALES_CHIEF' || codigo === 'FINANCE';
    }
  ) || false;
  
  console.log('🔍 JefeVentas - puedeVerAsignacionSeries:', puedeVerAsignacionSeries);
  
  // Estados para Stock de Armas
  const [stockArmas, setStockArmas] = useState<StockArma[]>([]);
  const [loadingStock, setLoadingStock] = useState(false);
  const [expoferiaActiva, setExpoferiaActiva] = useState(false);
  
  // Estados para Clientes
  const [clientes, setClientes] = useState<ClienteConVendedor[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConVendedor | null>(null);
  const [clientesAsignados, setClientesAsignados] = useState<ClienteConVendedor[]>([]);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }>>({});

  // Cargar estado de expoferia al inicio
  useEffect(() => {
    const cargarExpoferia = async () => {
      try {
        const activa = await apiService.getExpoferiaEstado();
        setExpoferiaActiva(activa);
      } catch (error) {
        console.error('Error cargando estado de expoferia:', error);
      }
    };
    cargarExpoferia();
  }, []);

  // Cargar datos según la vista actual
  useEffect(() => {
    console.log('🔄 JefeVentas - useEffect ejecutándose, vistaActual:', vistaActual);
    if (vistaActual === 'stock') {
      console.log('🔄 JefeVentas - Cargando stock de armas...');
      cargarStockArmas();
    } else if (vistaActual === 'clientes') {
      console.log('🔄 JefeVentas - Cargando clientes...');
      cargarClientes();
    } else if (vistaActual === 'clientes-asignados') {
      console.log('🔄 JefeVentas - Cargando clientes asignados...');
      cargarClientesAsignados();
    }
  }, [vistaActual]);

  const cargarStockArmas = async () => {
    setLoadingStock(true);
    try {
      console.log('🔄 Cargando stock de armas...');
      const response = await apiService.getStockTodasArmas();
      console.log('✅ Stock cargado:', response);
      setStockArmas(response);
    } catch (error) {
      console.error('❌ Error cargando stock:', error);
      alert(`Error cargando el inventario de armas: ${error}`);
    } finally {
      setLoadingStock(false);
    }
  };

  const cargarClientes = async () => {
    setLoadingClientes(true);
    try {
      console.log('🔄 JefeVentas - Cargando TODOS los clientes del sistema...');
      console.log('🔄 JefeVentas - Llamando a apiService.getTodosClientes()');
      const response = await apiService.getTodosClientes();
      console.log('✅ JefeVentas - Clientes cargados:', response);
      console.log('✅ JefeVentas - Tipo de respuesta:', typeof response);
      console.log('✅ JefeVentas - Es array?', Array.isArray(response));
      if (Array.isArray(response) && response.length > 0) {
        console.log('✅ JefeVentas - Primer cliente:', response[0]);
        console.log('✅ JefeVentas - Vendedor del primer cliente:', response[0].vendedorNombre, response[0].vendedorApellidos);
      }
      setClientes(response);
    } catch (error) {
      console.error('❌ JefeVentas - Error cargando clientes:', error);
      alert(`Error cargando la lista de clientes: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true);
    try {
      console.log('🔄 JefeVentas - Cargando clientes con armas asignadas...');
      const response = await apiService.getTodosClientes();
      console.log('✅ JefeVentas - Total clientes cargados:', response.length);
      
      // Cargar armas para cada cliente y filtrar solo los que tienen armas ASIGNADAS
      const weaponAssignments: Record<string, { weapon: any; precio: number; cantidad: number; numeroSerie?: string; estado?: string }> = {};
      const clientesConArmaAsignada: ClienteConVendedor[] = [];
      
      for (const client of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0]; // Tomar la primera arma
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                nombre: arma.armaNombre,
                calibre: arma.armaModelo || 'N/A',
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1,
              numeroSerie: arma.numeroSerie,
              estado: arma.estado
            };
            
            // Solo agregar clientes con arma ASIGNADA
            if (arma.estado === 'ASIGNADA') {
              clientesConArmaAsignada.push(client);
            }
          }
        } catch (error) {
          console.warn(`No se pudieron cargar armas para cliente ${client.id}:`, error);
        }
      }
      
      console.log('✅ JefeVentas - Clientes con armas asignadas:', clientesConArmaAsignada.length);
      setClientesAsignados(clientesConArmaAsignada);
      setClientWeaponAssignments(weaponAssignments);
    } catch (error) {
      console.error('❌ JefeVentas - Error cargando clientes asignados:', error);
      alert(`Error cargando la lista de clientes asignados: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleVerDetalleCliente = (cliente: ClienteConVendedor) => {
    setClienteSeleccionado(cliente);
  };

  const handleCerrarDetalle = () => {
    setClienteSeleccionado(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Panel de Jefe de Ventas"
        subtitle="Gestión de inventario, clientes e importaciones"
      />
      
      <div className="max-w-7xl mx-auto p-6">

        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('clientes')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'clientes'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            👥 Todos los Clientes
          </button>
          
          <button
            onClick={() => setVistaActual('clientes-asignados')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'clientes-asignados'
                ? 'bg-green-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            ✅ Clientes con Serie Asignada
          </button>
          
          {/* Pestaña de Stock: solo visible si expoferia está activa */}
          {expoferiaActiva && (
            <button
              onClick={() => setVistaActual('stock')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'stock'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              📦 Stock de Armas (Expoferia)
            </button>
          )}
          
          <button
            onClick={() => setVistaActual('importaciones')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'importaciones'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📦 Importaciones
          </button>
          
          <button
            onClick={() => setVistaActual('asignar')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'asignar'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔗 Asignar Clientes
          </button>
          
          {/* Pestaña de Asignación de Series - Solo para SALES_CHIEF y FINANCE */}
          {puedeVerAsignacionSeries && (
            <button
              onClick={() => setVistaActual('series')}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                vistaActual === 'series'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              🔢 Asignación de Series
            </button>
          )}
        </div>

        {/* Contenido: Stock de Armas */}
        {vistaActual === 'stock' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Inventario de Armas en Stock</h2>
              <button
                onClick={cargarStockArmas}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingStock ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Cargando inventario...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arma</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Calibre</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Disponible</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Reservadas</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Asignadas</th>
                      <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Precio Venta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockArmas.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                          No hay armas en stock
                        </td>
                      </tr>
                    ) : (
                      stockArmas.map((stock) => {
                        const reservadas = stock.cantidadTotal - stock.cantidadDisponible;
                        const porcentajeDisponible = (stock.cantidadDisponible / stock.cantidadTotal) * 100;
                        
                        return (
                          <tr key={stock.armaId} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{stock.armaNombre}</td>
                            <td className="px-4 py-3 text-sm">{stock.armaCalibre}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-bold rounded-full">
                                {stock.cantidadTotal}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`px-3 py-1 text-sm font-bold rounded-full ${
                                porcentajeDisponible > 50 ? 'bg-green-100 text-green-800' :
                                porcentajeDisponible > 20 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {stock.cantidadDisponible}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                                {reservadas}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-bold rounded-full">
                                {stock.cantidadAsignada || 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold">
                              ${stock.precioVenta.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {stockArmas.length > 0 && (
                    <tfoot>
                      <tr className="bg-gray-50 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-sm">TOTALES</td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + s.cantidadTotal, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + s.cantidadDisponible, 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + (s.cantidadTotal - s.cantidadDisponible), 0)}
                        </td>
                        <td className="px-4 py-3 text-center text-sm">
                          {stockArmas.reduce((sum, s) => sum + (s.cantidadAsignada || 0), 0)}
                        </td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenido: Todos los Clientes */}
        {vistaActual === 'clientes' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Todos los Clientes del Sistema</h2>
                <p className="text-sm text-gray-600 mt-1">Todos los clientes creados por los vendedores</p>
              </div>
              <button
                onClick={cargarClientes}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingClientes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Cargando clientes...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CI/RUC</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendedor</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Estado</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                          No hay clientes registrados
                        </td>
                      </tr>
                    ) : (
                      clientes.map((cliente) => (
                        <tr key={cliente.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                          <td className="px-4 py-3 text-sm font-medium">
                            {cliente.nombres} {cliente.apellidos}
                          </td>
                          <td className="px-4 py-3 text-sm">{cliente.tipoClienteNombre}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                <span className="text-blue-600 font-bold text-xs">
                                  {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                                </span>
                              </div>
                              <span>{cliente.vendedorNombre} {cliente.vendedorApellidos}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{cliente.email}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                              cliente.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                              cliente.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                              cliente.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {cliente.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-ES') : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleVerDetalleCliente(cliente)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              Ver Detalle
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Contenido: Clientes con Serie Asignada */}
        {vistaActual === 'clientes-asignados' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">✅ Clientes con Armas Asignadas</h2>
                <p className="text-sm text-gray-600 mt-1">Clientes con número de serie asignado listos para generar solicitud</p>
              </div>
              <button
                onClick={cargarClientesAsignados}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                🔄 Actualizar
              </button>
            </div>

            {loadingClientes ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                <p className="mt-4 text-gray-600">Cargando clientes asignados...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CI/RUC</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Cliente</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tipo</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arma Asignada</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Serie</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Vendedor</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Fecha</th>
                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesAsignados.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg font-medium">No hay clientes con armas asignadas</p>
                            <p className="text-gray-400 text-sm mt-2">Los clientes aparecerán aquí cuando se les asigne un número de serie</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      clientesAsignados.map((cliente) => {
                        const weaponAssignment = clientWeaponAssignments[cliente.id];
                        return (
                          <tr key={cliente.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-mono">{cliente.numeroIdentificacion}</td>
                            <td className="px-4 py-3 text-sm font-medium">
                              {cliente.nombres} {cliente.apellidos}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                cliente.tipoProcesoNombre === 'Cupo Civil' ? 'bg-blue-100 text-blue-800' :
                                cliente.tipoProcesoNombre === 'Extracupo Uniformado' ? 'bg-orange-100 text-orange-800' :
                                cliente.tipoProcesoNombre === 'Extracupo Empresa' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {cliente.tipoProcesoNombre || cliente.tipoClienteNombre}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {weaponAssignment ? (
                                <div>
                                  <div className="font-medium">{weaponAssignment.weapon.nombre}</div>
                                  <div className="text-xs text-gray-500">{weaponAssignment.weapon.calibre}</div>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {weaponAssignment?.numeroSerie ? (
                                <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                                  {weaponAssignment.numeroSerie}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                                  <span className="text-green-600 font-bold text-xs">
                                    {cliente.vendedorNombre?.charAt(0)}{cliente.vendedorApellidos?.charAt(0)}
                                  </span>
                                </div>
                                <span>{cliente.vendedorNombre} {cliente.vendedorApellidos}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm">
                              {cliente.fechaCreacion ? new Date(cliente.fechaCreacion).toLocaleDateString('es-EC') : '-'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  alert('📄 Generar Solicitud de Autorización de Venta\n\nEsta funcionalidad se implementará con la estructura del documento que proporciones.');
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center space-x-2 mx-auto"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Generar Solicitud</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal de Detalle de Cliente */}
        {clienteSeleccionado && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}
                    </h2>
                    <p className="text-gray-600">CI: {clienteSeleccionado.numeroIdentificacion}</p>
                  </div>
                  <button
                    onClick={handleCerrarDetalle}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tipo de Cliente</p>
                    <p className="font-medium">{clienteSeleccionado.tipoClienteNombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{clienteSeleccionado.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{clienteSeleccionado.telefonoPrincipal}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Dirección</p>
                    <p className="font-medium">{clienteSeleccionado.direccion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Vendedor Responsable</p>
                    <p className="font-medium text-blue-600">
                      {clienteSeleccionado.vendedorNombre} {clienteSeleccionado.vendedorApellidos}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estado</p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                      clienteSeleccionado.estado === 'LISTO_IMPORTACION' ? 'bg-green-100 text-green-800' :
                      clienteSeleccionado.estado === 'BLOQUEADO' ? 'bg-red-100 text-red-800' :
                      clienteSeleccionado.estado?.includes('INHABILITADO') ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {clienteSeleccionado.estado}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={handleCerrarDetalle}
                    className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contenido: Importaciones (Pendiente) */}
        {vistaActual === 'importaciones' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">📦 Gestión de Importaciones</h2>
            <p className="text-gray-600">Módulo en desarrollo...</p>
          </div>
        )}

        {/* Contenido: Asignar Clientes (Pendiente) */}
        {vistaActual === 'asignar' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">🔗 Asignar Clientes a Importación</h2>
            <p className="text-gray-600">Módulo en desarrollo...</p>
          </div>
        )}

        {/* Contenido: Asignación de Series */}
        {vistaActual === 'series' && (
          <AsignacionSeries />
        )}
      </div>
    </div>
  );
};

export default JefeVentas;
