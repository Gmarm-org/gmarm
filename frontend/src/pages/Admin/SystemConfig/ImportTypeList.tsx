import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { importTypeApi, type ImportType } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const ImportTypeList: React.FC = () => {
  const [importTypes, setImportTypes] = useState<ImportType[]>([]);
  const [filteredImportTypes, setFilteredImportTypes] = useState<ImportType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    loadImportTypes();
  }, []);

  const loadImportTypes = async () => {
    try {
      setIsLoading(true);
      const data = await importTypeApi.getAll();
      setImportTypes(data);
      setFilteredImportTypes(data);
    } catch (error) {
      console.error('Error cargando tipos de importación:', error);
      // Fallback a datos mock si la API falla
      // NOTA: Los cupos se manejan a nivel de Grupo de Importación, no de Tipo de Importación
      const mockImportTypes: ImportType[] = [
        {
          id: 1,
          nombre: 'CUPO CIVIL',
          descripcion: 'Importación regular para personas naturales civiles',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 2,
          nombre: 'EXTRACUPO UNIFORMADO',
          descripcion: 'Importación especial para personal uniformado militar y policial',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 3,
          nombre: 'EXTRACUPO COMPAÑÍA',
          descripcion: 'Importación especial para empresas de seguridad',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 4,
          nombre: 'CUPO DEPORTISTA',
          descripcion: 'Importación regular para deportistas',
          estado: true,
          fecha_creacion: '2024-01-01'
        }
      ];
      setImportTypes(mockImportTypes);
      setFilteredImportTypes(mockImportTypes);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterImportTypes();
  }, [searchTerm, importTypes]);

  const filterImportTypes = () => {
    let filtered = importTypes;

    if (searchTerm) {
      filtered = filtered.filter(importType =>
        importType.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        importType.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredImportTypes(filtered);
  };

  const handleCreate = () => {
    setSelectedType(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (importType: ImportType) => {
    setSelectedType(importType);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (importType: ImportType) => {
    setSelectedType(importType);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<ImportType>) => {
    try {
      if (modalMode === 'create') {
        await importTypeApi.create(data);
      } else if (modalMode === 'edit' && selectedType) {
        await importTypeApi.update(selectedType.id, data);
      }
      // Recargar lista
      await loadImportTypes();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedType(null);
      alert(modalMode === 'create' ? 'Tipo de importación creado exitosamente' : 'Tipo de importación actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando tipo de importación:', error);
      alert('Error al guardar el tipo de importación. Verifique que el código sea único.');
      throw error;
    }
  };

  const handleDelete = async (importType: ImportType) => {
    if (window.confirm(`¿Desactivar el tipo de importación "${importType.nombre}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await importTypeApi.update(importType.id, { ...importType, estado: false });
        await loadImportTypes();
        alert('Tipo de importación desactivado exitosamente');
      } catch (error) {
        console.error('Error desactivando tipo de importación:', error);
        alert('Error al desactivar el tipo de importación');
      }
    }
  };

  // NOTA: Los cupos se manejan a nivel de Grupo de Importación, no aquí
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
          {value ? new Date(value).toLocaleDateString('es-EC') : 'Sin fecha'}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Tipos',
      value: importTypes.length,
      icon: '📦',
      color: 'blue',
      description: 'Tipos de importación registrados'
    },
    {
      label: 'Activos',
      value: importTypes.filter(t => t.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Tipos activos'
    },
    {
      label: 'Inactivos',
      value: importTypes.filter(t => !t.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Tipos inactivos'
    }
  ];

  // NOTA: Los cupos se manejan a nivel de Grupo de Importación, no aquí
  const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'codigo', label: 'Código', type: 'text' as const, required: true, placeholder: 'Ej: IMP_CIV, IMP_MIL' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { key: 'estado', label: 'Activo', type: 'checkbox' as const }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Tipos de Importación"
        description="Administra los tipos de importación del sistema"
        columns={columns}
        data={filteredImportTypes}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar tipos de importación..."
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
        title="Tipo de Importación"
        fields={formFields}
      />
    </>
  );
};

export default ImportTypeList;
