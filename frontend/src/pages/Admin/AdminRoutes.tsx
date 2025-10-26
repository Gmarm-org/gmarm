import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import UserList from './UserManagement/UserList';
import WeaponList from './WeaponManagement/WeaponList';
import WeaponCategoryList from './WeaponManagement/WeaponCategoryList';
import LicenseList from './LicenseManagement/LicenseList';
import RoleList from './RoleManagement/RoleList';
import ClientTypeList from './SystemConfig/ClientTypeList';
import ImportTypeList from './SystemConfig/ImportTypeList';
import IdentificationTypeList from './SystemConfig/IdentificationTypeList';

const AdminRoutes: React.FC = () => {
  const location = useLocation();
  
  console.log('🔍 AdminRoutes - Ruta actual:', location.pathname);
  console.log('🔍 AdminRoutes - Renderizando AdminRoutes');

  return (
    <Routes>
      <Route path="/" element={<AdminDashboard />} />
      <Route path="/users" element={<UserList />} />
      <Route path="/weapons" element={<WeaponList />} />
      <Route path="/licenses" element={<LicenseList />} />
      <Route path="/roles" element={<RoleList />} />
      
      {/* Catálogos del Sistema */}
      <Route path="/weapon-categories" element={<WeaponCategoryList />} />
      <Route path="/accessories" element={<div className="p-6"><h1>Gestión de Accesorios</h1><p>En desarrollo...</p></div>} />
      <Route path="/accessory-types" element={<div className="p-6"><h1>Tipos de Accesorios</h1><p>En desarrollo...</p></div>} />
      
      {/* Clientes */}
      <Route path="/clients" element={<div className="p-6"><h1>Gestión de Clientes</h1><p>En desarrollo...</p></div>} />
      
      {/* Configuración del Sistema */}
      <Route path="/client-types" element={<ClientTypeList />} />
      <Route path="/import-types" element={<ImportTypeList />} />
      <Route path="/process-types" element={<div className="p-6"><h1>Tipos de Proceso</h1><p>En desarrollo...</p></div>} />
      <Route path="/identification-types" element={<IdentificationTypeList />} />
      <Route path="/document-types" element={<div className="p-6"><h1>Tipos de Documento</h1><p>En desarrollo...</p></div>} />
      <Route path="/client-questions" element={<div className="p-6"><h1>Preguntas del Cliente</h1><p>En desarrollo...</p></div>} />
      <Route path="/payment-plans" element={<div className="p-6"><h1>Planes de Pago</h1><p>En desarrollo...</p></div>} />
      
      {/* Documentos */}
      <Route path="/client-documents" element={<div className="p-6"><h1>Documentos de Cliente</h1><p>En desarrollo...</p></div>} />
      <Route path="/import-group-documents" element={<div className="p-6"><h1>Documentos de Grupo de Importación</h1><p>En desarrollo...</p></div>} />
      
      {/* Otros */}
      <Route path="/import-groups" element={<div className="p-6"><h1>Grupos de Importación</h1><p>En desarrollo...</p></div>} />
      <Route path="/payments" element={<div className="p-6"><h1>Gestión de Pagos</h1><p>En desarrollo...</p></div>} />
    </Routes>
  );
};

export default AdminRoutes;
