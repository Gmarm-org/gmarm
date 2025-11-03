import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { roleApi, type Role } from '../../../services/adminApi';
import RoleFormModal from './RoleFormModal';

const RoleList: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setIsLoading(true);
      const data = await roleApi.getAll();
      setRoles(data);
      setFilteredRoles(data);
    } catch (error) {
      console.error('Error cargando roles:', error);
      setRoles([]);
      setFilteredRoles([]);
      alert('Error al cargar roles. Por favor, recarga la página.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterRoles();
  }, [searchTerm, roles]);

  const filterRoles = () => {
    let filtered = roles;

    if (searchTerm) {
      filtered = filtered.filter(role =>
        role.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        role.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoles(filtered);
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (role: Role) => {
    setSelectedRole(role);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleDelete = async (role: Role) => {
    if (window.confirm(`¿Desactivar el rol "${role.nombre}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await roleApi.update(role.id, { ...role, estado: false });
        await loadRoles();
        alert('Rol desactivado exitosamente');
      } catch (error) {
        console.error('Error desactivando rol:', error);
        alert('Error al desactivar el rol');
      }
    }
  };

  const handleSave = async (roleData: Partial<Role>) => {
    try {
      if (modalMode === 'create') {
        await roleApi.create(roleData);
      } else if (modalMode === 'edit' && selectedRole) {
        await roleApi.update(selectedRole.id, roleData);
      }
      await loadRoles();
      setModalOpen(false);
    } catch (error) {
      console.error('Error guardando rol:', error);
      throw error;
    }
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'nombre',
      label: 'Rol',
      render: (value, row) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {value.charAt(0)}
              </span>
            </div>
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{value}</div>
            <div className="text-sm text-gray-500">{row.descripcion}</div>
          </div>
        </div>
      )
    },
    {
      key: 'codigo',
      label: 'Código',
      render: (value) => (
        <div className="text-sm text-gray-900 font-mono">{value}</div>
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
          {new Date(value).toLocaleDateString('es-EC')}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Roles',
      value: roles.length,
      icon: '👥',
      color: 'blue',
      description: 'Roles registrados'
    },
    {
      label: 'Activos',
      value: roles.filter(r => r.estado).length,
      icon: '✅',
      color: 'green',
      description: 'Roles activos'
    },
    {
      label: 'Inactivos',
      value: roles.filter(r => !r.estado).length,
      icon: '❌',
      color: 'red',
      description: 'Roles inactivos'
    }
  ];

  return (
    <>
      <AdminDataTable
        title="Gestión de Roles"
        description="Administra los roles y permisos del sistema"
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreate={handleCreate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        searchPlaceholder="Buscar roles..."
        stats={<AdminStats stats={stats} />}
      />

      <RoleFormModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedRole(null);
        }}
        onSave={handleSave}
        role={selectedRole}
        mode={modalMode}
      />
    </>
  );
};

export default RoleList;
