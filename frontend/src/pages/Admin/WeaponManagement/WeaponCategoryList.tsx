import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { weaponCategoryApi, type WeaponCategory } from '../../../services/adminApi';
import SimpleFormModal from '../components/SimpleFormModal';

const WeaponCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<WeaponCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<WeaponCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<WeaponCategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setIsLoading(true);
      const data = await weaponCategoryApi.getAll();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      setCategories([]);
      setFilteredCategories([]);
      alert('Error al cargar categorías. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterCategories();
  }, [searchTerm, categories]);

  const filterCategories = () => {
    let filtered = categories;

    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const handleCreate = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (category: WeaponCategory) => {
    setSelectedCategory(category);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (category: WeaponCategory) => {
    setSelectedCategory(category);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = async (categoryData: Partial<WeaponCategory>) => {
    try {
      if (modalMode === 'create') {
        await weaponCategoryApi.create(categoryData);
      } else if (modalMode === 'edit' && selectedCategory) {
        await weaponCategoryApi.update(selectedCategory.id, categoryData);
      }
      await loadCategories();
      setModalOpen(false);
    } catch (error) {
      console.error('Error guardando categoría:', error);
      throw error;
    }
  };

  const handleDelete = async (category: WeaponCategory) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.nombre}"?`)) {
      try {
        await weaponCategoryApi.delete(category.id);
        await loadCategories();
        alert('Categoría eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert('Error al eliminar la categoría');
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
          {value ? 'Activa' : 'Inactiva'}
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
      label: 'Total Categorías',
      value: categories.length,
      icon: '🏷️',
      color: 'blue',
      description: 'Categorías registradas'
    },
    {
      label: 'Activas',
      value: categories.filter(c => c.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Categorías activas'
    },
    {
      label: 'Inactivas',
      value: categories.filter(c => !c.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Categorías inactivas'
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
        title="Gestión de Categorías de Armas"
        description="Administra las categorías del catálogo de armas del sistema"
        columns={columns}
        data={filteredCategories}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar categorías..."
        stats={<AdminStats stats={stats} />}
      />

      <SimpleFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedCategory(null);
        }}
        onSave={handleSave}
        data={selectedCategory}
        mode={modalMode}
        title="Categoría de Arma"
        fields={formFields}
      />
    </>
  );
};

export default WeaponCategoryList;
