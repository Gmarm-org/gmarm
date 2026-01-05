import React, { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

interface AgregarClientesModalProps {
  grupoId: number;
  onClose: () => void;
  onRefresh: () => void;
}

const AgregarClientesModal: React.FC<AgregarClientesModalProps> = ({ 
  grupoId, 
  onClose, 
  onRefresh 
}) => {
  const [clientesDisponibles, setClientesDisponibles] = useState<any[]>([]);
  const [clientesAsignados, setClientesAsignados] = useState<any[]>([]);
  const [clientesSeleccionados, setClientesSeleccionados] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [agregando, setAgregando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, [grupoId]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [clientesDisponiblesData, clientesGrupo] = await Promise.all([
        apiService.getClientesDisponibles(grupoId).catch(() => []), // Pasar grupoId para filtrar por tipo de grupo
        apiService.getClientesDelGrupo(grupoId).catch(() => []), // Si falla, usar array vacío
      ]);
      
      // Filtrar clientes que ya están en este grupo específico
      const idsAsignadosEsteGrupo = new Set(clientesGrupo.map((c: any) => c.clienteId));
      const disponibles = (clientesDisponiblesData || []).filter((c: any) => !idsAsignadosEsteGrupo.has(c.id));
      
      setClientesDisponibles(disponibles);
      setClientesAsignados(clientesGrupo || []);
    } catch (error) {
      console.error('Error cargando clientes:', error);
      // No mostrar alert si simplemente no hay clientes disponibles
      setClientesDisponibles([]);
      setClientesAsignados([]);
    } finally {
      setLoading(false);
    }
  };

  const clientesFiltrados = clientesDisponibles.filter((cliente) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      cliente.nombres?.toLowerCase().includes(searchLower) ||
      cliente.apellidos?.toLowerCase().includes(searchLower) ||
      cliente.numeroIdentificacion?.includes(searchTerm)
    );
  });

  const handleToggleCliente = (clienteId: number) => {
    // Verificar si el cliente tiene documentos completos
    const cliente = clientesDisponibles.find(c => c.id === clienteId);
    if (cliente && cliente.documentosCompletos === false) {
      alert('Este cliente no tiene todos sus documentos obligatorios completos. Debe cargar y aprobar todos los documentos requeridos antes de ser asignado.');
      return;
    }
    
    const nuevos = new Set(clientesSeleccionados);
    if (nuevos.has(clienteId)) {
      nuevos.delete(clienteId);
    } else {
      nuevos.add(clienteId);
    }
    setClientesSeleccionados(nuevos);
  };

  const handleAgregarClientes = async () => {
    if (clientesSeleccionados.size === 0) {
      alert('Por favor selecciona al menos un cliente');
      return;
    }

    setAgregando(true);
    try {
      const promesas = Array.from(clientesSeleccionados).map((clienteId) =>
        apiService.agregarClienteAGrupo(grupoId, clienteId)
      );
      await Promise.all(promesas);
      alert(`Se agregaron ${clientesSeleccionados.size} cliente(s) al grupo exitosamente`);
      setClientesSeleccionados(new Set());
      await cargarDatos();
      onRefresh();
    } catch (error: any) {
      console.error('Error agregando clientes:', error);
      alert(error.message || 'Error al agregar los clientes');
    } finally {
      setAgregando(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">
            ➕ Agregar Clientes al Grupo
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Búsqueda */}
          <div>
            <input
              type="text"
              placeholder="Buscar por nombre o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lista de Clientes Disponibles */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Clientes Disponibles ({clientesFiltrados.length})
            </h3>
            {clientesFiltrados.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay clientes disponibles</p>
            ) : (
              <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-12"></th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Cédula</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Nombres</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Apellidos</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado Documentos</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {clientesFiltrados.map((cliente) => {
                      const documentosCompletos = cliente.documentosCompletos !== false; // Default a true si no viene
                      const puedeAsignar = documentosCompletos;
                      
                      return (
                        <tr 
                          key={cliente.id} 
                          className={`hover:bg-gray-50 ${!puedeAsignar ? 'bg-red-50 opacity-75' : ''}`}
                        >
                          <td className="px-4 py-2">
                            <input
                              type="checkbox"
                              checked={clientesSeleccionados.has(cliente.id)}
                              onChange={() => handleToggleCliente(cliente.id)}
                              disabled={!puedeAsignar}
                              className={`w-4 h-4 text-blue-600 rounded focus:ring-blue-500 ${
                                !puedeAsignar ? 'cursor-not-allowed opacity-50' : ''
                              }`}
                            />
                          </td>
                          <td className="px-4 py-2 text-sm">{cliente.numeroIdentificacion}</td>
                          <td className="px-4 py-2 text-sm">{cliente.nombres}</td>
                          <td className="px-4 py-2 text-sm">{cliente.apellidos}</td>
                          <td className="px-4 py-2 text-sm">
                            {puedeAsignar ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                ✓ Documentos completos
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
                                ⚠ Faltan documentos
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clientes ya asignados */}
          {clientesAsignados.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                Clientes ya Asignados ({clientesAsignados.length})
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600">
                  {clientesAsignados.map((c: any) => (
                    <div key={c.id} className="py-1">
                      {c.clienteNombres} {c.clienteApellidos} ({c.clienteCedula})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {clientesSeleccionados.size > 0 && (
              <span>{clientesSeleccionados.size} cliente(s) seleccionado(s)</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={handleAgregarClientes}
              disabled={agregando || clientesSeleccionados.size === 0}
              className={`px-4 py-2 rounded-lg ${
                agregando || clientesSeleccionados.size === 0
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {agregando ? 'Agregando...' : `Agregar ${clientesSeleccionados.size > 0 ? `(${clientesSeleccionados.size})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgregarClientesModal;

