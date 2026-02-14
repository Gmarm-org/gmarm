import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import ClientManagement from './components/ClientManagement';

const ClientManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (_page: string, _data?: Record<string, unknown>) => {
    // Handle navigation within this context if needed
  };

  const handleBackToDashboard = () => {
    navigate('/jefe-ventas');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Clientes" subtitle="Aprobar y gestionar clientes" />
      
      {/* Botón de regreso */}
      <div className="p-6 pb-0">
        <button
          onClick={handleBackToDashboard}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-all duration-200 flex items-center"
        >
          <span className="mr-2">←</span>
          Volver al Dashboard
        </button>
      </div>

      <ClientManagement onNavigate={handleNavigate as any} />
    </div>
  );
};

export default ClientManagementPage;
