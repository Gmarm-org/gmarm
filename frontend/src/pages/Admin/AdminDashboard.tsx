import React, { useState } from 'react';
import Header from '../../components/Header';
import UserListContent from './UserManagement/UserListContent';
import RoleList from './RoleManagement/RoleList';
import WeaponListContent from './WeaponManagement/WeaponListContent';
import WeaponCategoryList from './WeaponManagement/WeaponCategoryList';
import LicenseList from './LicenseManagement/LicenseList';
import ClientTypeList from './SystemConfig/ClientTypeList';
import IdentificationTypeList from './SystemConfig/IdentificationTypeList';
import ImportTypeList from './SystemConfig/ImportTypeList';
import ConfiguracionSistema from './SystemConfig/ConfiguracionSistema';
import GestionPreguntas from './QuestionManagement/GestionPreguntas';
import TipoDocumento from './DocumentManagement/TipoDocumento';

type AdminTab = 
  | 'usuarios' 
  | 'roles' 
  | 'armas' 
  | 'categorias-armas' 
  | 'licencias' 
  | 'tipos-cliente'
  | 'tipos-identificacion'
  | 'tipos-importacion'
  | 'config-sistema'
  | 'preguntas'
  | 'tipos-documento';

const AdminDashboard: React.FC = () => {
  const [tabActual, setTabActual] = useState<AdminTab>('usuarios');

  const tabs = [
    { id: 'usuarios' as AdminTab, label: '👥 Usuarios', icon: '👥', name: 'Usuarios' },
    { id: 'roles' as AdminTab, label: '🛡️ Roles', icon: '🛡️', name: 'Roles' },
    { id: 'armas' as AdminTab, label: '🔫 Armas', icon: '🔫', name: 'Armas' },
    { id: 'categorias-armas' as AdminTab, label: '🏷️ Categorías Armas', icon: '🏷️', name: 'Categorías' },
    { id: 'licencias' as AdminTab, label: '📜 Licencias', icon: '📜', name: 'Licencias' },
    { id: 'tipos-cliente' as AdminTab, label: '👤 Tipos de Cliente', icon: '👤', name: 'Tipos Cliente' },
    { id: 'tipos-identificacion' as AdminTab, label: '🆔 Tipos de Identificación', icon: '🆔', name: 'Tipos ID' },
    { id: 'tipos-importacion' as AdminTab, label: '📦 Tipos de Importación', icon: '📦', name: 'Tipos Import.' },
    { id: 'preguntas' as AdminTab, label: '❓ Preguntas', icon: '❓', name: 'Preguntas' },
    { id: 'tipos-documento' as AdminTab, label: '📄 Tipos Documento', icon: '📄', name: 'Tipos Doc.' },
    { id: 'config-sistema' as AdminTab, label: '⚙️ Configuración Sistema', icon: '⚙️', name: 'Config. Sistema' }
  ];

  const renderTabContent = () => {
    switch (tabActual) {
      case 'usuarios':
        return <UserListContent />;
      case 'roles':
        return <RoleList />;
      case 'categorias-armas':
        return <WeaponCategoryList />;
      case 'tipos-cliente':
        return <ClientTypeList />;
      case 'tipos-identificacion':
        return <IdentificationTypeList />;
      case 'tipos-importacion':
        return <ImportTypeList />;
      case 'armas':
        return <WeaponListContent />;
      case 'licencias':
        return <LicenseList />;
      case 'preguntas':
        return <GestionPreguntas />;
      case 'tipos-documento':
        return <TipoDocumento />;
      case 'config-sistema':
        return <ConfiguracionSistema />;
      default:
        return <UserListContent />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="Panel de Administración" 
        subtitle="Gestión integral del sistema de armas de importación"
      />
      
      <div className="w-full px-6 py-6">
        {/* Navegación de pestañas */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActual(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                tabActual === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña actual */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
