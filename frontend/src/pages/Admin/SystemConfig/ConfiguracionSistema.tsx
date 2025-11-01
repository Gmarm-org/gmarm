import React, { useState, useEffect } from 'react';
import { systemConfigApi, type SystemConfig } from '../../../services/adminApi';

const ConfiguracionSistema: React.FC = () => {
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [filteredConfigs, setFilteredConfigs] = useState<SystemConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    const filtered = configs.filter(config =>
      config.clave.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConfigs(filtered);
  }, [configs, searchTerm]);

  const loadConfigs = async () => {
    try {
      setIsLoading(true);
      const data = await systemConfigApi.getAll();
      setConfigs(data);
      setFilteredConfigs(data);
    } catch (error) {
      console.error('Error cargando configuración:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (config: SystemConfig) => {
    if (!config.editable) {
      alert('Esta configuración no es editable');
      return;
    }
    setEditingKey(config.clave);
    setEditValue(config.valor);
  };

  const handleSave = async (clave: string) => {
    try {
      await systemConfigApi.update(clave, { valor: editValue });
      setEditingKey(null);
      await loadConfigs();
    } catch (error) {
      console.error('Error guardando configuración:', error);
      alert('Error al guardar la configuración');
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setEditValue('');
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">⚙️ Configuración del Sistema</h2>
        <p className="text-sm text-gray-600 mt-1">Administra los parámetros de configuración del sistema</p>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar configuración..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              ⚙️
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{configs.length}</div>
              <div className="text-sm text-gray-600">Total configuraciones</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              ✏️
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{configs.filter(c => c.editable).length}</div>
              <div className="text-sm text-gray-600">Editables</div>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              🔒
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-800">{configs.filter(c => !c.editable).length}</div>
              <div className="text-sm text-gray-600">Solo lectura</div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Clave
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Editable
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredConfigs.map((config) => (
              <tr key={config.clave} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="font-mono text-sm text-gray-900">{config.clave}</span>
                </td>
                <td className="px-6 py-4">
                  {editingKey === config.clave ? (
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm text-gray-700 font-semibold">{config.valor}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-gray-600">{config.descripcion}</span>
                </td>
                <td className="px-6 py-4 text-center">
                  {config.editable ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      ✏️ Editable
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                      🔒 Solo lectura
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {editingKey === config.clave ? (
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleSave(config.clave)}
                        className="text-green-600 hover:text-green-900 font-medium"
                      >
                        ✓ Guardar
                      </button>
                      <button
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-900 font-medium"
                      >
                        ✗ Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEdit(config)}
                      disabled={!config.editable}
                      className={`font-medium ${
                        config.editable
                          ? 'text-blue-600 hover:text-blue-900 cursor-pointer'
                          : 'text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      ✏️ Editar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredConfigs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No se encontraron configuraciones</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfiguracionSistema;

