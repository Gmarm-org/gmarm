import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import ArmaStockCard from './ArmaStockCard';

interface InventarioArmasProps {
  onArmaSelect?: (arma: any) => void;
  selectedArmas?: number[];
}

const InventarioArmas: React.FC<InventarioArmasProps> = ({
  onArmaSelect,
  selectedArmas = []
}) => {
  const [armas, setArmas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<'todos' | 'conStock' | 'sinStock'>('todos');

  const cargarArmas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const armasConStock = await apiService.getArmasConStock();
      setArmas(armasConStock);
      
    } catch (error) {
      console.error('Error cargando armas:', error instanceof Error ? error.message : 'Unknown error');
      setError('Error cargando inventario de armas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarArmas();
  }, []);

  const armasFiltradas = armas.filter(arma => {
    const tieneStock = arma.stock?.cantidadDisponible > 0;
    
    switch (filtro) {
      case 'conStock':
        return tieneStock;
      case 'sinStock':
        return !tieneStock;
      default:
        return true;
    }
  });

  const totalArmas = armas.length;
  const armasConStock = armas.filter(a => a.stock?.cantidadDisponible > 0).length;
  const armasSinStock = totalArmas - armasConStock;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando inventario...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={cargarArmas}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Inventario de Armas</h2>
          <button 
            onClick={cargarArmas}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Actualizar
          </button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{totalArmas}</p>
            <p className="text-sm text-gray-600">Total Arm as</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{armasConStock}</p>
            <p className="text-sm text-gray-600">Con Stock</p>
          </div>
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{armasSinStock}</p>
            <p className="text-sm text-gray-600">Sin Stock</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFiltro('todos')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === 'todos' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas ({totalArmas})
        </button>
        <button
          onClick={() => setFiltro('conStock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === 'conStock' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Con Stock ({armasConStock})
        </button>
        <button
          onClick={() => setFiltro('sinStock')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            filtro === 'sinStock' 
              ? 'bg-red-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Sin Stock ({armasSinStock})
        </button>
      </div>

      {/* Grid de armas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {armasFiltradas.map((arma) => (
          <ArmaStockCard
            key={arma.id}
            arma={arma}
            stock={arma.stock}
            onSelect={onArmaSelect}
            disabled={selectedArmas.includes(arma.id)}
          />
        ))}
      </div>

      {armasFiltradas.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No se encontraron armas con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );
};

export default InventarioArmas;
