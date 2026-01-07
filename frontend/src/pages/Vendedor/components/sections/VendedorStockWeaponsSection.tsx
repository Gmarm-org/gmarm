import React from 'react';

interface VendedorStockWeaponsSectionProps {
  armasEnStock: Array<{
    id: number;
    armaId: number;
    armaNombre: string;
    armaCodigo: string;
    armaCalibre: string;
    armaCategoriaNombre?: string;
    armaImagen?: string;
    cantidad: number;
    precioUnitario: number;
    estado: string;
  }>;
  onAsignarArma: (armaEnStock: any) => void;
  mode: 'create' | 'edit' | 'view';
}

export const VendedorStockWeaponsSection: React.FC<VendedorStockWeaponsSectionProps> = ({
  armasEnStock,
  onAsignarArma,
  mode
}) => {
  // Solo mostrar en modo create
  if (mode !== 'create' || armasEnStock.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200 mb-6">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Armas en Stock</h2>
          <p className="text-sm text-gray-600">Tienes {armasEnStock.length} arma(s) disponible(s) para asignar a este cliente</p>
          <p className="text-xs text-amber-600 mt-1 font-medium">
            ⚠️ Recuerda: El cliente debe tener todos sus documentos obligatorios completos para recibir el arma
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {armasEnStock.map((armaEnStock) => (
          <div
            key={armaEnStock.id}
            className="bg-white rounded-xl p-4 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">{armaEnStock.armaNombre}</h3>
                <p className="text-sm text-gray-600">Código: {armaEnStock.armaCodigo}</p>
                <p className="text-sm text-gray-600">Calibre: {armaEnStock.armaCalibre}</p>
              </div>
              {armaEnStock.armaImagen && (
                <img
                  src={armaEnStock.armaImagen}
                  alt={armaEnStock.armaNombre}
                  className="w-16 h-16 object-cover rounded-lg ml-2"
                  onError={(e) => {
                    // Silenciosamente ocultar imagen si falla al cargar
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              )}
            </div>
            
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cantidad:</span>
                <span className="font-semibold text-gray-900">{armaEnStock.cantidad}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Precio Unitario:</span>
                <span className="font-semibold text-green-600">${parseFloat(armaEnStock.precioUnitario.toString()).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onAsignarArma(armaEnStock)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-sm"
            >
              Asignar a este Cliente
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

