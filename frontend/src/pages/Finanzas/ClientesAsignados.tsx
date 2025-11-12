import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import type { Client } from '../Vendedor/types';

interface ClienteConVendedor extends Client {
  vendedorNombre?: string;
  vendedorApellidos?: string;
  fechaCreacion?: string;
}

interface WeaponAssignment {
  weapon: {
    id: number;
    nombre: string;
    calibre: string;
    codigo: string;
    urlImagen?: string;
    precioReferencia: number;
  };
  precio: number;
  cantidad: number;
  numeroSerie?: string;
  estado?: string;
}

const ClientesAsignados: React.FC = () => {
  const [clientesAsignados, setClientesAsignados] = useState<ClienteConVendedor[]>([]);
  const [clientWeaponAssignments, setClientWeaponAssignments] = useState<Record<string, WeaponAssignment>>({});
  const [autorizaciones, setAutorizaciones] = useState<Record<string, any[]>>({});
  const [loadingClientes, setLoadingClientes] = useState(false);
  const [expoferiaActiva, setExpoferiaActiva] = useState(false);
  
  // Estados para modal de generar solicitud
  const [mostrarModal, setMostrarModal] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<ClienteConVendedor | null>(null);
  const [numeroFactura, setNumeroFactura] = useState('');
  const [tramite, setTramite] = useState('');
  const [generando, setGenerando] = useState(false);

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

  // Cargar clientes asignados al montar
  useEffect(() => {
    cargarClientesAsignados();
  }, []);

  const cargarClientesAsignados = async () => {
    setLoadingClientes(true);
    try {
      console.log('🔄 Finanzas - Cargando clientes con armas asignadas...');
      const response = await apiService.getTodosClientes();
      console.log('✅ Finanzas - Total clientes cargados:', response.length);
      
      const weaponAssignments: Record<string, WeaponAssignment> = {};
      const clientesConArmaAsignada: ClienteConVendedor[] = [];
      
      const autorizacionesTemp: Record<string, any[]> = {};
      
      for (const client of response) {
        try {
          const armasResponse = await apiService.getArmasCliente(client.id);
          if (armasResponse && armasResponse.length > 0) {
            const arma = armasResponse[0];
            weaponAssignments[client.id] = {
              weapon: {
                id: arma.armaId,
                nombre: arma.armaNombre,
                calibre: arma.armaCalibre || 'N/A',
                codigo: arma.armaCodigo,
                urlImagen: arma.armaImagen,
                precioReferencia: parseFloat(arma.precioUnitario) || 0
              },
              precio: parseFloat(arma.precioUnitario) || 0,
              cantidad: parseInt(arma.cantidad) || 1,
              numeroSerie: arma.numeroSerie,
              estado: arma.estado
            };
            
            if (arma.estado === 'ASIGNADA') {
              clientesConArmaAsignada.push(client);
              
              // Cargar autorizaciones del cliente
              try {
                const autorizacionesResponse = await apiService.getAutorizacionesPorCliente(parseInt(client.id));
                autorizacionesTemp[client.id] = autorizacionesResponse || [];
              } catch (error) {
                console.warn(`No se pudieron cargar autorizaciones para cliente ${client.id}:`, error);
                autorizacionesTemp[client.id] = [];
              }
            }
          }
        } catch (error) {
          console.warn(`No se pudieron cargar armas para cliente ${client.id}:`, error);
        }
      }
      
      console.log('✅ Finanzas - Clientes con armas asignadas:', clientesConArmaAsignada.length);
      setClientesAsignados(clientesConArmaAsignada);
      setClientWeaponAssignments(weaponAssignments);
      setAutorizaciones(autorizacionesTemp);
    } catch (error) {
      console.error('❌ Finanzas - Error cargando clientes asignados:', error);
      alert(`Error cargando la lista de clientes asignados: ${error}`);
    } finally {
      setLoadingClientes(false);
    }
  };

  const handleGenerarSolicitud = (cliente: ClienteConVendedor) => {
    setClienteSeleccionado(cliente);
    // Establecer tramite por defecto según expoferia
    if (expoferiaActiva) {
      setTramite('TRA-0002017613');
    } else {
      setTramite('');
    }
    setNumeroFactura('');
    setMostrarModal(true);
  };

  const handleCerrarModal = () => {
    setMostrarModal(false);
    setClienteSeleccionado(null);
    setNumeroFactura('');
    setTramite('');
  };

  const handleConfirmarGeneracion = async () => {
    if (!clienteSeleccionado) return;
    
    if (!numeroFactura.trim()) {
      alert('Por favor ingrese el número de factura');
      return;
    }
    
    if (!tramite.trim()) {
      alert('Por favor ingrese el trámite');
      return;
    }

    setGenerando(true);
    try {
      console.log('📄 Generando autorización para:', {
        clienteId: clienteSeleccionado.id,
        numeroFactura,
        tramite
      });
      
      const response = await apiService.generarAutorizacion(
        clienteSeleccionado.id, 
        numeroFactura, 
        tramite
      );
      
      console.log('✅ Autorización generada:', response);
      
      alert('✅ Autorización de venta generada exitosamente');
      
      // Cerrar modal
      handleCerrarModal();
      
      // Recargar toda la lista de clientes para actualizar el botón
      await cargarClientesAsignados();
    } catch (error) {
      console.error('Error generando autorización:', error);
      alert(`Error generando la autorización: ${error}`);
    } finally {
      setGenerando(false);
    }
  };

  const weaponAssignment = clienteSeleccionado 
    ? clientWeaponAssignments[clienteSeleccionado.id] 
    : null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">✅ Clientes con Armas Asignadas</h2>
          <p className="text-sm text-gray-600 mt-1">Clientes con número de serie asignado listos para generar autorización de venta</p>
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
                  const assignment = clientWeaponAssignments[cliente.id];
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
                        {assignment ? (
                          <div>
                            <div className="font-medium">{assignment.weapon.nombre}</div>
                            <div className="text-xs text-gray-500">{assignment.weapon.calibre}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {assignment?.numeroSerie ? (
                          <span className="font-mono text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded">
                            {assignment.numeroSerie}
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
                        {(() => {
                          const tieneAutorizacion = autorizaciones[cliente.id] && autorizaciones[cliente.id].length > 0;
                          console.log('🔍 DEBUG Cliente:', cliente.id, '- Autorizaciones:', autorizaciones[cliente.id], '- Tiene:', tieneAutorizacion);
                          return tieneAutorizacion;
                        })() ? (
                          <div className="flex flex-col gap-2">
                            {/* Botón Ver Autorización */}
                            <button
                              onClick={() => {
                                const autorizacion = autorizaciones[cliente.id][0];
                                const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
                                window.open(`${baseUrl}/api/documentos/serve-generated/${autorizacion.id}`, '_blank');
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>Ver Autorización</span>
                            </button>
                            
                            {/* Botón Generar Nuevamente */}
                            <button
                              onClick={() => handleGenerarSolicitud(cliente)}
                              className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-lg hover:from-amber-700 hover:to-amber-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                              title="Regenerar autorización (sobrescribirá la actual)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span>Generar Nuevamente</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleGenerarSolicitud(cliente)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-semibold shadow-md flex items-center justify-center space-x-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Generar Autorización de Venta</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Generar Autorización de Venta */}
      {mostrarModal && clienteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="p-8">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  {autorizaciones[clienteSeleccionado.id] && autorizaciones[clienteSeleccionado.id].length > 0 ? (
                    <>
                      <h2 className="text-2xl font-bold text-gray-800">🔄 Regenerar Autorización de Venta</h2>
                      <p className="text-amber-600 mt-1 font-medium">⚠️ Esta acción sobrescribirá la autorización existente</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-800">📄 Generar Autorización de Venta</h2>
                      <p className="text-gray-600 mt-1">Complete los datos necesarios para generar el documento</p>
                    </>
                  )}
                </div>
                <button
                  onClick={handleCerrarModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
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
                      onChange={(e) => setNumeroFactura(e.target.value)}
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
                      onChange={(e) => setTramite(e.target.value)}
                      placeholder={expoferiaActiva ? 'TRA-0002017613' : 'TRA-XXXXXX'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    {expoferiaActiva && (
                      <p className="text-xs text-gray-500 mt-1">Valor por defecto para Expoferia</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Información del Cliente (No editable) */}
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
                    <span className="font-medium ml-2">{clienteSeleccionado.nombres} {clienteSeleccionado.apellidos}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CI:</span>
                    <span className="font-mono ml-2">{clienteSeleccionado.numeroIdentificacion}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipo:</span>
                    <span className="ml-2">{clienteSeleccionado.tipoProcesoNombre || clienteSeleccionado.tipoClienteNombre}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2">{clienteSeleccionado.email || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Información del Arma (No editable) */}
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
                      <span className="font-medium ml-2">{weaponAssignment.weapon.nombre}</span>
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
                  onClick={handleCerrarModal}
                  disabled={generando}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmarGeneracion}
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
                        {autorizaciones[clienteSeleccionado.id] && autorizaciones[clienteSeleccionado.id].length > 0 ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        )}
                      </svg>
                      <span>
                        {autorizaciones[clienteSeleccionado.id] && autorizaciones[clienteSeleccionado.id].length > 0 
                          ? 'Regenerar Documento' 
                          : 'Generar Documento'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesAsignados;

