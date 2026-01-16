import React, { useState } from 'react';
import type { Weapon } from '../../../../services/adminApi';

interface WeaponDeleteModalProps {
  weapon: Weapon;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

const WeaponDeleteModal: React.FC<WeaponDeleteModalProps> = ({
  weapon,
  isOpen,
  onClose,
  onConfirm
}) => {
  const [isDeactivating, setIsDeactivating] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsDeactivating(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error desactivando arma:', error);
      alert('Error al desactivar la arma');
    } finally {
      setIsDeactivating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Confirmar Desactivación</h2>
          <p className="text-gray-600 mb-6">
            ¿Estás seguro de que quieres <strong>desactivar</strong> la arma <strong>"{weapon.modelo || 'Sin modelo'}"</strong>?
            <br /><br />
            <span className="text-sm text-blue-600">
              💡 <strong>Nota:</strong> La arma no se eliminará del sistema, solo cambiará su estado a "Inactiva" y no será visible para los usuarios.
            </span>
          </p>

          <div className="flex justify-center space-x-3">
            <button
              onClick={onClose}
              disabled={isDeactivating}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeactivating}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {isDeactivating ? 'Desactivando...' : 'Desactivar Arma'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeaponDeleteModal;
