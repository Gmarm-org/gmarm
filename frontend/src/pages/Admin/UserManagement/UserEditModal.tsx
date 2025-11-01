import React, { useState, useEffect } from 'react';
import { userApi, roleApi, type User } from '../../../services/adminApi';

interface UserEditModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, isOpen, onClose, onSave }) => {
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, user.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Cargar todos los roles disponibles
      const roles = await roleApi.getAll();
      setAllRoles(roles);

      // Cargar roles actuales del usuario
      const currentRoles = await userApi.getUserRoles(user.id);
      setUserRoles(currentRoles);

      // Pre-seleccionar roles actuales
      const roleIds = new Set(currentRoles.map((r: any) => r.id));
      setSelectedRoleIds(roleIds);
      
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
      
      // Asignar los roles seleccionados
      await userApi.assignRoles(user.id, Array.from(selectedRoleIds));
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error guardando roles:', error);
      alert('Error al guardar los roles del usuario');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-800">✏️ Editar Usuario</h2>
          <p className="text-sm text-gray-600 mt-1">
            Gestionar roles de: {user.nombres} {user.apellidos}
          </p>
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
              {/* Información del Usuario */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Usuario</label>
                    <p className="text-sm font-semibold text-gray-900">{user.username}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      user.estado === 'ACTIVO' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.estado}
                    </span>
                  </div>
                </div>
              </div>

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

