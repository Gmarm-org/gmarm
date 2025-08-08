import React, { useState, useEffect } from 'react';
import { apiService, type Licencia, type LicenciaCreateRequest, type LicenciaSearchParams } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

interface LicenseManagementProps {
  onNavigate: (page: string, data?: any) => void;
}

interface LicenseForm {
  numero: string;
  nombre: string;
  ruc: string;
  cuentaBancaria: string;
  nombreBanco: string;
  tipoCuenta: string;
  cedulaCuenta: string;
  email: string;
  telefono: string;
  fechaVencimiento: string;
  tipoLicencia: string;
  descripcion: string;
  fechaEmision: string;
  cupoTotal: number;
  cupoDisponible: number;
  cupoCivil: number;
  cupoMilitar: number;
  cupoEmpresa: number;
  cupoDeportista: number;
  observaciones: string;
  estado: string;
}

const LicenseManagement: React.FC<LicenseManagementProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<Licencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<Licencia | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const initialForm: LicenseForm = {
    numero: '',
    nombre: '',
    ruc: '',
    cuentaBancaria: '',
    nombreBanco: '',
    tipoCuenta: 'AHORROS',
    cedulaCuenta: '',
    email: '',
    telefono: '',
    fechaVencimiento: '',
    tipoLicencia: 'IMPORTACION_CIVIL',
    descripcion: '',
    fechaEmision: '',
    cupoTotal: 25,
    cupoDisponible: 25,
    cupoCivil: 25,
    cupoMilitar: 0,
    cupoEmpresa: 0,
    cupoDeportista: 0,
    observaciones: '',
    estado: 'ACTIVA'
  };

  const [formData, setFormData] = useState<LicenseForm>(initialForm);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const searchParams: LicenciaSearchParams = {
        page: currentPage,
        size: 10
      };
      
      if (searchTerm) {
        searchParams.numeroLicencia = searchTerm;
      }
      
      if (filterEstado) {
        searchParams.estado = filterEstado;
      }
      
      const response = await apiService.buscarLicencias(searchParams);
      setLicenses(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (err) {
      console.error('Error loading licenses:', err);
      setError('Error al cargar las licencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLicenses();
  }, [currentPage, searchTerm, filterEstado]);

  const handleCreateLicense = async () => {
    if (!formData.numero || !formData.nombre || !formData.fechaVencimiento) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    if (!user?.id) {
      alert('Error: Usuario no autenticado');
      return;
    }

    try {
      const licenciaData: LicenciaCreateRequest = {
        numero: formData.numero,
        nombre: formData.nombre,
        ruc: formData.ruc || undefined,
        cuentaBancaria: formData.cuentaBancaria || undefined,
        nombreBanco: formData.nombreBanco || undefined,
        tipoCuenta: formData.tipoCuenta,
        cedulaCuenta: formData.cedulaCuenta || undefined,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        fechaVencimiento: formData.fechaVencimiento,
        tipoLicencia: formData.tipoLicencia,
        descripcion: formData.descripcion || undefined,
        fechaEmision: formData.fechaEmision || undefined,
        cupoTotal: formData.cupoTotal,
        cupoCivil: formData.cupoCivil,
        cupoMilitar: formData.cupoMilitar,
        cupoEmpresa: formData.cupoEmpresa,
        cupoDeportista: formData.cupoDeportista,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado
      };

      await apiService.createLicencia(licenciaData, user.id);
      
      setFormData(initialForm);
      setShowCreateModal(false);
      loadLicenses();
      alert('Licencia creada exitosamente');
    } catch (err) {
      console.error('Error creating license:', err);
      alert('Error al crear la licencia');
    }
  };

  const handleEditLicense = async () => {
    if (!selectedLicense || !user?.id) return;

    try {
      const licenciaData: Partial<LicenciaCreateRequest> = {
        numero: formData.numero,
        nombre: formData.nombre,
        ruc: formData.ruc || undefined,
        cuentaBancaria: formData.cuentaBancaria || undefined,
        nombreBanco: formData.nombreBanco || undefined,
        tipoCuenta: formData.tipoCuenta,
        cedulaCuenta: formData.cedulaCuenta || undefined,
        email: formData.email || undefined,
        telefono: formData.telefono || undefined,
        fechaVencimiento: formData.fechaVencimiento,
        tipoLicencia: formData.tipoLicencia,
        descripcion: formData.descripcion || undefined,
        fechaEmision: formData.fechaEmision || undefined,
        cupoTotal: formData.cupoTotal,
        cupoCivil: formData.cupoCivil,
        cupoMilitar: formData.cupoMilitar,
        cupoEmpresa: formData.cupoEmpresa,
        cupoDeportista: formData.cupoDeportista,
        observaciones: formData.observaciones || undefined,
        estado: formData.estado
      };

      await apiService.updateLicencia(selectedLicense.id, licenciaData, user.id);
      
      setFormData(initialForm);
      setShowEditModal(false);
      setSelectedLicense(null);
      loadLicenses();
      alert('Licencia actualizada exitosamente');
    } catch (err) {
      console.error('Error updating license:', err);
      alert('Error al actualizar la licencia');
    }
  };

  const handleDeleteLicense = async () => {
    if (!selectedLicense) return;

    try {
      await apiService.deleteLicencia(selectedLicense.id);
      setShowDeleteModal(false);
      setSelectedLicense(null);
      loadLicenses();
      alert('Licencia eliminada exitosamente');
    } catch (err) {
      console.error('Error deleting license:', err);
      alert('Error al eliminar la licencia');
    }
  };

  const handleEditClick = (license: Licencia) => {
    setSelectedLicense(license);
    setFormData({
      numero: license.numero,
      nombre: license.nombre,
      ruc: license.ruc || '',
      cuentaBancaria: license.cuentaBancaria || '',
      nombreBanco: license.nombreBanco || '',
      tipoCuenta: license.tipoCuenta || 'AHORROS',
      cedulaCuenta: license.cedulaCuenta || '',
      email: license.email || '',
      telefono: license.telefono || '',
      fechaVencimiento: license.fechaVencimiento,
      tipoLicencia: license.tipoLicencia || 'IMPORTACION_CIVIL',
      descripcion: license.descripcion || '',
      fechaEmision: license.fechaEmision || '',
      cupoTotal: license.cupoTotal || 0,
      cupoDisponible: license.cupoDisponible || 0,
      cupoCivil: license.cupoCivil || 0,
      cupoMilitar: license.cupoMilitar || 0,
      cupoEmpresa: license.cupoEmpresa || 0,
      cupoDeportista: license.cupoDeportista || 0,
      observaciones: license.observaciones || '',
      estado: license.estado
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (license: Licencia) => {
    setSelectedLicense(license);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (license: Licencia) => {
    onNavigate('licenseDetails', license);
  };

  const getLicenseTypeLabel = (tipo: string) => {
    switch (tipo) {
      case 'IMPORTACION_CIVIL':
        return 'Importación Civil';
      case 'IMPORTACION_MILITAR':
        return 'Importación Militar';
      case 'IMPORTACION_EMPRESA':
        return 'Importación Empresa';
      case 'IMPORTACION_DEPORTISTA':
        return 'Importación Deportista';
      default:
        return tipo;
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVA':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">Activa</span>;
      case 'INACTIVA':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">Inactiva</span>;
      case 'VENCIDA':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">Vencida</span>;
      case 'SUSPENDIDA':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Suspendida</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">{estado}</span>;
    }
  };

  const getUsagePercentage = (license: Licencia) => {
    if (!license.cupoTotal || license.cupoTotal === 0) return 0;
    const used = license.cupoTotal - (license.cupoDisponible || 0);
    return Math.round((used / license.cupoTotal) * 100);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading && licenses.length === 0) {
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
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar licencia</label>
            <input
              type="text"
              placeholder="Número de licencia..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos</option>
              <option value="ACTIVA">Activas</option>
              <option value="INACTIVA">Inactivas</option>
              <option value="VENCIDA">Vencidas</option>
              <option value="SUSPENDIDA">Suspendidas</option>
            </select>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-xl">📋</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{totalElements}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Activas</p>
              <p className="text-lg font-semibold text-gray-900">
                {licenses.filter(l => l.estado === 'ACTIVA').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-xl">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Próximas a vencer</p>
              <p className="text-lg font-semibold text-gray-900">
                {licenses.filter(l => {
                  const fechaVencimiento = new Date(l.fechaVencimiento);
                  const hoy = new Date();
                  const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  return diasRestantes <= 30 && diasRestantes > 0;
                }).length}
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
              <p className="text-sm font-medium text-gray-600">Vencidas</p>
              <p className="text-lg font-semibold text-gray-900">
                {licenses.filter(l => l.estado === 'VENCIDA').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón crear licencia */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
        >
          <span className="mr-2">+</span>
          Crear Nueva Licencia
        </button>
      </div>

      {/* Tabla de licencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Licencias ({totalElements})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vencimiento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {licenses.map((license) => (
                <tr key={license.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{license.numero}</div>
                      <div className="text-sm text-gray-500">{license.nombre}</div>
                      <div className="text-xs text-gray-400">{getLicenseTypeLabel(license.tipoLicencia || '')}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(license.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(license.fechaVencimiento).toLocaleDateString()}</div>
                    <div className="text-xs text-gray-400">
                      {(() => {
                        const fechaVencimiento = new Date(license.fechaVencimiento);
                        const hoy = new Date();
                        const diasRestantes = Math.ceil((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                        if (diasRestantes < 0) return 'Vencida';
                        if (diasRestantes === 0) return 'Vence hoy';
                        if (diasRestantes <= 30) return `${diasRestantes} días restantes`;
                        return `${diasRestantes} días restantes`;
                      })()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-2">
                      {/* Progreso general */}
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(getUsagePercentage(license))}`}
                            style={{ width: `${getUsagePercentage(license)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {license.cupoDisponible || 0}/{license.cupoTotal || 0}
                        </span>
                      </div>
                      
                      {/* Detalle por tipo de cupo */}
                      <div className="text-xs text-gray-500 space-y-1">
                        {license.cupoCivil !== undefined && license.cupoCivil > 0 && (
                          <div className="flex justify-between">
                            <span>Civil:</span>
                            <span className="font-medium">{license.cupoCivil}</span>
                          </div>
                        )}
                        {license.cupoMilitar !== undefined && license.cupoMilitar > 0 && (
                          <div className="flex justify-between">
                            <span>Militar:</span>
                            <span className="font-medium">{license.cupoMilitar}</span>
                          </div>
                        )}
                        {license.cupoEmpresa !== undefined && license.cupoEmpresa > 0 && (
                          <div className="flex justify-between">
                            <span>Empresa:</span>
                            <span className="font-medium">{license.cupoEmpresa}</span>
                          </div>
                        )}
                        {license.cupoDeportista !== undefined && license.cupoDeportista > 0 && (
                          <div className="flex justify-between">
                            <span>Deportista:</span>
                            <span className="font-medium">{license.cupoDeportista}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewDetails(license)}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-md text-xs"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => handleEditClick(license)}
                        className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md text-xs"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteClick(license)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md text-xs"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando {licenses.length} de {totalElements} licencias
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="px-3 py-1 text-sm text-gray-700">
                  Página {currentPage + 1} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        )}
        
        {licenses.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No se encontraron licencias con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal de creación */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Crear Nueva Licencia</h3>
              <LicenseForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleCreateLicense}
                onCancel={() => setShowCreateModal(false)}
                isEdit={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && selectedLicense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Licencia {selectedLicense.numero}</h3>
              <LicenseForm 
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleEditLicense}
                onCancel={() => setShowEditModal(false)}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal de eliminación */}
      {showDeleteModal && selectedLicense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Eliminar Licencia {selectedLicense.numero}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                ¿Estás seguro de que deseas eliminar esta licencia? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteLicense}
                  className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Componente de formulario de licencia
interface LicenseFormProps {
  formData: LicenseForm;
  setFormData: (data: LicenseForm) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit: boolean;
}

const LicenseForm: React.FC<LicenseFormProps> = ({ formData, setFormData, onSubmit, onCancel, isEdit }) => {
  const handleInputChange = (field: keyof LicenseForm, value: string | number) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de Licencia *</label>
          <input
            type="text"
            value={formData.numero}
            onChange={(e) => handleInputChange('numero', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ej: LIC001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre completo"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
          <input
            type="text"
            value={formData.ruc}
            onChange={(e) => handleInputChange('ruc', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="RUC (opcional)"
          />
        </div>
      </div>

      {/* Información bancaria */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cuenta Bancaria</label>
          <input
            type="text"
            value={formData.cuentaBancaria}
            onChange={(e) => handleInputChange('cuentaBancaria', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Número de cuenta"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
          <input
            type="text"
            value={formData.nombreBanco}
            onChange={(e) => handleInputChange('nombreBanco', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nombre del banco"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cuenta</label>
          <select
            value={formData.tipoCuenta}
            onChange={(e) => handleInputChange('tipoCuenta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="AHORROS">Ahorros</option>
            <option value="CORRIENTE">Corriente</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cédula Cuenta</label>
          <input
            type="text"
            value={formData.cedulaCuenta}
            onChange={(e) => handleInputChange('cedulaCuenta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Cédula de la cuenta"
          />
        </div>
      </div>

      {/* Información de contacto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Email de contacto"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            type="tel"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Teléfono de contacto"
          />
        </div>
      </div>

      {/* Fechas y tipo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Vencimiento *</label>
          <input
            type="date"
            value={formData.fechaVencimiento}
            onChange={(e) => handleInputChange('fechaVencimiento', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Licencia</label>
          <select
            value={formData.tipoLicencia}
            onChange={(e) => handleInputChange('tipoLicencia', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="IMPORTACION_CIVIL">Importación Civil</option>
            <option value="IMPORTACION_MILITAR">Importación Militar</option>
            <option value="IMPORTACION_EMPRESA">Importación Empresa</option>
            <option value="IMPORTACION_DEPORTISTA">Importación Deportista</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
          <select
            value={formData.estado}
            onChange={(e) => handleInputChange('estado', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="ACTIVA">Activa</option>
            <option value="INACTIVA">Inactiva</option>
            <option value="SUSPENDIDA">Suspendida</option>
          </select>
        </div>
      </div>

      {/* Cupos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Civil</label>
          <input
            type="number"
            value={formData.cupoCivil}
            onChange={(e) => handleInputChange('cupoCivil', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Militar</label>
          <input
            type="number"
            value={formData.cupoMilitar}
            onChange={(e) => handleInputChange('cupoMilitar', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Empresa</label>
          <input
            type="number"
            value={formData.cupoEmpresa}
            onChange={(e) => handleInputChange('cupoEmpresa', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cupo Deportista</label>
          <input
            type="number"
            value={formData.cupoDeportista}
            onChange={(e) => handleInputChange('cupoDeportista', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            min="0"
          />
        </div>
      </div>

      {/* Descripción y observaciones */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) => handleInputChange('descripcion', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Descripción de la licencia..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
          <textarea
            value={formData.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Observaciones adicionales..."
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onCancel}
          className="bg-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-400"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700"
        >
          {isEdit ? 'Actualizar' : 'Crear'} Licencia
        </button>
      </div>
    </div>
  );
};

export default LicenseManagement; 