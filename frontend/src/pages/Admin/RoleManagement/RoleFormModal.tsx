import React, { useState, useEffect } from 'react';
import type { Role } from '../../../services/adminApi';

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (role: Partial<Role>) => Promise<void>;
  role?: Role | null;
  mode: 'create' | 'edit' | 'view';
}

const RoleFormModal: React.FC<RoleFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  role,
  mode
}) => {
  const [formData, setFormData] = useState<Partial<Role>>({
    nombre: '',
    codigo: '',
    descripcion: '',
    estado: true
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (role && (mode === 'edit' || mode === 'view')) {
      setFormData({
        nombre: role.nombre,
        codigo: role.codigo,
        descripcion: role.descripcion,
        estado: role.estado
      });
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        descripcion: '',
        estado: true
      });
    }
  }, [role, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'view') return;

    try {
      setIsSaving(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error guardando rol:', error);
      alert('Error al guardar el rol');
    } finally {
      setIsSaving(false);
    }
  };

  const isReadOnly = mode === 'view';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' && '➕ Crear Nuevo Rol'}
            {mode === 'edit' && '✏️ Editar Rol'}
            {mode === 'view' && '👁️ Ver Rol'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✖️
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Rol *
            </label>
            <input
              type="text"
              value={formData.nombre || ''}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
              disabled={isReadOnly}
            />
          </div>

          {/* Código */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código *
            </label>
            <input
              type="text"
              value={formData.codigo || ''}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono"
              required
              disabled={isReadOnly || mode === 'edit'}
              placeholder="EJEMPLO_ROL"
            />
            {mode === 'edit' && (
              <p className="text-xs text-gray-500 mt-1">El código no se puede modificar</p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isReadOnly}
            />
          </div>

          {/* Estado */}
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.estado || false}
              onChange={(e) => setFormData({ ...formData, estado: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isReadOnly}
            />
            <label className="ml-2 block text-sm text-gray-900">
              Rol activo
            </label>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              {mode === 'view' ? 'Cerrar' : 'Cancelar'}
            </button>
            {mode !== 'view' && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? 'Guardando...' : mode === 'create' ? 'Crear Rol' : 'Guardar Cambios'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleFormModal;

