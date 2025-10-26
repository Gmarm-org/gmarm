import React, { useState, useEffect } from 'react';
import armaSerieService from '../../services/armaSerieService';
import type { ArmaSerie, EstadisticaSeries, ResultadoCarga } from '../../services/armaSerieService';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

interface Arma {
  id: number;
  codigo: string;
  nombre: string;
  calibre: string;
  categoria: string;
}

interface ClienteArmaReserva {
  id: number;
  clienteId: number;
  clienteNombre: string;
  clienteApellidos: string;
  clienteIdentificacion: string;
  armaId: number;
  armaNombre: string;
  armaCodigo: string;
  estado: string;
  numeroSerie?: string;
  fechaReserva: string;
}

const GestionSeries: React.FC = () => {
  const { user } = useAuth();
  
  // Estados principales
  const [vistaActual, setVistaActual] = useState<'cargar' | 'asignar' | 'estadisticas'>('cargar');
  const [armas, setArmas] = useState<Arma[]>([]);
  const [estadisticas, setEstadisticas] = useState<EstadisticaSeries[]>([]);
  
  // Estados para carga de series
  const [armaSeleccionadaCarga, setArmaSeleccionadaCarga] = useState<number | null>(null);
  const [lote, setLote] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [resultadoCarga, setResultadoCarga] = useState<ResultadoCarga | null>(null);
  
  // Estados para asignación de series
  const [reservasPendientes, setReservasPendientes] = useState<ClienteArmaReserva[]>([]);
  const [reservaSeleccionada, setReservaSeleccionada] = useState<ClienteArmaReserva | null>(null);
  const [seriesDisponibles, setSeriesDisponibles] = useState<ArmaSerie[]>([]);
  const [serieSeleccionada, setSerieSeleccionada] = useState<string>('');
  const [asignando, setAsignando] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarArmas();
    cargarEstadisticas();
    cargarReservasPendientes();
  }, []);

  const cargarArmas = async () => {
    try {
      const response = await apiService.getArmas();
      setArmas(response);
    } catch (error) {
      console.error('Error cargando armas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const stats = await armaSerieService.getEstadisticas();
      setEstadisticas(stats);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const cargarReservasPendientes = async () => {
    try {
      // Endpoint que debe existir en el backend para obtener reservas pendientes de asignación
      const response = await apiService.getReservasPendientesAsignacion();
      setReservasPendientes(response);
    } catch (error) {
      console.error('Error cargando reservas pendientes:', error);
    }
  };

  // Handlers para carga de series
  const handleArchivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArchivo(e.target.files[0]);
    }
  };

  const handleCargarSeries = async () => {
    if (!archivo || !armaSeleccionadaCarga) {
      alert('Por favor seleccione un arma y un archivo');
      return;
    }

    setCargando(true);
    setResultadoCarga(null);

    try {
      const resultado = await armaSerieService.cargarSeriesDesdeArchivo(
        archivo,
        armaSeleccionadaCarga,
        lote
      );

      setResultadoCarga(resultado);
      
      if (resultado.success) {
        alert(`✅ Series cargadas exitosamente!\n\n` +
              `Total procesadas: ${resultado.totalProcesadas}\n` +
              `Total cargadas: ${resultado.totalCargadas}\n` +
              `Duplicados: ${resultado.totalDuplicados}`);
        
        // Limpiar formulario
        setArchivo(null);
        setLote('');
        
        // Recargar estadísticas
        cargarEstadisticas();
      } else {
        alert(`❌ Error cargando series: ${resultado.error}`);
      }
    } catch (error: any) {
      console.error('Error cargando series:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Handlers para asignación de series
  const handleSeleccionarReserva = async (reserva: ClienteArmaReserva) => {
    setReservaSeleccionada(reserva);
    setSerieSeleccionada('');

    try {
      const series = await armaSerieService.getSeriesDisponibles(reserva.armaId);
      setSeriesDisponibles(series);
    } catch (error) {
      console.error('Error cargando series disponibles:', error);
      alert('Error cargando series disponibles');
    }
  };

  const handleAsignarSerie = async () => {
    if (!reservaSeleccionada || !serieSeleccionada || !user) {
      alert('Por favor seleccione una reserva y un número de serie');
      return;
    }

    setAsignando(true);

    try {
      const resultado = await armaSerieService.asignarSerieACliente(
        reservaSeleccionada.id,
        serieSeleccionada,
        user.id
      );

      if (resultado.success) {
        alert(`✅ Serie asignada exitosamente!\n\nSe ha enviado un correo al cliente con la información.`);
        
        // Recargar listas
        cargarReservasPendientes();
        cargarEstadisticas();
        
        // Limpiar selección
        setReservaSeleccionada(null);
        setSerieSeleccionada('');
        setSeriesDisponibles([]);
      }
    } catch (error: any) {
      console.error('Error asignando serie:', error);
      alert(`❌ Error: ${error.response?.data?.error || error.message}`);
    } finally {
      setAsignando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Gestión de Números de Serie</h1>
          <p className="text-gray-600">Carga y asignación de números de serie de armas</p>
        </div>

        {/* Navegación de pestañas */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setVistaActual('cargar')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'cargar'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📂 Cargar Series
          </button>
          <button
            onClick={() => setVistaActual('asignar')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'asignar'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            🔧 Asignar a Clientes
          </button>
          <button
            onClick={() => setVistaActual('estadisticas')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              vistaActual === 'estadisticas'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            📊 Estadísticas
          </button>
        </div>

        {/* Contenido según vista actual */}
        {vistaActual === 'cargar' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cargar Números de Serie desde Archivo</h2>
            
            <div className="space-y-6">
              {/* Selección de arma */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arma <span className="text-red-500">*</span>
                </label>
                <select
                  value={armaSeleccionadaCarga || ''}
                  onChange={(e) => setArmaSeleccionadaCarga(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Seleccione un arma</option>
                  {armas.map((arma) => (
                    <option key={arma.id} value={arma.id}>
                      {arma.codigo} - {arma.nombre} ({arma.calibre})
                    </option>
                  ))}
                </select>
              </div>

              {/* Lote */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lote / Grupo de Importación (Opcional)
                </label>
                <input
                  type="text"
                  value={lote}
                  onChange={(e) => setLote(e.target.value)}
                  placeholder="Ej: LOTE-2025-01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Archivo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Archivo CSV/TXT <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".csv,.txt,.xlsx"
                  onChange={handleArchivoChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Formato esperado: Una línea por número de serie (CSV, TXT o XLSX)
                </p>
              </div>

              {/* Botón de carga */}
              <button
                onClick={handleCargarSeries}
                disabled={cargando || !archivo || !armaSeleccionadaCarga}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? 'Cargando...' : '📂 Cargar Números de Serie'}
              </button>

              {/* Resultado de carga */}
              {resultadoCarga && (
                <div className={`p-4 rounded-lg ${resultadoCarga.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <h3 className="font-bold mb-2">{resultadoCarga.success ? '✅ Carga Exitosa' : '❌ Error en la Carga'}</h3>
                  {resultadoCarga.success ? (
                    <div className="space-y-1 text-sm">
                      <p>Total procesadas: <strong>{resultadoCarga.totalProcesadas}</strong></p>
                      <p>Total cargadas: <strong>{resultadoCarga.totalCargadas}</strong></p>
                      <p>Duplicados: <strong>{resultadoCarga.totalDuplicados}</strong></p>
                      <p>Errores: <strong>{resultadoCarga.totalErrores}</strong></p>
                      {resultadoCarga.duplicados.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium">Números de serie duplicados:</p>
                          <ul className="list-disc list-inside">
                            {resultadoCarga.duplicados.map((dup, index) => (
                              <li key={index}>{dup}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-700">{resultadoCarga.error}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {vistaActual === 'asignar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Lista de reservas pendientes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Reservas Pendientes de Asignación</h2>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {reservasPendientes.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay reservas pendientes</p>
                ) : (
                  reservasPendientes.map((reserva) => (
                    <div
                      key={reserva.id}
                      onClick={() => handleSeleccionarReserva(reserva)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        reservaSeleccionada?.id === reserva.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-gray-800">
                            {reserva.clienteNombre} {reserva.clienteApellidos}
                          </p>
                          <p className="text-sm text-gray-600">CI: {reserva.clienteIdentificacion}</p>
                          <p className="text-sm text-gray-600">Arma: {reserva.armaNombre}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Reservado: {new Date(reserva.fechaReserva).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          {reserva.estado}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Asignación de serie */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Asignar Número de Serie</h2>
              
              {!reservaSeleccionada ? (
                <p className="text-gray-500 text-center py-12">
                  ← Seleccione una reserva para asignar un número de serie
                </p>
              ) : (
                <div className="space-y-4">
                  {/* Información del cliente */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-800 mb-2">Cliente</h3>
                    <p><strong>Nombre:</strong> {reservaSeleccionada.clienteNombre} {reservaSeleccionada.clienteApellidos}</p>
                    <p><strong>CI:</strong> {reservaSeleccionada.clienteIdentificacion}</p>
                    <p><strong>Arma:</strong> {reservaSeleccionada.armaNombre}</p>
                  </div>

                  {/* Selección de número de serie */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Serie <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={serieSeleccionada}
                      onChange={(e) => setSerieSeleccionada(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Seleccione un número de serie</option>
                      {seriesDisponibles.map((serie) => (
                        <option key={serie.id} value={serie.numeroSerie}>
                          {serie.numeroSerie} {serie.lote ? `(Lote: ${serie.lote})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                      Series disponibles: {seriesDisponibles.length}
                    </p>
                  </div>

                  {/* Botón de asignación */}
                  <button
                    onClick={handleAsignarSerie}
                    disabled={asignando || !serieSeleccionada}
                    className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {asignando ? 'Asignando...' : '✅ Asignar Serie y Enviar Correo'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {vistaActual === 'estadisticas' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Estadísticas de Números de Serie</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Arma</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Disponibles</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Asignadas</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Vendidas</th>
                  </tr>
                </thead>
                <tbody>
                  {estadisticas.map((stat) => (
                    <tr key={stat.armaId} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{stat.armaNombre}</td>
                      <td className="px-4 py-3 text-center text-sm font-medium">{stat.total}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                          {stat.disponibles}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                          {stat.asignadas}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {stat.vendidas}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {estadisticas.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No hay estadísticas disponibles
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GestionSeries;

