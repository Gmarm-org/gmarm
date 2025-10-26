import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ImportGroup, Client, License } from '../types';
import { mockImportGroups, mockClients, mockLicenses } from '../HardcodedData';

const ImportGroupManagement: React.FC = () => {
  const navigate = useNavigate();
  const [importGroups, setImportGroups] = useState<ImportGroup[]>([]);
  const [availableLicenses, setAvailableLicenses] = useState<License[]>([]);
  const [readyClients, setReadyClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ImportGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    licenciaId: null as number | null
  });

  // Obtener licencias disponibles (no asignadas a grupos activos)
  const getAvailableLicenses = () => {
    const usedLicenseIds = importGroups
      .filter(group => group.estado === 'ACTIVO' || group.estado === 'EN_PROCESO')
      .map(group => group.licenciaAsignada?.id)
      .filter(id => id !== undefined);

    return mockLicenses.filter(license => 
      license.estado === 'ACTIVA' && 
      !usedLicenseIds.includes(license.id) &&
      license.cupoDisponible && license.cupoDisponible > 0
    );
  };

  // Obtener clientes listos para importación
  const getReadyClients = () => {
    return mockClients.filter(client => 
      client.estadoProcesoVentas === 'LISTO_IMPORTACION' &&
      !importGroups.some(group => 
        group.clientesAsignados.some(assignedClient => assignedClient.id === client.id)
      )
    );
  };

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setImportGroups(mockImportGroups);
      setAvailableLicenses(getAvailableLicenses());
      setReadyClients(getReadyClients());
      setLoading(false);
    }, 1000);
  }, []);

  // Actualizar licencias disponibles cuando cambien los grupos
  useEffect(() => {
    setAvailableLicenses(getAvailableLicenses());
    setReadyClients(getReadyClients());
  }, [importGroups]);

  const handleCreateGroup = () => {
    if (!newGroup.nombre || !newGroup.fechaInicio || !newGroup.fechaFin || !newGroup.licenciaId) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const selectedLicense = availableLicenses.find(l => l.id === newGroup.licenciaId);
    if (!selectedLicense) {
      alert('Licencia no válida');
      return;
    }

    const newImportGroup: ImportGroup = {
      id: importGroups.length + 1,
      codigo: `IMP-${new Date().getFullYear()}-${String(importGroups.length + 1).padStart(3, '0')}`,
      nombre: newGroup.nombre,
      descripcion: newGroup.descripcion,
      estado: 'ACTIVO',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaInicio: newGroup.fechaInicio,
      fechaFin: newGroup.fechaFin,
      licenciaAsignada: selectedLicense,
      clientesAsignados: [],
      cuposDisponibles: {
        civil: selectedLicense.cupoCivil || 0,
        militar: selectedLicense.cupoMilitar || 0,
        empresa: selectedLicense.cupoEmpresa || 0,
        deportista: selectedLicense.cupoDeportista || 0
      },
      cuposUtilizados: {
        civil: 0,
        militar: 0,
        empresa: 0,
        deportista: 0
      },
      cuposRestantes: {
        civil: selectedLicense.cupoCivil || 0,
        militar: selectedLicense.cupoMilitar || 0,
        empresa: selectedLicense.cupoEmpresa || 0,
        deportista: selectedLicense.cupoDeportista || 0
      }
    };

    setImportGroups(prev => [...prev, newImportGroup]);
    setNewGroup({
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      licenciaId: null
    });
    setShowCreateModal(false);
    setSelectedGroup(newImportGroup);
  };



  const handleFinishGroup = () => {
    if (!selectedGroup) return;

    const updatedGroup = {
      ...selectedGroup,
      estado: 'COMPLETADO'
    };

    setImportGroups(prev => prev.map(group => 
      group.id === selectedGroup.id ? updatedGroup : group
    ));
    setSelectedGroup(null);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Activo</span>;
      case 'EN_PROCESO':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">En Proceso</span>;
      case 'COMPLETADO':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Completado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{estado}</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Resumen de licencias disponibles */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 Licencias Disponibles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableLicenses.map(license => (
            <div key={license.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{license.numero}</h3>
                <span className="text-sm text-gray-500">{license.nombre}</span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cupo Civil:</span>
                  <span className={`font-semibold ${license.cupoDisponible && license.cupoDisponible <= 5 ? 'text-red-600' : 'text-blue-600'}`}>
                    {license.cupoDisponible || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cupo Militar:</span>
                  <span className="font-semibold text-green-600">{license.cupoMilitar || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cupo Empresa:</span>
                  <span className="font-semibold text-purple-600">{license.cupoEmpresa || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cupo Deportista:</span>
                  <span className="font-semibold text-orange-600">{license.cupoDeportista || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resumen de clientes listos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">👥 Clientes Listos para Importación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {readyClients.map(client => (
            <div key={client.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900">{client.nombres} {client.apellidos}</h3>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  client.tipoCliente === 'CIVIL' ? 'bg-blue-100 text-blue-800' :
                  client.tipoCliente === 'MILITAR' ? 'bg-green-100 text-green-800' :
                  client.tipoCliente === 'EMPRESA' ? 'bg-purple-100 text-purple-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  {client.tipoCliente}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Cédula: {client.cedula}</p>
                <p>Vendedor: {client.vendedor.nombres} {client.vendedor.apellidos}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botón crear grupo */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
        >
          <span className="mr-2">+</span>
          Crear Nuevo Grupo de Importación
        </button>
      </div>

      {/* Tabla de grupos existentes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grupo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cupos Utilizados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {importGroups.map((group) => (
                <tr key={group.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{group.codigo}</div>
                      <div className="text-sm text-gray-500">{group.nombre}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {group.licenciaAsignada?.numero || 'Sin licencia'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(group.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Civil:</span>
                        <span className="font-semibold text-blue-600">
                          {group.cuposUtilizados.civil}/{group.cuposDisponibles.civil}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Militar:</span>
                        <span className="font-semibold text-green-600">
                          {group.cuposUtilizados.militar}/{group.cuposDisponibles.militar}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Empresa:</span>
                        <span className="font-semibold text-purple-600">
                          {group.cuposUtilizados.empresa}/{group.cuposDisponibles.empresa}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Deportista:</span>
                        <span className="font-semibold text-orange-600">
                          {group.cuposUtilizados.deportista}/{group.cuposDisponibles.deportista}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {group.estado === 'ACTIVO' && (
                        <button
                          onClick={() => navigate(`/jefe-ventas/grupos-importacion/${group.id}/asignar-clientes`)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs"
                        >
                          Asignar Clientes
                        </button>
                      )}
                      {group.estado === 'ACTIVO' && group.clientesAsignados.length > 0 && (
                        <button
                          onClick={() => handleFinishGroup()}
                          className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md text-xs"
                        >
                          Finalizar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {importGroups.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay grupos de importación creados</p>
          </div>
        )}
      </div>

      {/* Modal de creación de grupo */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Grupo de Importación</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo *</label>
                  <input
                    type="text"
                    value={newGroup.nombre}
                    onChange={(e) => setNewGroup({...newGroup, nombre: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Grupo Enero 2024"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                  <textarea
                    value={newGroup.descripcion}
                    onChange={(e) => setNewGroup({...newGroup, descripcion: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Descripción del grupo..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Inicio *</label>
                    <input
                      type="date"
                      value={newGroup.fechaInicio}
                      onChange={(e) => setNewGroup({...newGroup, fechaInicio: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Fin *</label>
                    <input
                      type="date"
                      value={newGroup.fechaFin}
                      onChange={(e) => setNewGroup({...newGroup, fechaFin: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Licencia *</label>
                  <select
                    value={newGroup.licenciaId || ''}
                    onChange={(e) => setNewGroup({...newGroup, licenciaId: parseInt(e.target.value) || null})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar licencia</option>
                    {availableLicenses.map(license => (
                      <option key={license.id} value={license.id}>
                        {license.numero} - {license.nombre} (Cupo Civil: {license.cupoDisponible || 0})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateGroup}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Crear Grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default ImportGroupManagement; 