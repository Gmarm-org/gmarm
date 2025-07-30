import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { mockApiService } from '../../services/mockApiService';
import Header from '../../components/Header';
import type { User } from '../../types';

const Usuario: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState({
    nombres: '',
    apellidos: '',
    email: '',
    telefonoPrincipal: '',
    telefonoSecundario: '',
    direccion: '',
    password: '',
    roles: [] as string[]
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const usersData = await mockApiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedUser) {
        // Actualizar usuario existente
        const userDataWithStringRoles = {
          ...userForm,
          roles: userForm.roles.map(role => parseInt(role))
        };
        await mockApiService.updateUser(selectedUser.id, userDataWithStringRoles);
        setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, ...userForm } : u));
      } else {
        // Crear nuevo usuario
        const userDataWithStringRoles = {
          ...userForm,
          roles: userForm.roles.map(role => parseInt(role))
        };
        const newUser = await mockApiService.createUser(userDataWithStringRoles);
        setUsers(prev => [newUser, ...prev]);
      }
      
      setShowForm(false);
      setSelectedUser(null);
      setUserForm({
        nombres: '',
        apellidos: '',
        email: '',
        telefonoPrincipal: '',
        telefonoSecundario: '',
        direccion: '',
        password: '',
        roles: []
      });
    } catch (error) {
      console.error('Error al guardar usuario:', error);
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      nombres: user.nombres || '',
      apellidos: user.apellidos || '',
      email: user.email || '',
      telefonoPrincipal: user.telefonoPrincipal || '',
      telefonoSecundario: user.telefonoSecundario || '',
      direccion: user.direccion || '',
      password: '',
      roles: user.roles?.map(role => role.rol?.nombre) || []
    });
    setShowForm(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      try {
        await mockApiService.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVO':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'ACTIVO':
        return '✅';
      case 'INACTIVO':
        return '❌';
      case 'PENDIENTE':
        return '⏳';
      default:
        return '❓';
    }
  };

  if (isLoading) {
    return (
      <Header title="Usuarios" subtitle="Administración de usuarios del sistema">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando usuarios...</p>
          </div>
        </div>
      </Header>
    );
  }

  return (
    <Header title="Usuarios" subtitle="Administración de usuarios del sistema">
      <div className="p-6">
        {/* Botón para crear nuevo usuario */}
        <div className="mb-6">
          <button
            onClick={() => {
              setShowForm(!showForm);
              setSelectedUser(null);
              setUserForm({
                nombres: '',
                apellidos: '',
                email: '',
                telefonoPrincipal: '',
                telefonoSecundario: '',
                direccion: '',
                password: '',
                roles: []
              });
            }}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg"
          >
            {showForm ? 'Cancelar' : 'Nuevo Usuario'}
          </button>
        </div>

        {/* Formulario de usuario */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {selectedUser ? 'Editar Usuario' : 'Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    type="text"
                    value={userForm.nombres}
                    onChange={(e) => setUserForm(prev => ({ ...prev, nombres: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
                    onChange={(e) => setUserForm(prev => ({ ...prev, apellidos: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ingrese los apellidos"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
                    onChange={(e) => setUserForm(prev => ({ ...prev, telefonoPrincipal: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
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
                    onChange={(e) => setUserForm(prev => ({ ...prev, telefonoSecundario: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder="Teléfono secundario (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dirección *
                  </label>
                  <input
                    type="text"
                    value={userForm.direccion}
                    onChange={(e) => setUserForm(prev => ({ ...prev, direccion: e.target.value }))}
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                    placeholder="Ingrese la dirección"
                  />
                </div>

                {!selectedUser && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                      required={!selectedUser}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                      placeholder="Ingrese la contraseña"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Roles
                  </label>
                  <select
                    multiple
                    value={userForm.roles}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setUserForm(prev => ({ ...prev, roles: selectedOptions }));
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="1">ADMIN</option>
                    <option value="2">VENDEDOR</option>
                    <option value="3">FINANZAS</option>
                    <option value="4">JEFE_VENTAS</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Mantenga presionado Ctrl (Cmd en Mac) para seleccionar múltiples roles</p>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedUser(null);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-semibold shadow-lg"
                >
                  {selectedUser ? 'Actualizar Usuario' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabla de usuarios */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lista de Usuarios</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nombres} {user.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">{user.direccion}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.telefonoPrincipal}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.roles?.map(role => role.rol?.nombre).join(', ') || 'Sin roles'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(user.estado)}`}>
                        {getStatusIcon(user.estado)} {user.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-blue-600 hover:text-blue-900 font-medium"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
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
        </div>
      </div>
    </Header>
  );
};

export default Usuario; 