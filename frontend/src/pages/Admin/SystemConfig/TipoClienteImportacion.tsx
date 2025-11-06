import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { clientImportTypeApi, clientTypeApi, importTypeApi, type ClientImportType, type ClientType, type ImportType } from '../../../services/adminApi';

interface RelationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { tipoClienteId: number; tipoImportacionId: number }) => Promise<void>;
  clientTypes: ClientType[];
  importTypes: ImportType[];
  mode: 'create' | 'view';
  data?: ClientImportType | null;
}

const RelationFormModal: React.FC<RelationFormModalProps> = ({ isOpen, onClose, onSave, clientTypes, importTypes, mode, data }) => {
  const [formData, setFormData] = useState({ tipoClienteId: 0, tipoImportacionId: 0 });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data && mode === 'view') {
      setFormData({ tipoClienteId: data.tipoClienteId, tipoImportacionId: data.tipoImportacionId });
    } else {
      setFormData({ tipoClienteId: 0, tipoImportacionId: 0 });
    }
  }, [data, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;
    if (!formData.tipoClienteId || !formData.tipoImportacionId) {
      alert('Debe seleccionar tipo de cliente y tipo de importación');
      return;
    }
    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando relación:', error);
      alert('Error al guardar la relación');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            {mode === 'create' ? '➕ Crear Relación' : '👁️ Ver Relación'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none" title="Cerrar">
            ✖️
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cliente *</label>
            <select value={formData.tipoClienteId} onChange={(e) => setFormData({ ...formData, tipoClienteId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={mode === 'view'}>
              <option value={0}>Seleccione...</option>
              {clientTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Importación *</label>
            <select value={formData.tipoImportacionId} onChange={(e) => setFormData({ ...formData, tipoImportacionId: parseInt(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-md" required disabled={mode === 'view'}>
              <option value={0}>Seleccione...</option>
              {importTypes.map(it => <option key={it.id} value={it.id}>{it.nombre}</option>)}
            </select>
          </div>
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button type="submit" disabled={isSaving} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                {isSaving ? 'Guardando...' : 'Crear Relación'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const TipoClienteImportacion: React.FC = () => {
  const [relations, setRelations] = useState<ClientImportType[]>([]);
  const [filteredRelations, setFilteredRelations] = useState<ClientImportType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [clientTypes, setClientTypes] = useState<ClientType[]>([]);
  const [importTypes, setImportTypes] = useState<ImportType[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'view'>('view');
  const [selectedRelation, setSelectedRelation] = useState<ClientImportType | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    filterRelations();
  }, [searchTerm, relations]);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [relationsData, clientTypesData, importTypesData] = await Promise.all([
        clientImportTypeApi.getAll(),
        clientTypeApi.getAll(),
        importTypeApi.getAll()
      ]);
      setRelations(relationsData);
      setFilteredRelations(relationsData);
      setClientTypes(clientTypesData);
      setImportTypes(importTypesData);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRelations = async () => {
    try {
      const data = await clientImportTypeApi.getAll();
      setRelations(data);
      setFilteredRelations(data);
    } catch (error) {
      console.error('Error cargando relaciones:', error);
    }
  };

  const filterRelations = () => {
    let filtered = relations;

    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.tipoClienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.tipoImportacionNombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRelations(filtered);
  };

  const handleCreate = () => {
    setSelectedRelation(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleView = (relation: ClientImportType) => {
    setSelectedRelation(relation);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (data: { tipoClienteId: number; tipoImportacionId: number }) => {
    try {
      await clientImportTypeApi.create(data);
      await loadRelations();
      setModalOpen(false);
    } catch (error) {
      console.error('Error guardando relación:', error);
      throw error;
    }
  };

  const handleDelete = async (relation: ClientImportType) => {
    if (confirm(`¿Eliminar la relación "${relation.tipoClienteNombre} - ${relation.tipoImportacionNombre}"?`)) {
      try {
        await clientImportTypeApi.delete(relation.id);
        await loadRelations();
      } catch (error) {
        console.error('Error eliminando relación:', error);
        alert('Error al eliminar la relación');
      }
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'tipoClienteNombre',
      label: 'Tipo de Cliente',
      render: (value) => (
        <span className="inline-flex px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
          {value}
        </span>
      )
    },
    {
      key: 'tipoImportacionNombre',
      label: 'Tipo de Importación',
      render: (value) => (
        <span className="inline-flex px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
          {value}
        </span>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Relaciones',
      value: relations.length,
      icon: '🔗',
      color: 'blue',
      description: 'Relaciones configuradas'
    },
    {
      label: 'Tipos Cliente',
      value: new Set(relations.map(r => r.tipoClienteId)).size,
      icon: '👤',
      color: 'green',
      description: 'Tipos de cliente únicos'
    },
    {
      label: 'Tipos Importación',
      value: new Set(relations.map(r => r.tipoImportacionId)).size,
      icon: '📦',
      color: 'purple',
      description: 'Tipos de importación únicos'
    }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Tipo Cliente - Importación"
        description="Administra la relación entre tipos de cliente y tipos de importación"
        columns={columns}
        data={filteredRelations}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleView}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar por tipo de cliente o importación..."
        stats={<AdminStats stats={stats} />}
      />

      <RelationFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRelation(null);
        }}
        onSave={handleSave}
        clientTypes={clientTypes}
        importTypes={importTypes}
        mode={modalMode}
        data={selectedRelation}
      />
    </>
  );
};

export default TipoClienteImportacion;

