import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDataTable from '../components/AdminDataTable';
import type { AdminTableColumn } from '../components/AdminDataTable';
import AdminStats from '../components/AdminStats';
import type { AdminStat } from '../components/AdminStats';
import { userApi, type User } from '../../../services/adminApi';
import Header from '../../../components/Header';

const UserList: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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
      // Fallback a datos mock si la API falla
      const mockUsers: User[] = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@armasimportacion.com',
          nombres: 'Administrador',
          apellidos: 'Sistema',
          estado: true,
          roles: ['ADMIN']
        },
        {
          id: 2,
          username: 'vendedor',
          email: 'vendedor@test.com',
          nombres: 'Juan',
          apellidos: 'Vendedor',
          estado: true,
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
    // TODO: Implementar modal de creación
    alert('Funcionalidad de creación en desarrollo');
  };

  const handleEdit = async (user: User) => {
    console.log('Editar usuario:', user);
    // TODO: Implementar modal de edición
    alert('Funcionalidad de edición en desarrollo');
  };

  const handleDelete = async (user: User) => {
    console.log('Eliminar usuario:', user);
    // TODO: Implementar confirmación de eliminación
    alert('Funcionalidad de eliminación en desarrollo');
  };

  const handleView = async (user: User) => {
    console.log('Ver usuario:', user);
    // TODO: Implementar modal de visualización
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
