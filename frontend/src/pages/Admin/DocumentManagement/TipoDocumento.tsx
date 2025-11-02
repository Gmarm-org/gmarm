import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { documentTypeApi, type DocumentType } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const TipoDocumento: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState<DocumentType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  useEffect(() => {
    filterDocumentTypes();
  }, [searchTerm, documentTypes]);

  const loadDocumentTypes = async () => {
    try {
      setIsLoading(true);
      const data = await documentTypeApi.getAll();
      setDocumentTypes(data);
      setFilteredDocumentTypes(data);
    } catch (error) {
      console.error('Error cargando tipos de documento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDocumentTypes = () => {
    let filtered = documentTypes;

    if (searchTerm) {
      filtered = filtered.filter(dt =>
        dt.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dt.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dt.tipoProcesoNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocumentTypes(filtered);
  };

  const handleCreate = () => {
    setSelectedType(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (documentType: DocumentType) => {
    setSelectedType(documentType);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (documentType: DocumentType) => {
    setSelectedType(documentType);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<DocumentType>) => {
    try {
      if (modalMode === 'create') {
        await documentTypeApi.create(data);
      } else if (modalMode === 'edit' && selectedType) {
        await documentTypeApi.update(selectedType.id, data);
      }
      await loadDocumentTypes();
      setModalOpen(false);
    } catch (error) {
      console.error('Error guardando tipo de documento:', error);
      throw error;
    }
  };

  const handleDelete = async (documentType: DocumentType) => {
    if (confirm(`¿Eliminar el tipo de documento "${documentType.nombre}"?`)) {
      try {
        await documentTypeApi.delete(documentType.id);
        await loadDocumentTypes();
      } catch (error) {
        console.error('Error eliminando tipo de documento:', error);
        alert('Error al eliminar el tipo de documento');
      }
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'descripcion',
      label: 'Descripción',
      render: (value) => (
        <div className="text-sm text-gray-700 max-w-md">{value}</div>
      )
    },
    {
      key: 'tipoProcesoNombre',
      label: 'Tipo de Proceso',
      render: (value) => (
        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {value}
        </span>
      )
    },
    {
      key: 'obligatorio',
      label: 'Obligatorio',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? '⚠️ Sí' : 'No'}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
        }`}>
          {value ? '✅ Activo' : '❌ Inactivo'}
        </span>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Tipos',
      value: documentTypes.length,
      icon: '📄',
      color: 'blue',
      description: 'Todos los tipos de documento'
    },
    {
      label: 'Activos',
      value: documentTypes.filter(dt => dt.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Tipos activos'
    },
    {
      label: 'Obligatorios',
      value: documentTypes.filter(dt => dt.obligatorio).length,
      icon: '⚠️',
      color: 'red',
      description: 'Documentos obligatorios'
    },
    {
      label: 'Opcionales',
      value: documentTypes.filter(dt => !dt.obligatorio).length,
      icon: '📝',
      color: 'purple',
      description: 'Documentos opcionales'
    }
  ];

  const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { key: 'obligatorio', label: 'Obligatorio', type: 'checkbox' as const },
    { key: 'estado', label: 'Estado', type: 'checkbox' as const }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Tipos de Documento"
        description="Administra los tipos de documentos requeridos por tipo de cliente"
        columns={columns}
        data={filteredDocumentTypes}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar tipos de documento..."
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
        title="Tipo de Documento"
        fields={formFields}
      />
    </>
  );
};

export default TipoDocumento;

