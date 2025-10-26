import React from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import LicenseManagement from './components/LicenseManagement';

const LicenseManagementPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Gestión de Licencias" 
        subtitle="Administración del sistema de licencias"
        showBackButton={true}
        onBack={() => navigate('/admin')}
        backLabel="Volver al Dashboard"
      />
      
      <div className="p-6">
        <LicenseManagement />
      </div>
    </div>
  );
};

export default LicenseManagementPage;
