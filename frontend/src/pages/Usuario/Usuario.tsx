import React, { useState, useEffect } from 'react';
import apiService from '../../services/api';

interface User {
  id: number;
  username: string;
  email: string;
  nombres: string;
  apellidos: string;
  foto?: string;
  telefonoPrincipal: string;
  telefonoSecundario?: string;
  direccion: string;
  estado: string;
  roles: string[];
  fechaCreacion: string;
  ultimoLogin?: string;
}

interface Role {
  id: number;
  nombre: string;
  descripcion: string;
  estado: boolean;
}

const Usuario: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view'>('create');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    nombres: '',
    apellidos: '',
    telefonoPrincipal: '',
    telefonoSecundario: '',
    direccion: '',
    password: '',
    roles: [] as number[]
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await apiService.getUsers();
      // Mapear los datos de la API al formato local
      const mappedUsers = (response.data || []).map((apiUser: any) => ({
        ...apiUser,
        fechaCreacion: apiUser.fechaCreacion || new Date().toISOString()
      }));
      setUsers(mappedUsers);
    } catch (error: any) {
      console.error('Error loading users:', error);
      setError('Error al cargar usuarios: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      // Por ahora usamos roles hardcodeados, luego se puede conectar a la API
      const mockRoles: Role[] = [
        { id: 1, nombre: 'VENDEDOR', descripcion: 'Registro de clientes y selección de armas', estado: true },
        { id: 2, nombre: 'JEFE_VENTAS', descripcion: 'Aprobación de solicitudes y creación de grupos', estado: true },
        { id: 3, nombre: 'FINANZAS', descripcion: 'Gestión de pagos y facturación', estado: true },
        { id: 4, nombre: 'OPERACIONES', descripcion: 'Gestión de importación y documentación', estado: true },
        { id: 5, nombre: 'ADMIN', descripcion: 'Acceso completo al sistema', estado: true }
      ];
      setRoles(mockRoles);
    } catch (error: any) {
      console.error('Error loading roles:', error);
    }
  };

  const handleCreateUser = () => {
    setFormMode('create');
    setSelectedUser(null);
    setUserForm({
      username: '',
      email: '',
      nombres: '',
      apellidos: '',
      telefonoPrincipal: '',
      telefonoSecundario: '',
      direccion: '',
      password: '',
      roles: []
    });
    setShowUserForm(true);
  };

  const handleEditUser = (user: User) => {
    setFormMode('edit');
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      telefonoPrincipal: user.telefonoPrincipal,
      telefonoSecundario: user.telefonoSecundario || '',
      direccion: user.direccion,
      password: '',
      roles: user.roles.map(role => parseInt(role))
    });
    setShowUserForm(true);
  };

  const handleViewUser = (user: User) => {
    setFormMode('view');
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      telefonoPrincipal: user.telefonoPrincipal,
      telefonoSecundario: user.telefonoSecundario || '',
      direccion: user.direccion,
      password: '',
      roles: user.roles.map(role => parseInt(role))
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await apiService.deleteUser(userId);
        setSuccess('Usuario eliminado correctamente');
        loadUsers();
      } catch (error: any) {
        setError('Error al eliminar usuario: ' + error.message);
      }
    }
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Convertir roles de números a strings para la API
      const userDataWithStringRoles = {
        ...userForm,
        roles: userForm.roles.map(roleId => roleId.toString())
      };

      if (formMode === 'create') {
        await apiService.createUser(userDataWithStringRoles);
        setSuccess('Usuario creado correctamente');
      } else if (formMode === 'edit' && selectedUser) {
        await apiService.updateUser(selectedUser.id, userDataWithStringRoles);
        setSuccess('Usuario actualizado correctamente');
      }
      setShowUserForm(false);
      loadUsers();
    } catch (error: any) {
      setError('Error al guardar usuario: ' + error.message);
    }
  };

  const handleInputChange = (field: string, value: string | boolean | number[]) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (roleId: number) => {
    setUserForm(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'BLOQUEADO':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return '✅';
      case 'INACTIVO':
        return '⏸️';
      case 'BLOQUEADO':
        return '🚫';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center space-x-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg font-semibold text-gray-700">Cargando usuarios...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 rounded-xl mr-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-gray-600">Administrar usuarios del sistema</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleCreateUser}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                + Nuevo Usuario
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-lg mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Lista de Usuarios</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Creación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {user.nombres.charAt(0)}{user.apellidos.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.nombres} {user.apellidos}
                          </div>
                          <div className="text-sm text-gray-500">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.telefonoPrincipal}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.estado)}`}>
                        <span className="mr-1">{getStatusIcon(user.estado)}</span>
                        {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(user.fechaCreacion).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewUser(user)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg transition-colors duration-200"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded-lg transition-colors duration-200"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-lg transition-colors duration-200"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay usuarios</h3>
              <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo usuario.</p>
            </div>
          )}
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {formMode === 'create' ? 'Crear Usuario' : formMode === 'edit' ? 'Editar Usuario' : 'Ver Usuario'}
                </h2>
                <button
                  onClick={() => setShowUserForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleUserFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Nombres *
                    </label>
                    <input
                      type="text"
                      value={userForm.nombres}
                      onChange={(e) => handleInputChange('nombres', e.target.value)}
                      required
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="Ingrese los nombres"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Apellidos *
                    </label>
                    <input
                      type="text"
                      value={userForm.apellidos}
                      onChange={(e) => handleInputChange('apellidos', e.target.value)}
                      required
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="Ingrese los apellidos"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={userForm.username}
                      onChange={(e) => handleInputChange('username', e.target.value)}
                      required
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="Ingrese el username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={userForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="ejemplo@correo.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono Principal *
                    </label>
                    <input
                      type="tel"
                      value={userForm.telefonoPrincipal}
                      onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
                      required
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="Ingrese el teléfono"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Teléfono Secundario
                    </label>
                    <input
                      type="tel"
                      value={userForm.telefonoSecundario}
                      onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
                      disabled={formMode === 'view'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                      placeholder="Teléfono secundario (opcional)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={userForm.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    required
                    disabled={formMode === 'view'}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
                    placeholder="Ingrese la dirección"
                  />
                </div>

                {formMode !== 'view' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña {formMode === 'create' ? '*' : '(dejar en blanco para mantener)'}
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required={formMode === 'create'}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                      placeholder="Ingrese la contraseña"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Roles
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {roles.map((role) => (
                      <label key={role.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userForm.roles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          disabled={formMode === 'view'}
                          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{role.nombre}</div>
                          <div className="text-sm text-gray-500">{role.descripcion}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {formMode !== 'view' && (
                  <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowUserForm(false)}
                      className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 font-semibold shadow-lg"
                    >
                      {formMode === 'create' ? 'Crear Usuario' : 'Actualizar Usuario'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuario; 