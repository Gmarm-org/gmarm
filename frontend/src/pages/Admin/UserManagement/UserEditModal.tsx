import React, { useState, useEffect } from 'react';
import { userApi, roleApi, type User } from '../../../services/adminApi';

interface UserEditModalProps {
  user?: User | null;
  mode: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, mode, isOpen, onClose, onSave }) => {
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form data for create mode
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    nombres: '',
    apellidos: '',
    telefono_principal: '',
    telefono_secundario: '',
    direccion: '',
    foto: '',
    estado: true
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === 'create') {
        // Reset form for create mode
        setFormData({
          username: '',
          email: '',
          password: '',
          nombres: '',
          apellidos: '',
          telefono_principal: '',
          telefono_secundario: '',
          direccion: '',
          foto: '',
          estado: true
        });
        setSelectedRoleIds(new Set());
      } else if (mode === 'edit' && user) {
        // Cargar datos del usuario en modo edit
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // No mostrar contraseña existente
          nombres: user.nombres || '',
          apellidos: user.apellidos || '',
          telefono_principal: user.telefono_principal || '',
          telefono_secundario: user.telefono_secundario || '',
          direccion: user.direccion || '',
          foto: user.foto || '',
          estado: user.estado !== undefined ? user.estado : true
        });
      }
      loadData();
    }
  }, [isOpen, user?.id, mode]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar todos los roles disponibles
      const roles = await roleApi.getAll();
      setAllRoles(roles);

      // Solo cargar roles actuales si estamos en modo edit
      if (mode === 'edit' && user) {
        const currentRoles = await userApi.getUserRoles(user.id);
        const roleIds = new Set(currentRoles.map((r: any) => r.id));
        setSelectedRoleIds(roleIds);
      }
      
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = (roleId: number) => {
    const newSelection = new Set(selectedRoleIds);
    if (newSelection.has(roleId)) {
      newSelection.delete(roleId);
    } else {
      newSelection.add(roleId);
    }
    setSelectedRoleIds(newSelection);
  };

  const handleSave = async () => {
    if (selectedRoleIds.size === 0) {
      alert('Debe seleccionar al menos un rol');
      return;
    }

    try {
      setIsSaving(true);
      
      if (mode === 'create') {
        // Validar campos requeridos
        if (!formData.username || !formData.email || !formData.password || !formData.nombres || !formData.apellidos) {
          alert('Todos los campos obligatorios deben estar completos');
          return;
        }

        // Paso 1: Crear usuario (el backend espera 'passwordHash' no 'password')
        const newUserData: any = {
          username: formData.username,
          email: formData.email,
          passwordHash: formData.password, // El backend espera 'passwordHash'
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefonoPrincipal: formData.telefono_principal || null,
          telefonoSecundario: formData.telefono_secundario || null,
          direccion: formData.direccion || null,
          foto: formData.foto || null,
          estado: formData.estado
        };
        
        const createdUser = await userApi.create(newUserData);
        
        // Paso 2: Asignar roles al usuario recién creado
        await userApi.assignRoles(createdUser.id, Array.from(selectedRoleIds));
      } else if (user) {
        // Modo Edit: Actualizar datos del usuario Y roles
        const updateData: any = {
          username: formData.username,
          email: formData.email,
          nombres: formData.nombres,
          apellidos: formData.apellidos,
          telefonoPrincipal: formData.telefono_principal || null,
          telefonoSecundario: formData.telefono_secundario || null,
          direccion: formData.direccion || null,
          foto: formData.foto || null,
          estado: formData.estado
        };
        
        // Si se proporcionó una nueva contraseña, incluirla
        if (formData.password && formData.password.trim() !== '') {
          updateData.passwordHash = formData.password;
        }
        
        // Paso 1: Actualizar datos del usuario
        await userApi.update(user.id, updateData);
        
        // Paso 2: Asignar roles
        await userApi.assignRoles(user.id, Array.from(selectedRoleIds));
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando usuario:', error);
      alert(mode === 'create' ? 'Error al crear el usuario. Verifique que el username y email sean únicos.' : 'Error al actualizar el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {mode === 'create' ? '➕ Crear Nuevo Usuario' : '✏️ Editar Usuario'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {mode === 'create' 
                ? 'Complete la información del nuevo usuario' 
                : `Gestionar roles de: ${user?.nombres} ${user?.apellidos}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            title="Cerrar"
          >
            ✖️
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              {/* Formulario para crear usuario */}
              {mode === 'create' && (
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="username"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="email@ejemplo.com"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                      <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Nombres"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Apellidos"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
                      <input
                        type="tel"
                        value={formData.telefono_principal}
                        onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0999999999"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Secundario</label>
                      <input
                        type="tel"
                        value={formData.telefono_secundario}
                        onChange={(e) => setFormData({ ...formData, telefono_secundario: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0999999999"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Quito, Ecuador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto (URL)</label>
                    <input
                      type="text"
                      value={formData.foto}
                      onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://ejemplo.com/foto.jpg (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Contraseña (mínimo 8 caracteres)"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7a10.025 10.025 0 01-.704-1.71L9.88 9.88z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="estado"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="estado" className="ml-2 block text-sm text-gray-900">
                      Usuario activo
                    </label>
                  </div>
                </div>
              )}

              {/* Formulario para editar usuario */}
              {mode === 'edit' && user && (
                <div className="mb-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>Editando usuario:</strong> {user.nombres} {user.apellidos} (ID: {user.id})
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                      <input
                        type="text"
                        value={formData.nombres}
                        onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                      <input
                        type="text"
                        value={formData.apellidos}
                        onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Principal</label>
                      <input
                        type="tel"
                        value={formData.telefono_principal}
                        onChange={(e) => setFormData({ ...formData, telefono_principal: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Secundario</label>
                      <input
                        type="tel"
                        value={formData.telefono_secundario}
                        onChange={(e) => setFormData({ ...formData, telefono_secundario: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input
                      type="text"
                      value={formData.direccion}
                      onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Foto (URL)</label>
                    <input
                      type="text"
                      value={formData.foto}
                      onChange={(e) => setFormData({ ...formData, foto: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="https://ejemplo.com/foto.jpg (opcional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña (opcional)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Dejar vacío para mantener la actual"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7a10.025 10.025 0 01-.704-1.71L9.88 9.88z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Solo complete si desea cambiar la contraseña</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="estado-edit"
                      checked={formData.estado}
                      onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="estado-edit" className="ml-2 block text-sm text-gray-900">
                      Usuario activo
                    </label>
                  </div>
                </div>
              )}

              {/* Selección de Roles */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Roles del Usuario *
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 rounded-lg p-4">
                  {allRoles.map((role) => (
                    <label
                      key={role.id}
                      className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoleIds.has(role.id)}
                        onChange={() => handleToggleRole(role.id)}
                        className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-gray-900">{role.nombre}</span>
                          <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                            {role.codigo}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{role.descripcion}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Roles seleccionados: {selectedRoleIds.size} / {allRoles.length}
                </p>
              </div>

              {selectedRoleIds.size === 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">
                    ⚠️ Debe seleccionar al menos un rol para el usuario
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || selectedRoleIds.size === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditModal;

