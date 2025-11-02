import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { identificationTypeApi, type IdentificationType } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const IdentificationTypeList: React.FC = () => {
  const [identificationTypes, setIdentificationTypes] = useState<IdentificationType[]>([]);
  const [filteredIdentificationTypes, setFilteredIdentificationTypes] = useState<IdentificationType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<IdentificationType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

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
      setIdentificationTypes([]);
      setFilteredIdentificationTypes([]);
      alert('Error al cargar tipos de identificación. Por favor, recarga la página.');
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

  const handleCreate = () => {
    setSelectedType(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (identificationType: IdentificationType) => {
    setSelectedType(identificationType);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (identificationType: IdentificationType) => {
    setSelectedType(identificationType);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<IdentificationType>) => {
    try {
      if (modalMode === 'create') {
        await identificationTypeApi.create(data);
      } else if (modalMode === 'edit' && selectedType) {
        await identificationTypeApi.update(selectedType.id, data);
      }
      await loadIdentificationTypes();
      setModalOpen(false);
    } catch (error) {
      console.error('Error guardando tipo de identificación:', error);
      throw error;
    }
  };

  const handleDelete = async (identificationType: IdentificationType) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el tipo de identificación "${identificationType.nombre}"?`)) {
      try {
        await identificationTypeApi.delete(identificationType.id);
        await loadIdentificationTypes();
        alert('Tipo de identificación eliminado exitosamente');
      } catch (error) {
        console.error('Error eliminando tipo de identificación:', error);
        alert('Error al eliminar el tipo de identificación');
      }
    }
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

  const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { key: 'estado', label: 'Estado', type: 'checkbox' as const }
  ];

  return (
    <>
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

      <SimpleFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedType(null);
        }}
        onSave={handleSave}
        data={selectedType}
        mode={modalMode}
        title="Tipo de Identificación"
        fields={formFields}
      />
    </>
  );
};

export default IdentificationTypeList;
