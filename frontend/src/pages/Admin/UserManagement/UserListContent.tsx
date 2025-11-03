import React, { useState, useEffect } from 'react';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { userApi, type User } from '../../../services/adminApi';
import UserEditModal from './UserEditModal';
import UserViewModal from './UserViewModal';
import { formatDateTime } from '../../../utils/dateUtils';

const UserListContent: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');

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
      setUsers([]);
      setFilteredUsers([]);
      alert('Error al cargar usuarios. Por favor, recarga la página.');
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

  const handleCreate = () => {
    setSelectedUser(null);
    setModalMode('create');
    setEditModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setModalMode('edit');
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    await loadUsers();
    setEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async (user: User) => {
    if (confirm(`¿Desactivar al usuario ${user.username}? No se eliminará de la base de datos, solo cambiará su estado a inactivo para mantener auditoría.`)) {
      try {
        // No eliminar, solo cambiar estado a false (inactivo)
        await userApi.update(user.id, { ...user, estado: false });
        await loadUsers();
      } catch (error) {
        console.error('Error desactivando usuario:', error);
        alert('Error al desactivar el usuario');
      }
    }
  };

  const handleUnlock = async (user: User) => {
    if (confirm(`¿Desbloquear al usuario ${user.username}?`)) {
      try {
        await userApi.unlock(user.id);
        await loadUsers();
        alert('Usuario desbloqueado exitosamente');
      } catch (error) {
        console.error('Error desbloqueando usuario:', error);
        alert('Error al desbloquear el usuario');
      }
    }
  };

  const handleView = async (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
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
      key: 'telefono_principal',
      label: 'Teléfono',
      render: (value) => (
        <div className="text-sm text-gray-900">{value || 'N/A'}</div>
      )
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (value, row: any) => (
        <div className="flex flex-col gap-1">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? 'Activo' : 'Inactivo'}
          </span>
          {row.bloqueado && (
            <>
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                🔒 Bloqueado
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnlock(row);
                }}
                className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-200 rounded-md"
              >
                🔓 Desbloquear
              </button>
            </>
          )}
        </div>
      )
    },
    {
      key: 'ultimo_login',
      label: 'Último Login',
      render: (value) => (
        <div className="text-xs text-gray-600">
          {formatDateTime(value, 'Nunca')}
        </div>
      )
    },
    {
      key: 'roles',
      label: 'Roles',
      render: (value) => (
        <div className="flex flex-wrap gap-1">
          {value?.map((role: any, index: number) => (
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
      value: users.length || 0,
      icon: '👥',
      color: 'blue',
      description: 'Usuarios del sistema'
    },
    {
      label: 'Usuarios Activos',
      value: users.filter(u => u?.estado).length || 0,
      icon: '✅',
      color: 'green',
      description: 'Usuarios activos'
    },
    {
      label: 'Bloqueados',
      value: users.filter(u => u?.bloqueado).length || 0,
      icon: '🔒',
      color: 'red',
      description: 'Usuarios bloqueados'
    },
    {
      label: 'Administradores',
      value: users.filter(u => u?.roles?.some((r: any) => r?.codigo === 'ADMIN')).length || 0,
      icon: '🛡️',
      color: 'purple',
      description: 'Usuarios con rol admin'
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

      {/* Modal de Vista */}
      <UserViewModal
        user={selectedUser}
        isOpen={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedUser(null);
        }}
        onEdit={handleEdit}
      />

      {/* Modal de Edición/Creación */}
      {editModalOpen && (
        <UserEditModal
          user={selectedUser}
          mode={modalMode}
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

