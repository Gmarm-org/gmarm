import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { userApi, type User } from '../../../services/adminApi';
import Header from '../../../components/Header';
import StatusBadge, { estadoVariant } from '../../../components/common/StatusBadge';
import { useCrudList } from '../../../hooks/useCrudList';

const filterUsers = (users: User[], term: string) => {
  // Filtrar solo usuarios activos + búsqueda
  let filtered = users.filter(user => user.estado);
  if (term) {
    filtered = filtered.filter(user =>
      user.username.toLowerCase().includes(term.toLowerCase()) ||
      user.email.toLowerCase().includes(term.toLowerCase()) ||
      user.nombres.toLowerCase().includes(term.toLowerCase()) ||
      user.apellidos.toLowerCase().includes(term.toLowerCase())
    );
  }
  return filtered;
};

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const fetchUsers = useCallback(() => userApi.getAll(), []);
  const { items: users, filteredItems: filteredUsers, searchTerm, setSearchTerm, isLoading } = useCrudList<User>({
    fetchFn: fetchUsers,
    filterFn: filterUsers,
  });

  const handleCreate = async () => {
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (_user: User) => {
    alert('Funcionalidad de edición en desarrollo');
  };

  const handleDelete = async (_user: User) => {
    alert('Funcionalidad de eliminación en desarrollo');
  };

  const handleView = async (_user: User) => {
    alert('Funcionalidad de visualización en desarrollo');
  };

  const columns: AdminTableColumn[] = [
    {
      key: 'username',
      label: 'Usuario',
      render: (value) => (
        <div className="text-sm font-medium text-gray-900">{value}</div>
      )
    },
    {
      key: 'email',
      label: 'Email',
      render: (value) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'nombres',
      label: 'Nombres',
      render: (value) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'apellidos',
      label: 'Apellidos',
      render: (value) => (
        <div className="text-sm text-gray-900">{value}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value) => (
        <StatusBadge label={value ? 'Activo' : 'Inactivo'} variant={estadoVariant(value)} />
      )
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.map((role: any, index: number) => (
            <StatusBadge key={index} label={role.nombre} variant="info" />
          ))}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Usuarios',
      value: filteredUsers.length,
      icon: '👥',
      color: 'blue',
      description: 'Usuarios activos'
    },
    {
      label: 'Administradores',
      value: users.filter(u => u.roles.some((r: any) => r.codigo === 'ADMIN')).length,
      icon: '🛡️',
      color: 'purple',
      description: 'Usuarios con rol admin'
    },
    {
      label: 'Vendedores',
      value: users.filter(u => u.roles.some((r: any) => r.codigo === 'VENDEDOR')).length,
      icon: '💰',
      color: 'orange',
      description: 'Usuarios vendedores'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Gestión de Usuarios"
        subtitle="Administra los usuarios del sistema"
        showBackButton={true}
        onBack={() => navigate('/admin')}
        backLabel="Volver al Dashboard"
      />

      <div className="p-6">
        <AdminDataTable
          title="Lista de Usuarios"
          description="Gestiona todos los usuarios del sistema"
          columns={columns}
          data={filteredUsers}
          isLoading={isLoading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onCreate={handleCreate}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onView={handleView}
          searchPlaceholder="Buscar usuarios..."
          stats={<AdminStats stats={stats} />}
        />
      </div>
    </div>
  );
};

export default UserList;
