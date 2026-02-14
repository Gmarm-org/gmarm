import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { weaponApi, weaponCategoryApi } from '../../../services/adminApi';
import type { Weapon } from '../../../services/adminApi';
import { WeaponViewModal, WeaponEditModal, WeaponDeleteModal, WeaponCreateModal } from './modals';
import { getWeaponImageUrl } from '../../../utils/imageUtils';
import StatusBadge, { estadoVariant, categoriaArmaVariant } from '../../../components/common/StatusBadge';

const WeaponListContent: React.FC = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [categories, setCategories] = useState<Array<{id: number, nombre: string}>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para modales
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  useEffect(() => {
    loadWeapons();
    loadCategories();
  }, []);

  const loadWeapons = async () => {
    try {
      setIsLoading(true);
      const data = await weaponApi.getAll();
      setWeapons(data);
    } catch (error) {
      console.error('Error cargando armas:', error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await weaponCategoryApi.getAll();
      setCategories(data);
    } catch (error) {
      console.error('Error cargando categorías:', error instanceof Error ? error.message : 'Error desconocido');
    }
  };


  const filterWeapons = (weapons: Weapon[], searchTerm: string) => {
    let filtered = weapons;
    
    
    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      filtered = filtered.filter(weapon => 
        weapon.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.alimentadora?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.color?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.calibre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.categoriaNombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const handleView = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setViewModalOpen(true);
  };

  const handleEdit = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setEditModalOpen(true);
  };

  const handleDelete = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setDeleteModalOpen(true);
  };

  const handleSaveChanges = async (formData: FormData) => {
    if (!selectedWeapon) return;
    
    try {
      await weaponApi.updateWithImage(selectedWeapon.id, formData);
      await loadWeapons(); // Recargar la lista
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error actualizando arma:', error instanceof Error ? error.message : 'Error desconocido');
      alert('Error al actualizar la arma');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedWeapon) return;
    
    try {
      // En lugar de eliminar, desactivar la arma
      await weaponApi.update(selectedWeapon.id, {
        ...selectedWeapon,
        estado: false
      });
      await loadWeapons(); // Recargar la lista
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error desactivando arma:', error instanceof Error ? error.message : 'Error desconocido');
      alert('Error al desactivar la arma');
    }
  };

  const handleReactivate = async (weapon: Weapon) => {
    try {
      await weaponApi.update(weapon.id, {
        ...weapon,
        estado: true
      });
      await loadWeapons(); // Recargar la lista
    } catch (error) {
      console.error('Error reactivando arma:', error instanceof Error ? error.message : 'Error desconocido');
      alert('Error al reactivar la arma');
    }
  };

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const handleCreateSave = async (formData: FormData) => {
    try {
      await weaponApi.createWithImage(formData);
      await loadWeapons(); // Recargar la lista
      setCreateModalOpen(false);
      alert('Arma creada exitosamente');
    } catch (error) {
      console.error('Error creando arma:', error instanceof Error ? error.message : 'Error desconocido');
      alert('Error al crear la arma: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  const filteredWeapons = filterWeapons(weapons, searchTerm);

  const columns: AdminTableColumn[] = [
    {
      key: 'categoriaNombre',
      label: 'Categoría',
      render: (value: any) => (
        <StatusBadge label={value || 'Sin categoría'} variant={categoriaArmaVariant(value)} />
      )
    },
    {
      key: 'modelo',
      label: 'Modelo',
      render: (value: any) => <span className="font-medium text-gray-900">{value || 'Sin modelo'}</span>
    },
    {
      key: 'marca',
      label: 'Marca',
      render: (value: any) => <span className="text-gray-700">{value || 'Sin marca'}</span>
    },
    {
      key: 'alimentadora',
      label: 'Alimentadora',
      render: (value: any) => <span className="text-gray-700">{value || 'Sin alimentadora'}</span>
    },
    {
      key: 'color',
      label: 'Color',
      render: (value: any) => <span className="text-gray-700">{value || 'Sin color'}</span>
    },
    {
      key: 'calibre',
      label: 'Calibre',
      render: (value: any) => <span className="text-gray-700">{value || 'Sin calibre'}</span>
    },
    {
      key: 'capacidad',
      label: 'Capacidad',
      render: (value: any) => <span className="text-gray-700">{value || 'Sin capacidad'}</span>
    },
    {
      key: 'precioReferencia',
      label: 'Precio',
      render: (value: any) => (
        <span className="font-semibold text-green-600">
          ${typeof value === 'number' && !isNaN(value) ? value.toFixed(2) : '0.00'}
        </span>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value: any, row: any) => (
        <div className="flex items-center space-x-2">
          <StatusBadge label={value ? '✅ Activo' : '❌ Inactivo'} variant={estadoVariant(value)} />
          {!value && (
            <button
              onClick={() => handleReactivate(row)}
              className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50"
              title="Reactivar arma"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>
      )
    },
    {
      key: 'urlImagen',
      label: 'Imagen',
      render: (value: any) => (
        <div className="flex justify-center">
          <img
            src={getWeaponImageUrl(value)}
            alt="Arma"
            className="h-12 w-12 object-cover rounded-lg border border-gray-200"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = getWeaponImageUrl(null);
            }}
          />
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    { 
      label: 'Total de Armas', 
      value: weapons.length.toString(), 
      icon: '🔫', 
      color: 'blue',
      description: 'Todas las armas del sistema'
    },
    { 
      label: 'Armas Activas', 
      value: weapons.filter(w => w.estado).length.toString(), 
      icon: '✅', 
      color: 'green',
      description: 'Disponibles para usuarios'
    },
    { 
      label: 'Armas Inactivas', 
      value: weapons.filter(w => !w.estado).length.toString(), 
      icon: '❌', 
      color: 'red',
      description: 'Temporalmente no disponibles'
    },
    { 
      label: 'Categorías', 
      value: categories.length.toString(), 
      icon: '🏷️', 
      color: 'purple',
      description: 'Tipos de armas disponibles'
    }
  ];

  return (
    <div>
      <AdminDataTable
        title="Lista de Armas"
        description="Gestiona todas las armas disponibles en el sistema"
        data={filteredWeapons}
        columns={columns}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        isLoading={isLoading}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar por modelo, marca, alimentadora, color, calibre o categoría..."
        stats={<AdminStats stats={stats} />}
        filters={undefined}
      />

      {/* Modales */}
      {selectedWeapon && (
        <>
          <WeaponViewModal
            weapon={selectedWeapon}
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            onEdit={handleEdit}
          />
          
          <WeaponEditModal
            weapon={selectedWeapon}
            categories={categories}
            isOpen={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            onSave={handleSaveChanges}
          />
          
          <WeaponDeleteModal
            weapon={selectedWeapon}
            isOpen={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            onConfirm={handleConfirmDelete}
          />
        </>
      )}

      {/* Modal de Creación */}
      <WeaponCreateModal
        categories={categories}
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCreateSave}
      />
    </div>
  );
};

export default WeaponListContent;

