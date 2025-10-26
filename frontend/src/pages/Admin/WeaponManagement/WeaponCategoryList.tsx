import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { weaponCategoryApi, type WeaponCategory } from '../../../services/adminApi';

const WeaponCategoryList: React.FC = () => {
  const [categories, setCategories] = useState<WeaponCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<WeaponCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      // Fallback a datos mock si la API falla
      const mockCategories: WeaponCategory[] = [
        {
          id: 1,
          nombre: 'PISTOLA',
          descripcion: 'Armas de fuego cortas, de una mano',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 2,
          nombre: 'ESCOPETA',
          descripcion: 'Armas de fuego de cañón largo para caza',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 3,
          nombre: 'RIFLE',
          descripcion: 'Armas de fuego de alta precisión',
          estado: true,
          fecha_creacion: '2024-01-01'
        },
        {
          id: 4,
          nombre: 'CARABINA',
          descripcion: 'Rifles de cañón corto',
          estado: true,
          fecha_creacion: '2024-01-01'
        }
      ];
      setCategories(mockCategories);
      setFilteredCategories(mockCategories);
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

  const handleCreate = async () => {
    console.log('Crear nueva categoría');
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (category: WeaponCategory) => {
    console.log('Editar categoría:', category);
    // TODO: Implementar modal de edición
    alert(`Funcionalidad de edición en desarrollo para: ${category.nombre}`);
  };

  const handleDelete = async (category: WeaponCategory) => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.nombre}"?`)) {
      try {
        await weaponCategoryApi.delete(category.id);
        // Recargar la lista después de eliminar
        await loadCategories();
        alert('Categoría eliminada exitosamente');
      } catch (error) {
        console.error('Error eliminando categoría:', error);
        alert('Error al eliminar la categoría');
      }
    }
  };

  const handleView = async (category: WeaponCategory) => {
    console.log('Ver categoría:', category);
    // TODO: Implementar modal de vista detallada
    alert(`Vista detallada en desarrollo para: ${category.nombre}`);
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

  return (
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
  );
};

export default WeaponCategoryList;
