import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { documentTypeApi, tipoProcesoApi, type DocumentType, type TipoProceso } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';


const TipoDocumento: React.FC = () => {
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [filteredDocumentTypes, setFilteredDocumentTypes] = useState<DocumentType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<DocumentType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [tiposProceso, setTiposProceso] = useState<TipoProceso[]>([]);

  useEffect(() => {
    loadDocumentTypes();
    loadTiposProceso();
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

  const loadTiposProceso = async () => {
    try {
      const data = await tipoProcesoApi.getAll();
      setTiposProceso(data);
    } catch (error) {
      console.error('Error cargando tipos de proceso:', error);
    }
  };

  const filterDocumentTypes = () => {
    let filtered = documentTypes;

    if (searchTerm) {
      filtered = filtered.filter(dt =>
        dt.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dt.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dt.tipoProcesoNombre && dt.tipoProcesoNombre.toLowerCase().includes(searchTerm.toLowerCase()))
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
      // GARANTIZAR: Si gruposImportacion = true, tipoProcesoId DEBE ser null/undefined
      if (data.gruposImportacion) {
        // Limpiar tipoProcesoId explícitamente
        data.tipoProcesoId = undefined;
        delete data.tipoProcesoId;
      } else {
        // Si NO es para grupos, tipoProcesoId es REQUERIDO
        if (!data.tipoProcesoId) {
          alert('❌ El Tipo de Proceso es requerido para documentos de clientes.\n\nPor favor, seleccione un Tipo de Proceso o marque "Para Grupos de Importación" si el documento es solo para grupos.');
          throw new Error('Tipo de Proceso requerido');
        }
      }

      // Enviar al backend
      if (modalMode === 'create') {
        await documentTypeApi.create(data);
      } else if (modalMode === 'edit' && selectedType) {
        await documentTypeApi.update(selectedType.id, data);
      }
      
      // Recargar lista
      await loadDocumentTypes();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedType(null);
      alert(modalMode === 'create' ? '✅ Tipo de documento creado exitosamente' : '✅ Tipo de documento actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando tipo de documento:', error);
      if (!(error instanceof Error && error.message === 'Tipo de Proceso requerido')) {
        alert('❌ Error al guardar el tipo de documento. Verifique los datos e intente nuevamente.');
      }
      throw error;
    }
  };

  const handleDelete = async (documentType: DocumentType) => {
    if (confirm(`¿Desactivar el tipo de documento "${documentType.nombre}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await documentTypeApi.update(documentType.id, { ...documentType, estado: false });
        await loadDocumentTypes();
        alert('Tipo de documento desactivado exitosamente');
      } catch (error) {
        console.error('Error desactivando tipo de documento:', error);
        alert('Error al desactivar el tipo de documento');
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
      render: (value, row) => {
        // Si es documento de grupos de importación, mostrar badge especial
        if (row.gruposImportacion) {
          return (
            <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
              📦 Grupos Importación
            </span>
          );
        }
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {value || 'N/A'}
          </span>
        );
      }
    },
    {
      key: 'gruposImportacion',
      label: 'Tipo',
      render: (value) => (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? '📦 Grupos' : '👤 Clientes'}
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
    },
    {
      label: 'Para Grupos',
      value: documentTypes.filter(dt => dt.gruposImportacion).length,
      icon: '📦',
      color: 'purple',
      description: 'Documentos para grupos de importación'
    },
    {
      label: 'Para Clientes',
      value: documentTypes.filter(dt => !dt.gruposImportacion).length,
      icon: '👤',
      color: 'blue',
      description: 'Documentos para clientes'
    }
  ];

  const formFields = [
    { key: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { 
      key: 'gruposImportacion', 
      label: 'Para Grupos de Importación', 
      type: 'checkbox' as const
    },
    { 
      key: 'tipoProcesoId', 
      label: 'Tipo de Proceso', 
      type: 'select' as const, 
      required: true, // Será manejado dinámicamente en SimpleFormModal
      options: tiposProceso.map(tp => ({ value: tp.id, label: tp.nombre })),
      disabled: selectedType?.gruposImportacion || false // Estado inicial, se actualiza dinámicamente en SimpleFormModal
    },
    { key: 'urlDocumento', label: 'URL del Documento (opcional)', type: 'text' as const, placeholder: 'https://ejemplo.com/documento.pdf' },
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
        customSection={(formData: any) => {
          // Sección dinámica que se actualiza según el estado del formulario
          const isGruposImportacion = formData?.gruposImportacion || false;
          
          if (isGruposImportacion) {
            return (
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <p className="text-sm text-purple-800">
                  <strong>ℹ️ Documento para Grupos de Importación:</strong> Este tipo de documento no requiere Tipo de Proceso.
                  Solo aparecerá en la gestión de grupos de importación, no en documentos de clientes individuales.
                  <br />
                  <span className="font-semibold">El campo Tipo de Proceso está deshabilitado y será NULL automáticamente.</span>
                </p>
              </div>
            );
          }
          
          return (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>ℹ️ Documento para Clientes:</strong> Este tipo de documento requiere un Tipo de Proceso para asociarlo con tipos de clientes específicos.
                <br />
                <span className="font-semibold">Por favor, seleccione un Tipo de Proceso.</span>
              </p>
            </div>
          );
        }}
      />
    </>
  );
};

export default TipoDocumento;

