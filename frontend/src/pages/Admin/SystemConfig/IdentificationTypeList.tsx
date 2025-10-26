import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { identificationTypeApi, type IdentificationType } from '../../../services/adminApi';

const IdentificationTypeList: React.FC = () => {
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
  const [filteredIdentificationTypes, setFilteredIdentificationTypes] = useState<IdentificationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadIdentificationTypes();
  }, []);

  const loadIdentificationTypes = async () => {
    try {
      setIsLoading(true);
      const data = await identificationTypeApi.getAll();
      setIdentificationTypes(data);
      setFilteredIdentificationTypes(data);
    } catch (error) {
      console.error('Error cargando tipos de identificación:', error);
      // Fallback a datos mock si la API falla
      const mockIdentificationTypes: IdentificationType[] = [
        {
          id: 1,
          nombre: 'CEDULA',
          descripcion: 'Cédula de identidad ecuatoriana',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 2,
          nombre: 'PASAPORTE',
          descripcion: 'Pasaporte ecuatoriano o extranjero',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 3,
          nombre: 'RUC',
          descripcion: 'Registro Único de Contribuyentes',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 4,
          nombre: 'CARNET MILITAR',
          descripcion: 'Carnet de identidad militar',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 5,
          nombre: 'CARNET POLICIAL',
          descripcion: 'Carnet de identidad policial',
          estado: true,
          fecha_creacion: '2024-01-01'
        }
      ];
      setIdentificationTypes(mockIdentificationTypes);
      setFilteredIdentificationTypes(mockIdentificationTypes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterIdentificationTypes();
  }, [searchTerm, identificationTypes]);

  const filterIdentificationTypes = () => {
    let filtered = identificationTypes;

    if (searchTerm) {
      filtered = filtered.filter(identificationType =>
        identificationType.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        identificationType.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIdentificationTypes(filtered);
  };

  const handleCreate = async () => {
    console.log('Crear nuevo tipo de identificación');
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (identificationType: IdentificationType) => {
    console.log('Editar tipo de identificación:', identificationType);
    // TODO: Implementar modal de edición
    alert(`Funcionalidad de edición en desarrollo para: ${identificationType.nombre}`);
  };

  const handleDelete = async (identificationType: IdentificationType) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tipo de identificación "${identificationType.nombre}"?`)) {
      try {
        await identificationTypeApi.delete(identificationType.id);
        // Recargar la lista después de eliminar
        await loadIdentificationTypes();
        alert('Tipo de identificación eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando tipo de identificación:', error);
        alert('Error al eliminar el tipo de identificación');
      }
    }
  };

  const handleView = async (identificationType: IdentificationType) => {
    console.log('Ver tipo de identificación:', identificationType);
    // TODO: Implementar modal de vista detallada
    alert(`Vista detallada en desarrollo para: ${identificationType.nombre}`);
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
      value: identificationTypes.length,
      icon: '🆔',
      color: 'blue',
      description: 'Tipos de identificación registrados'
    },
    {
      label: 'Activos',
      value: identificationTypes.filter(t => t.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Tipos activos'
    },
    {
      label: 'Inactivos',
      value: identificationTypes.filter(t => !t.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Tipos inactivos'
    }
  ];

  return (
    <AdminDataTable
      title="Gestión de Tipos de Identificación"
      description="Administra los tipos de identificación del sistema"
      columns={columns}
      data={filteredIdentificationTypes}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      searchPlaceholder="Buscar tipos de identificación..."
      stats={<AdminStats stats={stats} />}
    />
  );
};

export default IdentificationTypeList;
