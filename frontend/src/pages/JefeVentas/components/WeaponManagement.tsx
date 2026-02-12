import React, { useState, useEffect } from 'react';
import { formatNombreCompleto } from '../../../utils/formatUtils';

interface Weapon {
  id: string;
  modelo: string;
  calibre: string;
  capacidad: number;
  precio: number;
  disponible: boolean;
  vendedorId?: string;
  vendedor?: {
    nombres: string;
    apellidos: string;
  };
  createdAt: string;
  estado: 'RESERVADA' | 'IMPORTADA' | 'CANCELADA';
}

interface WeaponManagementProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const WeaponManagement: React.FC<WeaponManagementProps> = ({ onNavigate }) => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todas'); // todas, reservadas, importadas, canceladas
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - en producción esto vendría del backend
  const mockWeapons: Weapon[] = [
    {
      id: '1',
      modelo: 'Glock 17',
      calibre: '9mm',
      capacidad: 17,
      precio: 1200.00,
      disponible: false,
      vendedorId: '1',
      vendedor: { nombres: 'María', apellidos: 'López' },
      createdAt: '2024-01-15',
      estado: 'RESERVADA'
    },
    {
      id: '2',
      modelo: 'Beretta 92FS',
      calibre: '9mm',
      capacidad: 15,
      precio: 1500.00,
      disponible: false,
      vendedorId: '2',
      vendedor: { nombres: 'Carlos', apellidos: 'Mendoza' },
      createdAt: '2024-01-10',
      estado: 'IMPORTADA'
    },
    {
      id: '3',
      modelo: 'Sig Sauer P226',
      calibre: '9mm',
      capacidad: 15,
      precio: 1800.00,
      disponible: false,
      vendedorId: '3',
      vendedor: { nombres: 'Patricia', apellidos: 'García' },
      createdAt: '2024-01-08',
      estado: 'RESERVADA'
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setWeapons(mockWeapons);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredWeapons = weapons.filter(weapon => {
    const matchesFilter = filter === 'todas' || 
      (filter === 'reservadas' && weapon.estado === 'RESERVADA') ||
      (filter === 'importadas' && weapon.estado === 'IMPORTADA') ||
      (filter === 'canceladas' && weapon.estado === 'CANCELADA');
    
    const matchesSearch = weapon.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         weapon.calibre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (weapon.vendedor && formatNombreCompleto(weapon.vendedor.nombres, weapon.vendedor.apellidos).toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesFilter && matchesSearch;
  });

  const handleImport = (weaponId: string) => {
    setWeapons(prev => prev.map(weapon => 
      weapon.id === weaponId 
        ? { ...weapon, estado: 'IMPORTADA' as const }
        : weapon
    ));
  };

  const handleCancel = (weaponId: string) => {
    setWeapons(prev => prev.map(weapon => 
      weapon.id === weaponId 
        ? { ...weapon, estado: 'CANCELADA' as const }
        : weapon
    ));
  };

  const handleViewDetails = (weapon: Weapon) => {
    onNavigate('weapon-details', { weapon });
  };

  const getStatusBadge = (weapon: Weapon) => {
    switch (weapon.estado) {
      case 'RESERVADA':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Reservada</span>;
      case 'IMPORTADA':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Importada</span>;
      case 'CANCELADA':
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelada</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">Desconocido</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando armas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Armas</h2>
          <p className="text-gray-600">Administra las reservas de armas y su trazabilidad</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por modelo, calibre o vendedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="todas">Todas</option>
              <option value="reservadas">Reservadas</option>
              <option value="importadas">Importadas</option>
              <option value="canceladas">Canceladas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">🔫</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{weapons.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Reservadas</p>
              <p className="text-lg font-semibold text-gray-900">
                {weapons.filter(w => w.estado === 'RESERVADA').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Importadas</p>
              <p className="text-lg font-semibold text-gray-900">
                {weapons.filter(w => w.estado === 'IMPORTADA').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-xl">❌</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Canceladas</p>
              <p className="text-lg font-semibold text-gray-900">
                {weapons.filter(w => w.estado === 'CANCELADA').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de armas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Armas ({filteredWeapons.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendedor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWeapons.map((weapon) => (
                <tr key={weapon.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {weapon.modelo}
                      </div>
                      <div className="text-sm text-gray-500">{weapon.calibre}</div>
                      <div className="text-sm text-gray-500">Capacidad: {weapon.capacidad}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {weapon.vendedor ? formatNombreCompleto(weapon.vendedor.nombres, weapon.vendedor.apellidos) : 'Sin vendedor'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      ${weapon.precio.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(weapon)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(weapon.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(weapon)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs"
                      >
                        Ver
                      </button>
                      {weapon.estado === 'RESERVADA' && (
                        <>
                          <button
                            onClick={() => handleImport(weapon.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md text-xs"
                          >
                            Importar
                          </button>
                          <button
                            onClick={() => handleCancel(weapon.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs"
                          >
                            Cancelar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredWeapons.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron armas con los filtros aplicados</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeaponManagement;
