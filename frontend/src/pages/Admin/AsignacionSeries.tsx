import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/api';

interface ReservaConSerie {
  id: number;
  cliente: {
    id: number;
    nombres: string;
    apellidos: string;
    numeroIdentificacion: string;
  };
  arma: {
    id: number;
    nombre: string;
    codigo: string;
  };
  cantidad: number;
  estado: 'RESERVADA' | 'ASIGNADA';
  numeroSerie?: string;
  fechaAsignacion: string;
}

const AsignacionSeries: React.FC = () => {
  const [reservas, setReservas] = useState<ReservaConSerie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSerie, setEditingSerie] = useState<number | null>(null);
  const [nuevoNumeroSerie, setNuevoNumeroSerie] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODAS' | 'RESERVADA' | 'ASIGNADA'>('TODAS');

  const cargarReservas = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todas las reservas (esto necesitarías implementar en el backend)
      // Por ahora simulo con datos de ejemplo
      const reservasData = await apiService.getReservasPendientes();
      setReservas(reservasData);
      
    } catch (error) {
      console.error('Error cargando reservas:', error);
      setError('Error cargando reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReservas();
  }, []);

  const handleAsignarSerie = async (reservaId: number) => {
    if (!nuevoNumeroSerie.trim()) {
      alert('Por favor ingrese un número de serie');
      return;
    }

    try {
      await apiService.asignarNumeroSerie(reservaId, nuevoNumeroSerie.trim());
      
      // Actualizar la lista local
      setReservas(prev => prev.map(reserva => 
        reserva.id === reservaId 
          ? { ...reserva, estado: 'ASIGNADA' as const, numeroSerie: nuevoNumeroSerie.trim() }
          : reserva
      ));
      
      setEditingSerie(null);
      setNuevoNumeroSerie('');
      
      alert('Número de serie asignado exitosamente');
    } catch (error) {
      console.error('Error asignando número de serie:', error);
      alert('Error asignando número de serie. Verifique que no esté duplicado.');
    }
  };

  const reservasFiltradas = reservas.filter(reserva => {
    if (filtroEstado === 'TODAS') return true;
    return reserva.estado === filtroEstado;
  });

  const estadisticas = {
    total: reservas.length,
    reservadas: reservas.filter(r => r.estado === 'RESERVADA').length,
    asignadas: reservas.filter(r => r.estado === 'ASIGNADA').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Cargando reservas...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={cargarReservas}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Asignación de Números de Serie</h1>
          <button 
            onClick={cargarReservas}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Actualizar
          </button>
        </div>
        
        {/* Estadísticas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">{estadisticas.total}</p>
            <p className="text-sm text-gray-600">Total Reservas</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-yellow-600">{estadisticas.reservadas}</p>
            <p className="text-sm text-gray-600">Pendientes</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-2xl font-bold text-green-600">{estadisticas.asignadas}</p>
            <p className="text-sm text-gray-600">Asignadas</p>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFiltroEstado('TODAS')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filtroEstado === 'TODAS' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Todas ({estadisticas.total})
        </button>
        <button
          onClick={() => setFiltroEstado('RESERVADA')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filtroEstado === 'RESERVADA' 
              ? 'bg-yellow-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Pendientes ({estadisticas.reservadas})
        </button>
        <button
          onClick={() => setFiltroEstado('ASIGNADA')}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            filtroEstado === 'ASIGNADA' 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Asignadas ({estadisticas.asignadas})
        </button>
      </div>

      {/* Lista de reservas */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cliente
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arma
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Número de Serie
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
              {reservasFiltradas.map((reserva) => (
                <tr key={reserva.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reserva.cliente.nombres} {reserva.cliente.apellidos}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reserva.cliente.numeroIdentificacion}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {reserva.arma.nombre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {reserva.arma.codigo}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {reserva.cantidad}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      reserva.estado === 'RESERVADA'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {reserva.estado === 'RESERVADA' ? 'Pendiente' : 'Asignada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingSerie === reserva.id ? (
                      <input
                        type="text"
                        value={nuevoNumeroSerie}
                        onChange={(e) => setNuevoNumeroSerie(e.target.value)}
                        placeholder="Ingrese número de serie"
                        className="w-full px-3 py-1 border border-gray-300 rounded-md text-sm"
                        autoFocus
                      />
                    ) : (
                      <span className="text-sm text-gray-900">
                        {reserva.numeroSerie || 'Sin asignar'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {reserva.fechaAsignacion ? new Date(reserva.fechaAsignacion).toLocaleDateString('es-ES') : 'Sin fecha'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {reserva.estado === 'RESERVADA' ? (
                      editingSerie === reserva.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleAsignarSerie(reserva.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Guardar
                          </button>
                          <button
                            onClick={() => {
                              setEditingSerie(null);
                              setNuevoNumeroSerie('');
                            }}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingSerie(reserva.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Asignar Serie
                        </button>
                      )
                    ) : (
                      <span className="text-green-600">Completado</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reservasFiltradas.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No hay reservas con los filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AsignacionSeries;
