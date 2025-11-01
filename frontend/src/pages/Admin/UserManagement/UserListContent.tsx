import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { userApi, type User } from '../../../services/adminApi';
import UserEditModal from './UserEditModal';

const UserListContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await userApi.getAll();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@armasimportacion.com',
          nombres: 'Administrador',
          apellidos: 'Sistema',
          estado: 'ACTIVO',
          roles: ['ADMIN']
        },
        {
          id: 2,
          username: 'vendedor',
          email: 'vendedor@test.com',
          nombres: 'Juan',
          apellidos: 'Vendedor',
          estado: 'ACTIVO',
          roles: ['VENDEDOR']
        }
      ];
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    filterUsers();
  }, [searchTerm, users]);

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.apellidos.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleCreate = async () => {
    console.log('Crear nuevo usuario');
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    await loadUsers(); // Recargar usuarios después de guardar
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`¿Está seguro de eliminar al usuario ${user.username}?`)) {
      try {
        await userApi.delete(user.id);
        await loadUsers();
      } catch (error) {
        console.error('Error eliminando usuario:', error);
        alert('Error al eliminar el usuario');
      }
    }
  };

  const handleView = async (user: User) => {
    setSelectedUser(user);
    // TODO: Implementar modal de visualización
    alert(`Usuario: ${user.username}\nEmail: ${user.email}\nRoles: ${user.roles?.join(', ') || 'Sin roles'}`);
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
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Activo' : 'Inactivo'}
        </span>
      )
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value.map((role: any, index: number) => (
            <span
              key={index}
              className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
            >
              {role.nombre}
            </span>
          ))}
        </div>
      )
    }
  ];

  const stats: AdminStat[] = [
    {
      label: 'Total Usuarios',
      value: users.length,
      icon: '👥',
      color: 'blue',
      description: 'Usuarios del sistema'
    },
    {
      label: 'Usuarios Activos',
      value: users.filter(u => u.estado).length,
      icon: '✅',
      color: 'green',
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
    <>
      <AdminDataTable
        title="Gestión de Usuarios"
        description="Administra los usuarios del sistema"
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

      {/* Modal de Edición */}
      {selectedUser && editModalOpen && (
        <UserEditModal
          user={selectedUser}
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

export default UserListContent;

