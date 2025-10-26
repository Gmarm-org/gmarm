import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { clientTypeApi, type ClientType } from '../../../services/adminApi';

const ClientTypeList: React.FC = () => {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [filteredClientTypes, setFilteredClientTypes] = useState<ClientType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClientTypes();
  }, []);

  const loadClientTypes = async () => {
    try {
      setIsLoading(true);
      const data = await clientTypeApi.getAll();
      setClientTypes(data);
      setFilteredClientTypes(data);
    } catch (error) {
      console.error('Error cargando tipos de cliente:', error);
      // Fallback a datos mock si la API falla
      const mockClientTypes: ClientType[] = [
        {
          id: 1,
          nombre: 'PERSONA NATURAL',
          descripcion: 'Clientes individuales, personas físicas',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 2,
          nombre: 'PERSONA JURÍDICA',
          descripcion: 'Empresas, organizaciones y entidades legales',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 3,
          nombre: 'MILITAR',
          descripcion: 'Personal militar y de fuerzas armadas',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 4,
          nombre: 'POLICÍA',
          descripcion: 'Personal policial y de seguridad',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 5,
          nombre: 'DEPORTISTA',
          descripcion: 'Deportistas con licencias especiales',
          estado: true,
          fecha_creacion: '2024-01-01'
        }
      ];
      setClientTypes(mockClientTypes);
      setFilteredClientTypes(mockClientTypes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterClientTypes();
  }, [searchTerm, clientTypes]);

  const filterClientTypes = () => {
    let filtered = clientTypes;

    if (searchTerm) {
      filtered = filtered.filter(clientType =>
        clientType.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientType.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredClientTypes(filtered);
  };

  const handleCreate = async () => {
    console.log('Crear nuevo tipo de cliente');
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (clientType: ClientType) => {
    console.log('Editar tipo de cliente:', clientType);
    // TODO: Implementar modal de edición
    alert(`Funcionalidad de edición en desarrollo para: ${clientType.nombre}`);
  };

  const handleDelete = async (clientType: ClientType) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tipo de cliente "${clientType.nombre}"?`)) {
      try {
        await clientTypeApi.delete(clientType.id);
        // Recargar la lista después de eliminar
        await loadClientTypes();
        alert('Tipo de cliente eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando tipo de cliente:', error);
        alert('Error al eliminar el tipo de cliente');
      }
    }
  };

  const handleView = async (clientType: ClientType) => {
    console.log('Ver tipo de cliente:', clientType);
    // TODO: Implementar modal de vista detallada
    alert(`Vista detallada en desarrollo para: ${clientType.nombre}`);
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value, _row) => (
        <div className="text-sm font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (value) => (
        <div className="text-sm text-gray-900 max-w-xs truncate">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'fecha_creacion',
      label: 'Fecha Creación',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {new Date(value).toLocaleDateString('es-EC')}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Tipos',
      value: clientTypes.length,
      icon: '👥',
      color: 'blue',
      description: 'Tipos de cliente registrados'
    },
    {
      label: 'Activos',
      value: clientTypes.filter(c => c.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Tipos activos'
    },
    {
      label: 'Inactivos',
      value: clientTypes.filter(c => !c.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Tipos inactivos'
    }
  ];

  return (
    <AdminDataTable
      title="Gestión de Tipos de Cliente"
      description="Administra los tipos de cliente del sistema"
      columns={columns}
      data={filteredClientTypes}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      searchPlaceholder="Buscar tipos de cliente..."
      stats={<AdminStats stats={stats} />}
    />
  );
};

export default ClientTypeList;
