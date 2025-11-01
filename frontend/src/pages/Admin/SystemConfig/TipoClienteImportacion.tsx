import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { clientImportTypeApi, type ClientImportType } from '../../../services/adminApi';

const TipoClienteImportacion: React.FC = () => {
  const [relations, setRelations] = useState<ClientImportType[]>([]);
  const [filteredRelations, setFilteredRelations] = useState<ClientImportType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRelations();
  }, []);

  useEffect(() => {
    filterRelations();
  }, [searchTerm, relations]);

  const loadRelations = async () => {
    try {
      setIsLoading(true);
      const data = await clientImportTypeApi.getAll();
      setRelations(data);
      setFilteredRelations(data);
    } catch (error) {
      console.error('Error cargando relaciones:', error);
    } finally {
      setIsLoading(false);
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
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = (relation: ClientImportType) => {
    alert(`Editar relación: ${relation.tipoClienteNombre} - ${relation.tipoImportacionNombre}`);
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

  const handleView = (relation: ClientImportType) => {
    alert(`Cliente: ${relation.tipoClienteNombre}\nImportación: ${relation.tipoImportacionNombre}\nCupo Máximo: ${relation.cupoMaximo}`);
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
    },
    {
      key: 'cupoMaximo',
      label: 'Cupo Máximo',
      render: (value) => (
        <span className="text-sm font-semibold text-gray-900">{value}</span>
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
    <AdminDataTable
      title="Gestión de Tipo Cliente - Importación"
      description="Administra la relación entre tipos de cliente y tipos de importación"
      columns={columns}
      data={filteredRelations}
      isLoading={isLoading}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onCreate={handleCreate}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onView={handleView}
      searchPlaceholder="Buscar por tipo de cliente o importación..."
      stats={<AdminStats stats={stats} />}
    />
  );
};

export default TipoClienteImportacion;

