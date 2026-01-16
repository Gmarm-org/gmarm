import React from 'react';
import type { Weapon } from '../../types';

interface ClientReservedWeaponSectionProps {
  mode: 'create' | 'edit' | 'view';
  currentSelectedWeapon: Weapon | null;
  precioModificado: number;
  cantidad: number;
  maxCantidad?: number;
  canEditWeapon?: boolean;
  onPriceChange?: (price: number) => void;
  onQuantityChange?: (quantity: number) => void;
  onNavigateToWeaponSelection?: () => void;
  ivaDecimal: number;
  ivaPorcentaje: number;
}

export const ClientReservedWeaponSection: React.FC<ClientReservedWeaponSectionProps> = ({
  mode,
  currentSelectedWeapon,
  precioModificado,
  cantidad,
  maxCantidad,
  canEditWeapon = true,
  onPriceChange,
  onQuantityChange,
  onNavigateToWeaponSelection,
  ivaDecimal,
  ivaPorcentaje
}) => {
  if (!currentSelectedWeapon || mode !== 'edit') {
    return null;
  }

  const handleQuantityChange = (rawValue: number) => {
    if (!canEditWeapon) {
      return;
    }
    const safeValue = Number.isFinite(rawValue) ? rawValue : 1;
    const limitedValue = maxCantidad ? Math.min(safeValue, maxCantidad) : safeValue;
    const clampedValue = Math.max(1, limitedValue);
    onQuantityChange?.(clampedValue);
  };

  const handlePriceChange = (rawValue: number) => {
    if (!canEditWeapon) {
      return;
    }
    onPriceChange?.(Number.isFinite(rawValue) ? rawValue : 0);
  };

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-yellow-100 p-3 rounded-full mr-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Arma Reservada</h2>
          <p className="text-sm text-gray-600">Esta arma está reservada pero aún no tiene número de serie asignado</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Detalles del Arma</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Modelo:</span>
              <span className="text-gray-900">{currentSelectedWeapon.modelo || 'Sin modelo'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Calibre:</span>
              <span className="text-gray-900">{currentSelectedWeapon.calibre}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-gray-700">Código:</span>
              <span className="text-gray-900">{currentSelectedWeapon.codigo}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Precios y Cantidad</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Precio Unitario:</label>
              <input
                type="number"
                value={precioModificado}
                onChange={(e) => handlePriceChange(parseFloat(e.target.value))}
                disabled={!canEditWeapon}
                step="0.01"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Cantidad:</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value, 10))}
                disabled={!canEditWeapon}
                min="1"
                max={maxCantidad}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-red-100 focus:border-red-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
              />
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">Subtotal:</span>
                  <span className="text-green-600 font-semibold">${(precioModificado * cantidad).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-700">IVA ({ivaPorcentaje}%):</span>
                  <span className="text-green-600 font-semibold">${(precioModificado * cantidad * ivaDecimal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold border-t pt-2">
                  <span>Total:</span>
                  <span className="text-green-600">${(precioModificado * cantidad * (1 + ivaDecimal)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {mode === 'edit' && canEditWeapon && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigateToWeaponSelection?.()}
            className="px-8 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold"
          >
            Cambiar Arma
          </button>
        </div>
      )}
    </div>
  );
};

