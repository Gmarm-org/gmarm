import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { clientTypeApi, importTypeApi, clientImportTypeApi, type ClientType, type ImportType } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const ClientTypeList: React.FC = () => {
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [filteredClientTypes, setFilteredClientTypes] = useState<ClientType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<ClientType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [importTypes, setImportTypes] = useState<ImportType[]>([]);
  const [selectedImportTypes, setSelectedImportTypes] = useState<number[]>([]);
  const [clientImportRelations, setClientImportRelations] = useState<any[]>([]);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [clientTypesData, importTypesData, relationsData] = await Promise.all([
        clientTypeApi.getAll(),
        importTypeApi.getAll(),
        clientImportTypeApi.getAll()
      ]);
      setClientTypes(clientTypesData);
      setFilteredClientTypes(clientTypesData);
      setImportTypes(importTypesData);
      setClientImportRelations(relationsData);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setClientTypes([]);
      setFilteredClientTypes([]);
      alert('Error al cargar datos. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  const getImportTypesNamesForClient = (clientTypeId: number): string => {
    const relatedImportTypes = clientImportRelations
      .filter(r => r.tipoClienteId === clientTypeId)
      .map(r => r.tipoImportacionNombre);
    return relatedImportTypes.length > 0 ? relatedImportTypes.join(', ') : 'Sin tipos asignados';
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
    setSelectedImportTypes([]);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = async (clientType: ClientType) => {
    setSelectedType(clientType);
    setModalMode('edit');
    // Cargar tipos de importación asociados
    try {
      const relations = await clientImportTypeApi.getAll();
      const relatedImportTypes = relations
        .filter(r => r.tipoClienteId === clientType.id)
        .map(r => r.tipoImportacionId);
      setSelectedImportTypes(relatedImportTypes);
    } catch (error) {
      console.error('Error cargando tipos de importación:', error);
      setSelectedImportTypes([]);
    }
    setModalOpen(true);
  };

  const handleView = async (clientType: ClientType) => {
    setSelectedType(clientType);
    setModalMode('view');
    // Cargar tipos de importación asociados
    try {
      const relations = await clientImportTypeApi.getAll();
      const relatedImportTypes = relations
        .filter(r => r.tipoClienteId === clientType.id)
        .map(r => r.tipoImportacionId);
      setSelectedImportTypes(relatedImportTypes);
    } catch (error) {
      console.error('Error cargando tipos de importación:', error);
      setSelectedImportTypes([]);
    }
    setModalOpen(true);
  };

  const handleSave = async (data: Partial<ClientType>) => {
    try {
      let tipoClienteId: number;
      
      if (modalMode === 'create') {
        const newClientType = await clientTypeApi.create(data);
        tipoClienteId = newClientType.id;
      } else if (modalMode === 'edit' && selectedType) {
        await clientTypeApi.update(selectedType.id, data);
        tipoClienteId = selectedType.id;
      } else {
        return;
      }

      // Guardar relaciones con tipos de importación
      // 1. Obtener relaciones actuales
      const allRelations = await clientImportTypeApi.getAll();
      const currentRelations = allRelations.filter(r => r.tipoClienteId === tipoClienteId);
      
      // 2. Eliminar relaciones que ya no están seleccionadas
      for (const relation of currentRelations) {
        if (!selectedImportTypes.includes(relation.tipoImportacionId)) {
          await clientImportTypeApi.delete(relation.id);
        }
      }
      
      // 3. Crear nuevas relaciones
      const currentImportTypeIds = currentRelations.map(r => r.tipoImportacionId);
      for (const importTypeId of selectedImportTypes) {
        if (!currentImportTypeIds.includes(importTypeId)) {
          await clientImportTypeApi.create({ 
            tipoClienteId, 
            tipoImportacionId: importTypeId 
          });
        }
      }
      
      // Recargar lista
      await loadAllData();
      // Cerrar modal y limpiar selección
      setModalOpen(false);
      setSelectedType(null);
      setSelectedImportTypes([]);
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
      key: 'id',
      label: 'Tipos de Importación',
      render: (value, row) => {
        const importTypeNames = getImportTypesNamesForClient(value as number);
        if (importTypeNames === 'Sin tipos asignados') {
          return <span className="text-xs text-gray-400 italic">{importTypeNames}</span>;
        }
        return (
          <div className="text-xs text-gray-700">
            {importTypeNames.split(', ').map((name, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-2 py-0.5 mr-1 mb-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
              >
                {name}
              </span>
            ))}
          </div>
        );
      }
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
    { key: 'codigo', label: 'Código', type: 'text' as const, required: true, placeholder: 'Ej: CIV, MIL, EMP' },
    { key: 'descripcion', label: 'Descripción', type: 'textarea' as const, required: true },
    { key: 'esCivil', label: 'Es Civil', type: 'checkbox' as const },
    { key: 'esMilitar', label: 'Es Militar', type: 'checkbox' as const },
    { key: 'esPolicia', label: 'Es Policía', type: 'checkbox' as const },
    { key: 'esEmpresa', label: 'Es Empresa', type: 'checkbox' as const },
    { key: 'esDeportista', label: 'Es Deportista', type: 'checkbox' as const },
    { key: 'requiereIssfa', label: 'Requiere Código ISSFA', type: 'checkbox' as const },
    { key: 'estado', label: 'Activo', type: 'checkbox' as const }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Tipos de Cliente"
        description="Administra los tipos de cliente y sus tipos de importación asociados"
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

      {/* Modal Personalizado para Tipo de Cliente con Tipos de Importación */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center sticky top-0">
              <h2 className="text-2xl font-bold text-gray-800">
                {modalMode === 'create' ? '➕ Crear Tipo de Cliente' : modalMode === 'edit' ? '✏️ Editar Tipo de Cliente' : '👁️ Ver Tipo de Cliente'}
              </h2>
              <button onClick={() => {
                setModalOpen(false);
                setSelectedType(null);
                setSelectedImportTypes([]);
              }} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" title="Cerrar">
                ✖️
              </button>
            </div>
            
            <SimpleFormModal
              isOpen={true}
              onClose={() => {
                setModalOpen(false);
                setSelectedType(null);
                setSelectedImportTypes([]);
              }}
              onSave={handleSave}
              data={selectedType}
              mode={modalMode}
              title=""
              fields={formFields}
              hideHeader={true}
              customSection={
                <div className="border-t border-gray-200 pt-4 mt-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tipos de Importación Permitidos</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Selecciona los tipos de importación que este tipo de cliente puede utilizar:
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto p-2 bg-gray-50 rounded-md">
                    {importTypes.map(importType => (
                      <label key={importType.id} className="flex items-center p-2 hover:bg-gray-100 rounded-md cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedImportTypes.includes(importType.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedImportTypes([...selectedImportTypes, importType.id]);
                            } else {
                              setSelectedImportTypes(selectedImportTypes.filter(id => id !== importType.id));
                            }
                          }}
                          disabled={modalMode === 'view'}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {importType.nombre}
                          {importType.descripcion && (
                            <span className="text-xs text-gray-500 ml-2">({importType.descripcion})</span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedImportTypes.length} tipo(s) de importación seleccionado(s)
                  </p>
                </div>
              }
            />
          </div>
        </div>
      )}
    </>
  );
};

export default ClientTypeList;
