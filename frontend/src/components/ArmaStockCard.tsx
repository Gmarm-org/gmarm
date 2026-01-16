import React from 'react';

interface ArmaStockCardProps {
  arma: {
    id: number;
    modelo: string;
    codigo: string;
    calibre: string;
    capacidad: number;
    precioReferencia: number;
    urlImagen?: string;
  };
  stock: {
    cantidadTotal: number;
    cantidadDisponible: number;
    precioVenta: number;
  };
  onSelect?: (arma: any) => void;
  disabled?: boolean;
}

const ArmaStockCard: React.FC<ArmaStockCardProps> = ({
  arma,
  stock,
  onSelect,
  disabled = false
}) => {
  const { cantidadTotal, cantidadDisponible, precioVenta } = stock;
  const sinStock = cantidadDisponible === 0;

  const handleSelect = () => {
    if (!disabled && !sinStock && onSelect) {
      onSelect(arma);
    }
  };

  return (
    <div 
      className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
        sinStock 
          ? 'border-gray-200 bg-gray-50 opacity-60' 
          : disabled 
            ? 'border-yellow-300 bg-yellow-50' 
            : 'border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer'
      }`}
      onClick={handleSelect}
    >
      {/* Imagen del arma */}
      <div className="aspect-square p-4">
        {arma.urlImagen ? (
          <img 
            src={arma.urlImagen} 
            alt={arma.modelo}
            className="w-full h-full object-contain rounded-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-xs">Sin imagen</span>
          </div>
        )}
      </div>

      {/* Información del arma */}
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">
          {arma.modelo}
        </h3>
        
        <div className="space-y-1 text-xs text-gray-600">
          <p><span className="font-medium">Código:</span> {arma.codigo}</p>
          <p><span className="font-medium">Calibre:</span> {arma.calibre}</p>
          <p><span className="font-medium">Capacidad:</span> {arma.capacidad}</p>
        </div>

        {/* Información de stock */}
        <div className="pt-2 border-t border-gray-100">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Stock:</span>
            <span className={`text-sm font-bold ${
              sinStock ? 'text-red-600' : 
              cantidadDisponible <= 5 ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {cantidadDisponible} / {cantidadTotal}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Precio:</span>
            <span className="text-sm font-bold text-blue-600">
              ${precioVenta.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Estados visuales */}
        {sinStock && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Sin Stock
          </div>
        )}
        
        {disabled && !sinStock && (
          <div className="absolute top-2 right-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
            Reservada
          </div>
        )}
      </div>
    </div>
  );
};

export default ArmaStockCard;
