import React, { useState, useEffect } from 'react';

interface SalesStats {
  totalVentas: number;
  ventasMes: number;
  ventasSemana: number;
  clientesNuevos: number;
  clientesActivos: number;
  conversionRate: number;
  promedioTicket: number;
}

interface TeamStats {
  vendedor: string;
  ventas: number;
  clientes: number;
  conversionRate: number;
  promedioTicket: number;
  metaCumplida: number;
}

interface LicenseStats {
  totalLicencias: number;
  licenciasActivas: number;
  cuposDisponibles: number;
  cuposUtilizados: number;
  porcentajeUso: number;
}

interface ReportsAndStatsProps {
  onNavigate: (page: string, data?: unknown) => void;
}

const ReportsAndStats: React.FC<ReportsAndStatsProps> = ({ onNavigate: _onNavigate }) => {
  const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [licenseStats, setLicenseStats] = useState<LicenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('mes'); // mes, semana, dia

  // Mock data - en producción esto vendría del backend
  const mockSalesStats: SalesStats = {
    totalVentas: 125000,
    ventasMes: 45000,
    ventasSemana: 12000,
    clientesNuevos: 45,
    clientesActivos: 180,
    conversionRate: 78.5,
    promedioTicket: 2800
  };

  const mockTeamStats: TeamStats[] = [
    {
      vendedor: 'María López',
      ventas: 15000,
      clientes: 12,
      conversionRate: 85.2,
      promedioTicket: 3200,
      metaCumplida: 95
    },
    {
      vendedor: 'Carlos Mendoza',
      ventas: 12000,
      clientes: 10,
      conversionRate: 72.1,
      promedioTicket: 2800,
      metaCumplida: 80
    },
    {
      vendedor: 'Patricia García',
      ventas: 18000,
      clientes: 15,
      conversionRate: 88.9,
      promedioTicket: 3500,
      metaCumplida: 110
    },
    {
      vendedor: 'Luis Herrera',
      ventas: 9000,
      clientes: 8,
      conversionRate: 65.4,
      promedioTicket: 2200,
      metaCumplida: 70
    }
  ];

  const mockLicenseStats: LicenseStats = {
    totalLicencias: 15,
    licenciasActivas: 12,
    cuposDisponibles: 500,
    cuposUtilizados: 320,
    porcentajeUso: 64
  };

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setSalesStats(mockSalesStats);
      setTeamStats(mockTeamStats);
      setLicenseStats(mockLicenseStats);
      setLoading(false);
    }, 1000);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getPeriodLabel = (period: string) => {
    const labels: { [key: string]: string } = {
      'mes': 'Este Mes',
      'semana': 'Esta Semana',
      'dia': 'Hoy'
    };
    return labels[period] || period;
  };

  const getConversionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMetaColor = (meta: number) => {
    if (meta >= 100) return 'text-green-600';
    if (meta >= 80) return 'text-yellow-600';
    return 'text-red-600';
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
        {/* Filtros de período */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Período de Análisis</h2>
            <div className="flex space-x-2">
              {['dia', 'semana', 'mes'].map((period) => (
                <button
                  key={period}
                  onClick={() => setSelectedPeriod(period)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {getPeriodLabel(period)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        {salesStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">💰</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Ventas {getPeriodLabel(selectedPeriod)}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedPeriod === 'mes' && formatCurrency(salesStats.ventasMes)}
                    {selectedPeriod === 'semana' && formatCurrency(salesStats.ventasSemana)}
                    {selectedPeriod === 'dia' && formatCurrency(salesStats.ventasSemana / 7)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">👥</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Clientes Nuevos</p>
                  <p className="text-2xl font-bold text-gray-900">{salesStats.clientesNuevos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <span className="text-yellow-600 text-xl">📊</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                  <p className={`text-2xl font-bold ${getConversionColor(salesStats.conversionRate)}`}>
                    {salesStats.conversionRate}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">🎯</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(salesStats.promedioTicket)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estadísticas de licencias */}
        {licenseStats && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 Estadísticas de Licencias</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{licenseStats.totalLicencias}</p>
                <p className="text-sm text-gray-600">Total Licencias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{licenseStats.licenciasActivas}</p>
                <p className="text-sm text-gray-600">Licencias Activas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{licenseStats.cuposUtilizados}/{licenseStats.cuposDisponibles}</p>
                <p className="text-sm text-gray-600">Cupos Utilizados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{licenseStats.porcentajeUso}%</p>
                <p className="text-sm text-gray-600">Porcentaje de Uso</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${licenseStats.porcentajeUso}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Tabla de rendimiento del equipo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">🏆 Rendimiento del Equipo</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ventas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clientes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Conversión
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Promedio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meta Cumplida
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teamStats.map((member, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {member.vendedor.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{member.vendedor}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(member.ventas)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.clientes}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getConversionColor(member.conversionRate)}`}>
                        {member.conversionRate}%
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatCurrency(member.promedioTicket)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${member.metaCumplida >= 100 ? 'bg-green-600' : 'bg-yellow-600'}`}
                            style={{ width: `${Math.min(member.metaCumplida, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getMetaColor(member.metaCumplida)}`}>
                          {member.metaCumplida}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gráficos y análisis adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Tendencias de Ventas</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Gráfico de tendencias (implementar con Chart.js o similar)</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Distribución por Tipo de Cliente</h3>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">Gráfico de distribución (implementar con Chart.js o similar)</p>
            </div>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">⚡ Acciones Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-all duration-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📊</span>
                <div className="text-left">
                  <div className="font-medium">Generar Reporte</div>
                  <div className="text-sm opacity-90">Exportar datos completos</div>
                </div>
              </div>
            </button>
            <button className="bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-all duration-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">📧</span>
                <div className="text-left">
                  <div className="font-medium">Enviar Resumen</div>
                  <div className="text-sm opacity-90">Por email al equipo</div>
                </div>
              </div>
            </button>
            <button className="bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-all duration-200">
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                <div className="text-left">
                  <div className="font-medium">Configurar Metas</div>
                  <div className="text-sm opacity-90">Establecer objetivos</div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
  );
};

export default ReportsAndStats; 