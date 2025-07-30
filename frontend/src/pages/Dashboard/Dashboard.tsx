import React from 'react';
import Header from '../../components/Header';

interface DashboardStats {
  totalClientes: number;
  clientesActivos: number;
  totalPagos: number;
  pagosPendientes: number;
  totalLicencias: number;
  licenciasActivas: number;
  totalImportaciones: number;
  importacionesActivas: number;
}

const Dashboard: React.FC = () => {
  console.log('🔍 DEBUG: Componente Dashboard renderizado');

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Dashboard" subtitle="Panel de control principal" />
      <div className="p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🎉 ¡Dashboard está funcionando!</h1>
          <p className="text-gray-600">Esta es la pantalla de Dashboard que debería cargar cuando tienes rol ADMIN.</p>
          
          <div className="mt-6 p-4 bg-blue-100 rounded-lg">
            <h2 className="font-semibold text-blue-800">✅ Estado:</h2>
            <ul className="mt-2 text-blue-700">
              <li>• Componente cargado correctamente</li>
              <li>• Header funcionando</li>
              <li>• Routing configurado</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 