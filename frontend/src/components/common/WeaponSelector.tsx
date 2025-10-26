import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface Arma {
  id: number;
  codigo: string;
  nombre: string;
  calibre: string;
  capacidad: number;
  precio_referencia: number;
  categoria_id: number;
  url_imagen: string;
  url_producto: string;
  estado: boolean;
}

interface WeaponSelectorProps {
  onWeaponSelect: (weapon: Arma) => void;
  selectedWeapon?: Arma | null;
  onClear?: () => void;
  disabled?: boolean;
  className?: string;
  showPrice?: boolean;
}

const WeaponSelector: React.FC<WeaponSelectorProps> = ({
  onWeaponSelect,
  selectedWeapon,
  onClear,
  disabled = false,
  className = '',
  showPrice = true
}) => {
  const [weapons, setWeapons] = useState<Arma[]>([]);
  const [filteredWeapons, setFilteredWeapons] = useState<Arma[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{id: number, nombre: string}[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadWeapons();
    loadCategories();
  }, []);

  const loadWeapons = async () => {
    try {
      setLoading(true);
      const weaponsData = await apiService.getArmas();
      setWeapons(weaponsData);
      setFilteredWeapons(weaponsData);
    } catch (error) {
      console.error('Error cargando armas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await apiService.getCategoriasArma();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  };

  useEffect(() => {
    let filtered = weapons;

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(weapon =>
        weapon.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        weapon.calibre.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(weapon => 
        weapon.categoria_id === parseInt(selectedCategory)
      );
    }

    setFilteredWeapons(filtered);
  }, [searchTerm, selectedCategory, weapons]);

  const handleWeaponSelect = (weapon: Arma) => {
    onWeaponSelect(weapon);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Seleccionar Arma
      </label>
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className="w-full px-3 py-2 text-left bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {selectedWeapon ? (
            <div className="flex items-center space-x-3">
              {selectedWeapon.url_imagen && (
                <img 
                  src={selectedWeapon.url_imagen} 
                  alt={selectedWeapon.nombre}
                  className="w-8 h-8 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedWeapon.nombre}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {selectedWeapon.codigo} - {selectedWeapon.calibre}
                </p>
              </div>
              {showPrice && (
                <span className="text-sm font-medium text-green-600">
                  {formatPrice(selectedWeapon.precio_referencia)}
                </span>
              )}
            </div>
          ) : (
            <span className="text-gray-500">Seleccionar arma...</span>
          )}
        </button>

        {onClear && selectedWeapon && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}

        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-auto">
            {/* Filtros */}
            <div className="p-3 border-b border-gray-200">
              <input
                type="text"
                placeholder="Buscar armas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Lista de armas */}
            <div className="max-h-64 overflow-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Cargando armas...
                </div>
              ) : filteredWeapons.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No se encontraron armas
                </div>
              ) : (
                filteredWeapons.map(weapon => (
                  <button
                    key={weapon.id}
                    type="button"
                    onClick={() => handleWeaponSelect(weapon)}
                    className="w-full p-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-3">
                      {weapon.url_imagen && (
                        <img 
                          src={weapon.url_imagen} 
                          alt={weapon.nombre}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {weapon.nombre}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {weapon.codigo} - {weapon.calibre} - Capacidad: {weapon.capacidad}
                        </p>
                      </div>
                      {showPrice && (
                        <span className="text-sm font-medium text-green-600">
                          {formatPrice(weapon.precio_referencia)}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeaponSelector;
