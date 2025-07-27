import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import apiService from '../../services/api';
import FileUpload from '../../components/FileUpload';
import './Usuario.css';

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
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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

  const [roleForm, setRoleForm] = useState({
    nombre: '',
    descripcion: '',
    estado: true
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
      setUsers(response.data || []);
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
    setSelectedUser(null);
    setFormMode('create');
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
    setSelectedUser(user);
    setFormMode('edit');
    setUserForm({
      username: user.username,
      email: user.email,
      nombres: user.nombres,
      apellidos: user.apellidos,
      telefonoPrincipal: user.telefonoPrincipal,
      telefonoSecundario: user.telefonoSecundario || '',
      direccion: user.direccion,
      password: '',
      roles: user.roles.map(roleName => {
        const role = roles.find(r => r.nombre === roleName);
        return role?.id || 0;
      }).filter(id => id > 0)
    });
    setShowUserForm(true);
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setFormMode('view');
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
      return;
    }

    try {
      await apiService.deleteUser(userId);
      setSuccess('Usuario eliminado exitosamente');
      await loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setError('Error al eliminar usuario: ' + error.message);
    }
  };

  const handleUserFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (formMode === 'create') {
        await apiService.createUser(userForm);
        setSuccess('Usuario creado exitosamente');
      } else if (formMode === 'edit' && selectedUser) {
        await apiService.updateUser(selectedUser.id, userForm);
        setSuccess('Usuario actualizado exitosamente');
      }
      
      setShowUserForm(false);
      await loadUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setError('Error al guardar usuario: ' + error.message);
    }
  };

  const handleCreateRole = () => {
    setSelectedRole(null);
    setRoleForm({
      nombre: '',
      descripcion: '',
      estado: true
    });
    setShowRoleForm(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setRoleForm({
      nombre: role.nombre,
      descripcion: role.descripcion,
      estado: role.estado
    });
    setShowRoleForm(true);
  };

  const handleRoleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí se implementaría la lógica para guardar roles
    setShowRoleForm(false);
  };

  const handleInputChange = (field: string, value: string | boolean | number[]) => {
    if (showUserForm) {
      setUserForm(prev => ({ ...prev, [field]: value }));
    } else if (showRoleForm) {
      setRoleForm(prev => ({ ...prev, [field]: value }));
    }
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
        return 'success';
      case 'INACTIVO':
        return 'warning';
      case 'BLOQUEADO':
        return 'danger';
      default:
        return 'info';
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="usuario-container">
      {/* Header */}
      <div className="usuario-header">
        <h1>Gestión de Usuarios</h1>
        <div className="header-actions">
          <button onClick={handleCreateRole} className="btn btn-secondary">
            ➕ Crear Rol
          </button>
          <button onClick={handleCreateUser} className="btn btn-primary">
            ➕ Crear Usuario
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* Users Table */}
      <div className="users-section">
        <h2>Lista de Usuarios</h2>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Último Login</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      {user.foto && (
                        <img src={user.foto} alt="Foto" className="user-avatar" />
                      )}
                      <div>
                        <strong>{user.nombres} {user.apellidos}</strong>
                        <br />
                        <small>@{user.username}</small>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <div className="roles-container">
                      {user.roles.map((role, index) => (
                        <span key={index} className="badge badge-info">
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>{user.telefonoPrincipal}</td>
                  <td>
                    <span className={`badge badge-${getStatusColor(user.estado)}`}>
                      {user.estado}
                    </span>
                  </td>
                  <td>
                    {user.ultimoLogin 
                      ? new Date(user.ultimoLogin).toLocaleDateString()
                      : 'Nunca'
                    }
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleViewUser(user)}
                        className="btn btn-secondary"
                        title="Ver Detalle"
                      >
                        👁️
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="btn btn-primary"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="btn btn-danger"
                          title="Eliminar"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Form Modal */}
      {showUserForm && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>
                {formMode === 'create' && 'Crear Nuevo Usuario'}
                {formMode === 'edit' && 'Editar Usuario'}
                {formMode === 'view' && 'Ver Usuario'}
              </h2>
              <button onClick={() => setShowUserForm(false)} className="close-button">✕</button>
            </div>

            <form onSubmit={handleUserFormSubmit} className="user-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese username"
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese email"
                  />
                </div>

                <div className="form-group">
                  <label>Nombres *</label>
                  <input
                    type="text"
                    value={userForm.nombres}
                    onChange={(e) => handleInputChange('nombres', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese nombres"
                  />
                </div>

                <div className="form-group">
                  <label>Apellidos *</label>
                  <input
                    type="text"
                    value={userForm.apellidos}
                    onChange={(e) => handleInputChange('apellidos', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese apellidos"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono Principal *</label>
                  <input
                    type="tel"
                    value={userForm.telefonoPrincipal}
                    onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese teléfono"
                  />
                </div>

                <div className="form-group">
                  <label>Teléfono Secundario</label>
                  <input
                    type="tel"
                    value={userForm.telefonoSecundario}
                    onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
                    disabled={formMode === 'view'}
                    placeholder="Teléfono secundario (opcional)"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Dirección *</label>
                  <input
                    type="text"
                    value={userForm.direccion}
                    onChange={(e) => handleInputChange('direccion', e.target.value)}
                    disabled={formMode === 'view'}
                    required
                    placeholder="Ingrese dirección"
                  />
                </div>

                {formMode === 'create' && (
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input
                      type="password"
                      value={userForm.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      required
                      placeholder="Ingrese contraseña"
                    />
                  </div>
                )}

                <div className="form-group full-width">
                  <label>Foto de Perfil</label>
                  <FileUpload
                    onFileSelect={(file) => console.log('File selected:', file)}
                    accept="image/*"
                    disabled={formMode === 'view'}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Roles *</label>
                  <div className="roles-checkboxes">
                    {roles.map((role) => (
                      <label key={role.id} className="role-checkbox">
                        <input
                          type="checkbox"
                          checked={userForm.roles.includes(role.id)}
                          onChange={() => handleRoleToggle(role.id)}
                          disabled={formMode === 'view'}
                        />
                        <span className="role-name">{role.nombre}</span>
                        <span className="role-description">{role.descripcion}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowUserForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                
                {formMode !== 'view' && (
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {formMode === 'create' ? 'Crear Usuario' : 'Guardar Cambios'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Form Modal */}
      {showRoleForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                {selectedRole ? 'Editar Rol' : 'Crear Nuevo Rol'}
              </h2>
              <button onClick={() => setShowRoleForm(false)} className="close-button">✕</button>
            </div>

            <form onSubmit={handleRoleFormSubmit} className="role-form">
              <div className="form-group">
                <label>Nombre del Rol *</label>
                <input
                  type="text"
                  value={roleForm.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  required
                  placeholder="Ingrese nombre del rol"
                />
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={roleForm.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Ingrese descripción del rol"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={roleForm.estado}
                    onChange={(e) => handleInputChange('estado', e.target.checked)}
                  />
                  <span>Rol Activo</span>
                </label>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setShowRoleForm(false)}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {selectedRole ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Usuario; 