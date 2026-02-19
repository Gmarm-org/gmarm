import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrashIcon, 
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { mockImportGroups } from './HardcodedData';
import type { ImportGroup } from './types';

const ImportGroupManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [importGroups, setImportGroups] = useState<ImportGroup[]>(mockImportGroups);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TODOS');

  const filteredGroups = importGroups.filter(group => {
    const matchesSearch = group.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'TODOS' || group.estado === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteGroup = (groupId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este grupo de importación?')) {
      setImportGroups(importGroups.filter(g => g.id !== groupId));
    }
  };

  const handleAssignClients = (group: ImportGroup) => {
    navigate(`/jefe-ventas/grupos-importacion/${group.id}/asignar-clientes`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800';
      case 'INACTIVO':
        return 'bg-red-100 text-red-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETADO':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Gestión de Grupos de Importación
              </h1>
              <p className="text-sm text-gray-500">
                Administra los grupos de importación y asigna clientes
              </p>
            </div>
            

          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="COMPLETADO">Completado</option>
            </select>
          </div>
        </div>

        {/* Lista de Grupos */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Grupos de Importación ({filteredGroups.length})
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredGroups.map((group) => (
              <div key={group.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-4">
                      <h4 className="text-lg font-medium text-gray-900">
                        {group.nombre}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(group.estado)}`}>
                        {group.estado}
                      </span>
                      <span className="text-sm text-gray-500">
                        {group.codigo}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{group.descripcion}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                      <div>
                        <span className="font-medium">Fecha Inicio:</span> {group.fechaInicio}
                      </div>
                      <div>
                        <span className="font-medium">Fecha Fin:</span> {group.fechaFin}
                      </div>
                      <div>
                        <span className="font-medium">Licencia:</span> {group.licenciaAsignada?.nombre}
                      </div>
                      <div>
                        <span className="font-medium">Clientes:</span> {group.clientesAsignados.length}
                      </div>
                    </div>

                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleAssignClients(group)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Asignar clientes"
                    >
                      <UserPlusIcon className="h-5 w-5" />
                    </button>
                    
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredGroups.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                No se encontraron grupos de importación
              </div>
            )}
          </div>
        </div>
      </div>


    </div>
  );
};

export default ImportGroupManagementPage;
