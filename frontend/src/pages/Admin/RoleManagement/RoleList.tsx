import React, { useCallback } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { roleApi, type Role } from '../../../services/adminApi';
import RoleFormModal from './RoleFormModal';
import StatusBadge, { estadoVariant } from '../../../components/common/StatusBadge';
import { useModalState } from '../../../hooks/useModalState';
import { useCrudList } from '../../../hooks/useCrudList';

const filterRoles = (roles: Role[], term: string) =>
  roles.filter(role =>
    role.nombre.toLowerCase().includes(term.toLowerCase()) ||
    role.codigo.toLowerCase().includes(term.toLowerCase()) ||
    role.descripcion.toLowerCase().includes(term.toLowerCase())
  );

const RoleList: React.FC = () => {
  const fetchRoles = useCallback(() => roleApi.getAll(), []);
  const { items: roles, filteredItems: filteredRoles, searchTerm, setSearchTerm, isLoading, reload } = useCrudList<Role>({
    fetchFn: fetchRoles,
    filterFn: filterRoles,
  });
  const modal = useModalState<Role>();

  const handleDelete = async (role: Role) => {
    if (window.confirm(`¿Desactivar el rol "${role.nombre}"? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        await roleApi.update(role.id, { ...role, estado: false });
        await reload();
        alert('Rol desactivado exitosamente');
      } catch (error) {
        console.error('Error desactivando rol:', error);
        alert('Error al desactivar el rol');
      }
    }
  };

  const handleSave = async (roleData: Partial<Role>) => {
    try {
      if (modal.mode === 'create') {
        await roleApi.create(roleData);
      } else if (modal.mode === 'edit' && modal.selectedItem) {
        await roleApi.update(modal.selectedItem.id, roleData);
      }
      await reload();
      modal.close();
      alert(modal.mode === 'create' ? 'Rol creado exitosamente' : 'Rol actualizado exitosamente');
    } catch (error) {
      console.error('Error guardando rol:', error);
      alert('Error al guardar el rol. Verifique que el código sea único.');
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
      key: 'tipo_rol_vendedor',
      label: 'Tipo Vendedor',
      render: (value) => (
        <div className="text-sm text-gray-900">
          {value ? (
            <StatusBadge label={value === 'FIJO' ? 'Fijo' : 'Libre'} variant={value === 'FIJO' ? 'purple' : 'cyan'} />
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <StatusBadge label={value ? 'Activo' : 'Inactivo'} variant={estadoVariant(value)} />
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
        onCreate={() => modal.openCreate()}
        onEdit={(role: Role) => modal.openEdit(role)}
        onDelete={handleDelete}
        onView={(role: Role) => modal.openView(role)}
        searchPlaceholder="Buscar roles..."
        stats={<AdminStats stats={stats} />}
      />

      <RoleFormModal
        isOpen={modal.isOpen}
        onClose={modal.close}
        onSave={handleSave}
        role={modal.selectedItem}
        mode={modal.mode}
      />
    </>
  );
};

export default RoleList;
