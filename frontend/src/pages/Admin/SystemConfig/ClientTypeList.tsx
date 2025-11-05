import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { clientTypeApi, type ClientType } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const ClientTypeList: React.FC = () => {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [filteredClientTypes, setFilteredClientTypes] = useState<ClientType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ClientType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

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
      setClientTypes([]);
      setFilteredClientTypes([]);
      alert('Error al cargar tipos de cliente. Por favor, recarga la página.');
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

  const handleCreate = () => {
    setSelectedType(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (clientType: ClientType) => {
    setSelectedType(clientType);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (clientType: ClientType) => {
    setSelectedType(clientType);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<ClientType>) => {
    try {
      if (modalMode === 'create') {
        await clientTypeApi.create(data);
      } else if (modalMode === 'edit' && selectedType) {
        await clientTypeApi.update(selectedType.id, data);
      }
      // Recargar lista
      await loadClientTypes();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedType(null);
      alert(modalMode === 'create' ? 'Tipo de cliente creado exitosamente' : 'Tipo de cliente actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando tipo de cliente:', error);
      alert('Error al guardar el tipo de cliente. Verifique que el código sea único.');
      throw error;
    }
  };

  const handleDelete = async (clientType: ClientType) => {
    if (window.confirm(`¿Desactivar el tipo de cliente "${clientType.nombre}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await clientTypeApi.update(clientType.id, { ...clientType, estado: false });
        await loadClientTypes();
        alert('Tipo de cliente desactivado exitosamente');
      } catch (error) {
        console.error('Error desactivando tipo de cliente:', error);
        alert('Error al desactivar el tipo de cliente');
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

  const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { key: 'estado', label: 'Estado', type: 'checkbox' as const }
  ];

  return (
    <>
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

      <SimpleFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedType(null);
        }}
        onSave={handleSave}
        data={selectedType}
        mode={modalMode}
        title="Tipo de Cliente"
        fields={formFields}
      />
    </>
  );
};

export default ClientTypeList;
