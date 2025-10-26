import React, { useState, useEffect } from 'react';

interface Client {
  id: number;
  nombres: string;
  apellidos: string;
  cedula: string;
  email: string;
  telefono: string;
  estado: string;
  procesoCompletado: boolean;
  aprobadoPorJefeVentas: boolean | null;
  motivoRechazo?: string;
  fechaCreacion: string;
  vendedor: {
    nombres: string;
    apellidos: string;
  };
}

interface ClientManagementProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ onNavigate }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('todos'); // todos, aprobados, pendientes, rechazados
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - en producción esto vendría del backend
  const mockClients: Client[] = [
    {
      id: 1,
      nombres: 'Juan Carlos',
      apellidos: 'González Pérez',
      cedula: '1234567890',
      email: 'juan.gonzalez@email.com',
      telefono: '0987654321',
      estado: 'ACTIVO',
      procesoCompletado: true,
      aprobadoPorJefeVentas: null,
      fechaCreacion: '2024-01-15',
      vendedor: { nombres: 'María', apellidos: 'López' }
    },
    {
      id: 2,
      nombres: 'Ana Sofía',
      apellidos: 'Rodríguez Vega',
      cedula: '0987654321',
      email: 'ana.rodriguez@email.com',
      telefono: '1234567890',
      estado: 'ACTIVO',
      procesoCompletado: true,
      aprobadoPorJefeVentas: true,
      fechaCreacion: '2024-01-10',
      vendedor: { nombres: 'Carlos', apellidos: 'Mendoza' }
    },
    {
      id: 3,
      nombres: 'Luis Fernando',
      apellidos: 'Herrera Silva',
      cedula: '1122334455',
      email: 'luis.herrera@email.com',
      telefono: '5566778899',
      estado: 'ACTIVO',
      procesoCompletado: true,
      aprobadoPorJefeVentas: false,
      motivoRechazo: 'Documentación incompleta',
      fechaCreacion: '2024-01-08',
      vendedor: { nombres: 'Patricia', apellidos: 'García' }
    }
  ];

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setClients(mockClients);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredClients = clients.filter(client => {
    const matchesFilter = filter === 'todos' || 
      (filter === 'aprobados' && client.aprobadoPorJefeVentas === true) ||
      (filter === 'pendientes' && client.aprobadoPorJefeVentas === null) ||
      (filter === 'rechazados' && client.aprobadoPorJefeVentas === false);
    
    const matchesSearch = client.nombres.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.apellidos.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.cedula.includes(searchTerm);
    
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (clientId: number) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, aprobadoPorJefeVentas: true, motivoRechazo: undefined }
        : client
    ));
  };

  const handleReject = (clientId: number, motivo: string) => {
    setClients(prev => prev.map(client => 
      client.id === clientId 
        ? { ...client, aprobadoPorJefeVentas: false, motivoRechazo: motivo }
        : client
    ));
  };

  const handleViewDetails = (client: Client) => {
    onNavigate('clientDetails', client);
  };

  const getStatusBadge = (client: Client) => {
    if (client.aprobadoPorJefeVentas === true) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Aprobado</span>;
    } else if (client.aprobadoPorJefeVentas === false) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Rechazado</span>;
    } else {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Pendiente</span>;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Buscar cliente</label>
              <input
                type="text"
                placeholder="Nombre, apellido o cédula..."
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
                <option value="todos">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="aprobados">Aprobados</option>
                <option value="rechazados">Rechazados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">📊</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-lg font-semibold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <span className="text-yellow-600 text-xl">⏳</span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-lg font-semibold text-gray-900">
                  {clients.filter(c => c.aprobadoPorJefeVentas === null).length}
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
                <p className="text-sm font-medium text-gray-600">Aprobados</p>
                <p className="text-lg font-semibold text-gray-900">
                  {clients.filter(c => c.aprobadoPorJefeVentas === true).length}
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
                <p className="text-sm font-medium text-gray-600">Rechazados</p>
                <p className="text-lg font-semibold text-gray-900">
                  {clients.filter(c => c.aprobadoPorJefeVentas === false).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de clientes */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Clientes ({filteredClients.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
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
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.nombres} {client.apellidos}
                        </div>
                        <div className="text-sm text-gray-500">{client.cedula}</div>
                        <div className="text-sm text-gray-500">{client.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.vendedor.nombres} {client.vendedor.apellidos}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(client)}
                      {client.motivoRechazo && (
                        <div className="text-xs text-red-600 mt-1">
                          {client.motivoRechazo}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.fechaCreacion).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewDetails(client)}
                          className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs"
                        >
                          Ver
                        </button>
                        {client.aprobadoPorJefeVentas === null && (
                          <>
                            <button
                              onClick={() => handleApprove(client.id)}
                              className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md text-xs"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => {
                                const motivo = prompt('Motivo del rechazo:');
                                if (motivo) handleReject(client.id, motivo);
                              }}
                              className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs"
                            >
                              Rechazar
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
          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron clientes con los filtros aplicados</p>
            </div>
          )}
        </div>
      </div>
  );
};

export default ClientManagement; 