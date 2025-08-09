import React, { useState, useEffect } from 'react';
import type { ImportGroup, Client } from '../types';
import { mockImportGroups, mockClients } from '../HardcodedData';

interface ImportGroupManagementProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const ImportGroupManagement: React.FC<ImportGroupManagementProps> = ({ onNavigate }) => {
  const [importGroups, setImportGroups] = useState<ImportGroup[]>([]);
  const [readyClients, setReadyClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ImportGroup | null>(null);
  const [newGroup, setNewGroup] = useState({
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    cuposCivil: 25,
    cuposMilitar: 0,
    cuposEmpresa: 0,
    cuposDeportista: 0
  });

  // Filtrar clientes que han completado el proceso del vendedor
  const getReadyClients = () => {
    return mockClients.filter(client => 
      client.procesoCompletado && 
      client.aprobadoPorJefeVentas === true
    );
  };

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setImportGroups(mockImportGroups);
      setReadyClients(getReadyClients());
      setLoading(false);
    }, 1000);
  }, []);

  const handleCreateGroup = () => {
    if (!newGroup.nombre || !newGroup.fechaInicio || !newGroup.fechaFin) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    const newImportGroup: ImportGroup = {
      id: importGroups.length + 1,
      codigo: `IMP-${new Date().getFullYear()}-${String(importGroups.length + 1).padStart(3, '0')}`,
      nombre: newGroup.nombre,
      descripcion: newGroup.descripcion,
      estado: 'PENDIENTE',
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaInicio: newGroup.fechaInicio,
      fechaFin: newGroup.fechaFin,
      cuposDisponibles: {
        civil: newGroup.cuposCivil,
        militar: newGroup.cuposMilitar,
        empresa: newGroup.cuposEmpresa,
        deportista: newGroup.cuposDeportista
      },
      cuposUtilizados: {
        civil: 0,
        militar: 0,
        empresa: 0,
        deportista: 0
      },
      licenciasAsignadas: 0,
      clientesAsignados: 0
    };

    setImportGroups(prev => [...prev, newImportGroup]);
    setNewGroup({
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      cuposCivil: 25,
      cuposMilitar: 0,
      cuposEmpresa: 0,
      cuposDeportista: 0
    });
    setShowCreateModal(false);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleAssignClient = (groupId: number, _clientId: number) => { // _clientId is unused
    setImportGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { 
            ...group, 
            clientesAsignados: group.clientesAsignados + 1,
            cuposUtilizados: {
              ...group.cuposUtilizados,
              civil: group.cuposUtilizados.civil + 1
            }
          }
        : group
    ));
    setShowAssignModal(false);
  };

  const handleViewDetails = (group: ImportGroup) => {
    onNavigate('importGroupDetails', group);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Activo</span>;
      case 'PENDIENTE':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pendiente</span>;
      case 'COMPLETADO':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">Completado</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{estado}</span>;
    }
  };

  const getUsagePercentage = (group: ImportGroup) => {
    const totalCupos = group.cuposDisponibles.civil + group.cuposDisponibles.militar + 
                      group.cuposDisponibles.empresa + group.cuposDisponibles.deportista;
    const totalUtilizados = group.cuposUtilizados.civil + group.cuposUtilizados.militar + 
                           group.cuposUtilizados.empresa + group.cuposUtilizados.deportista;
    return totalCupos > 0 ? Math.round((totalUtilizados / totalCupos) * 100) : 0;
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
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
        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">📦</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Grupos</p>
                <p className="text-lg font-semibold text-gray-900">{importGroups.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Activos</p>
                <p className="text-lg font-semibold text-gray-900">
                  {importGroups.filter(g => g.estado === 'ACTIVO').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Clientes Listos</p>
                <p className="text-lg font-semibold text-gray-900">{readyClients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {importGroups.filter(g => g.estado === 'PENDIENTE').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Botón crear grupo */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center"
          >
            <span className="mr-2">+</span>
            Crear Nuevo Grupo
          </button>
        </div>

        {/* Tabla de grupos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Grupos de Importación ({importGroups.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grupo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
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
                        <div className="text-xs text-gray-400">{group.descripcion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(group.estado)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(group.fechaInicio).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-400">hasta {new Date(group.fechaFin).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        {/* Progreso general */}
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(group))}`}
                              style={{ width: `${getUsagePercentage(group)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {group.clientesAsignados} clientes
                          </span>
                        </div>
                        
                        {/* Detalle por tipo de cupo */}
                        <div className="text-xs text-gray-500 space-y-1">
                          {group.cuposDisponibles.civil > 0 && (
                            <div className="flex justify-between">
                              <span>Civil:</span>
                              <span className="font-medium">
                                {group.cuposUtilizados.civil}/{group.cuposDisponibles.civil}
                              </span>
                            </div>
                          )}
                          {group.cuposDisponibles.militar > 0 && (
                            <div className="flex justify-between">
                              <span>Militar:</span>
                              <span className="font-medium">
                                {group.cuposUtilizados.militar}/{group.cuposDisponibles.militar}
                              </span>
                            </div>
                          )}
                          {group.cuposDisponibles.empresa > 0 && (
                            <div className="flex justify-between">
                              <span>Empresa:</span>
                              <span className="font-medium">
                                {group.cuposUtilizados.empresa}/{group.cuposDisponibles.empresa}
                              </span>
                            </div>
                          )}
                          {group.cuposDisponibles.deportista > 0 && (
                            <div className="flex justify-between">
                              <span>Deportista:</span>
                              <span className="font-medium">
                                {group.cuposUtilizados.deportista}/{group.cuposDisponibles.deportista}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(group)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs"
                        >
                          Ver
                        </button>
                        {group.estado === 'ACTIVO' && readyClients.length > 0 && (
                          <button
                            onClick={() => {
                              setSelectedGroup(group);
                              setShowAssignModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md text-xs"
                          >
                            Asignar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal de creación */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nuevo Grupo de Importación</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Grupo *</label>
                    <input
                      type="text"
                      value={newGroup.nombre}
                      onChange={(e) => setNewGroup({...newGroup, nombre: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder="Ej: Importación Q2 2024"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                    <textarea
                      value={newGroup.descripcion}
                      onChange={(e) => setNewGroup({...newGroup, descripcion: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={3}
                      placeholder="Descripción del grupo..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                      <input
                        type="date"
                        value={newGroup.fechaInicio}
                        onChange={(e) => setNewGroup({...newGroup, fechaInicio: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
                      <input
                        type="date"
                        value={newGroup.fechaFin}
                        onChange={(e) => setNewGroup({...newGroup, fechaFin: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cupos Civiles</label>
                      <input
                        type="number"
                        value={newGroup.cuposCivil}
                        onChange={(e) => setNewGroup({...newGroup, cuposCivil: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cupos Militares</label>
                      <input
                        type="number"
                        value={newGroup.cuposMilitar}
                        onChange={(e) => setNewGroup({...newGroup, cuposMilitar: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateGroup}
                    className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700"
                  >
                    Crear Grupo
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de asignación */}
        {showAssignModal && selectedGroup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Asignar Cliente a Grupo {selectedGroup.codigo}
                </h3>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {readyClients.map((client) => (
                    <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{client.nombres} {client.apellidos}</div>
                        <div className="text-sm text-gray-500">{client.cedula}</div>
                      </div>
                      <button
                        onClick={() => handleAssignClient(selectedGroup.id, client.id)}
                        className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
                      >
                        Asignar
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                  >
                    Cancelar
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