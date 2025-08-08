import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import LicenseManagement from './components/LicenseManagement';

const LicenseManagementPage: React.FC = () => {
  const navigate = useNavigate();

  const handleNavigate = (page: string, data?: any) => {
    // Handle navigation within this context if needed
    console.log('Navigate to:', page, data);
  };

  const handleBackToDashboard = () => {
    navigate('/jefe-ventas');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Gestión de Licencias" subtitle="CRUD completo de licencias" />
      
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

      <LicenseManagement onNavigate={handleNavigate} />
    </div>
  );
};

export default LicenseManagementPage;
