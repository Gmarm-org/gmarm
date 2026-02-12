import React from 'react';
import type { Weapon } from '../../../../services/adminApi';
import { getWeaponImageUrlWithCacheBusting } from '../../../../utils/imageUtils';
import StatusBadge, { estadoVariant, categoriaArmaVariant } from '../../../../components/common/StatusBadge';

interface WeaponViewModalProps {
  weapon: Weapon;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (weapon: Weapon) => void;
}

const WeaponViewModal: React.FC<WeaponViewModalProps> = ({
  weapon,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen) return null;

  const handleEdit = () => {
    onClose();
    onEdit(weapon);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Detalles de la Arma</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda - Imagen */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de la Arma</label>
              <div className="flex justify-center">
                <img
                  src={getWeaponImageUrlWithCacheBusting(weapon.urlImagen)}
                  alt={weapon.modelo || 'Sin modelo'}
                  className="h-64 w-64 object-cover rounded-lg border border-gray-200 shadow-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = getWeaponImageUrlWithCacheBusting(null);
                  }}
                />
              </div>
            </div>
          </div>
          
          {/* Columna Derecha - Información */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">🔫 Información de la Arma</h4>
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Modelo:</label>
                  <p className="text-gray-900 text-lg font-medium">{weapon.modelo || 'Sin modelo'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Marca:</label>
                  <p className="text-gray-900">{weapon.marca || 'Sin marca'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Alimentadora:</label>
                  <p className="text-gray-900">{weapon.alimentadora || 'Sin alimentadora'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Color:</label>
                  <p className="text-gray-900">{weapon.color || 'Sin color'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Calibre:</label>
                  <p className="text-gray-900">{weapon.calibre || 'Sin calibre'}</p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Capacidad del Cargador:</label>
                  <p className="text-gray-900">{weapon.capacidad || 'Sin capacidad'}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">💰 Información Comercial</h4>
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Precio:</label>
                  <p className="text-gray-900 text-xl font-bold text-green-600">
                    ${typeof weapon.precioReferencia === 'number' ? weapon.precioReferencia.toFixed(2) : '0.00'}
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Estado:</label>
                  <StatusBadge label={weapon.estado ? '✅ Activo' : '❌ Inactivo'} variant={estadoVariant(weapon.estado)} />
                </div>
              </div>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">🏷️ Clasificación</h4>
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-gray-700 text-sm">Categoría:</label>
                  <StatusBadge label={weapon.categoriaNombre || 'Sin categoría'} variant={categoriaArmaVariant(weapon.categoriaNombre || '')} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-8 space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handleEdit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            ✏️ Editar Arma
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeaponViewModal;
