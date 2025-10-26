import React, { useState, useEffect } from 'react';
import { mockApiService } from '../../../services/mockApiService';
import { type Licencia, type LicenciaCreateRequest, type LicenciaSearchParams } from '../../../services/api';
import { useAuth } from '../../../contexts/AuthContext';

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

interface LicenseFormProps {
  formData: LicenseForm;
  setFormData: React.Dispatch<React.SetStateAction<LicenseForm>>;
  onSubmit: () => void;
  onCancel: () => void;
  isEdit: boolean;
}

const LicenseForm: React.FC<LicenseFormProps> = ({ formData, setFormData, onSubmit, onCancel, isEdit }) => {
  const handleInputChange = (field: keyof LicenseForm, value: string | number) => {
    // Validaciones específicas para campos numéricos
    if (field === 'ruc' && typeof value === 'string') {
      // Solo permitir números y máximo 13 dígitos
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 13) {
        setFormData({ ...formData, [field]: numericValue });
      }
      return;
    }

    if (field === 'cedulaCuenta' && typeof value === 'string') {
      // Solo permitir números y máximo 10 dígitos
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 10) {
        setFormData({ ...formData, [field]: numericValue });
      }
      return;
    }

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
            placeholder="RUC (13 dígitos, opcional)"
            maxLength={13}
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
            placeholder="Cédula (10 dígitos)"
            maxLength={10}
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

      {/* Fechas y estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        >
          Cancelar
        </button>
        <button
          onClick={onSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEdit ? 'Actualizar' : 'Crear'} Licencia
        </button>
      </div>
    </div>
  );
};

const LicenseManagement: React.FC = () => {
  const { user } = useAuth();
  const [licenses, setLicenses] = useState<Licencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<Licencia | null>(null);
  const [formData, setFormData] = useState<LicenseForm>({
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
    descripcion: '',
    fechaEmision: '',
    cupoTotal: 25,
    cupoDisponible: 25,
    cupoCivil: 25,
    cupoMilitar: 1000,
    cupoEmpresa: 1000,
    cupoDeportista: 1000,
    observaciones: '',
    estado: 'ACTIVA'
  });

  useEffect(() => {
    loadLicenses();
  }, [currentPage, searchTerm, filterEstado]);

  const loadLicenses = async () => {
    try {
      setLoading(true);
      const searchParams: LicenciaSearchParams = {
        page: currentPage,
        size: 10,
        numeroLicencia: searchTerm || undefined,
        estado: filterEstado || undefined
      };

      const response = await mockApiService.buscarLicencias(searchParams);
      setLicenses(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError('Error al cargar las licencias');
      console.error('Error loading licenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLicense = async () => {
    if (!formData.numero || !formData.nombre || !formData.fechaVencimiento) {
      alert('Por favor completa todos los campos obligatorios');
      return;
    }

    // Validación de RUC (13 dígitos numéricos)
    if (formData.ruc && (!/^\d{13}$/.test(formData.ruc))) {
      alert('El RUC debe tener exactamente 13 dígitos numéricos');
      return;
    }

    // Validación de cédula de la cuenta (10 dígitos numéricos)
    if (formData.cedulaCuenta && (!/^\d{10}$/.test(formData.cedulaCuenta))) {
      alert('La cédula de la cuenta debe tener exactamente 10 dígitos numéricos');
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

      await mockApiService.createLicencia(licenciaData, user.id);
      
      setFormData({
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
        descripcion: '',
        fechaEmision: '',
        cupoTotal: 25,
        cupoDisponible: 25,
        cupoCivil: 25,
        cupoMilitar: 1000,
        cupoEmpresa: 1000,
        cupoDeportista: 1000,
        observaciones: '',
        estado: 'ACTIVA'
      });
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

    // Validación de RUC (13 dígitos numéricos)
    if (formData.ruc && (!/^\d{13}$/.test(formData.ruc))) {
      alert('El RUC debe tener exactamente 13 dígitos numéricos');
      return;
    }

    // Validación de cédula de la cuenta (10 dígitos numéricos)
    if (formData.cedulaCuenta && (!/^\d{10}$/.test(formData.cedulaCuenta))) {
      alert('La cédula de la cuenta debe tener exactamente 10 dígitos numéricos');
      return;
    }

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

      await mockApiService.updateLicencia(selectedLicense.id, licenciaData, user.id);
      
      setFormData({
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
        descripcion: '',
        fechaEmision: '',
        cupoTotal: 25,
        cupoDisponible: 25,
        cupoCivil: 25,
        cupoMilitar: 1000,
        cupoEmpresa: 1000,
        cupoDeportista: 1000,
        observaciones: '',
        estado: 'ACTIVA'
      });
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
      await mockApiService.deleteLicencia(selectedLicense.id);
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
      descripcion: license.descripcion || '',
      fechaEmision: license.fechaEmision || '',
      cupoTotal: license.cupoTotal || 25,
      cupoDisponible: license.cupoDisponible || 25,
      cupoCivil: license.cupoCivil || 25,
      cupoMilitar: license.cupoMilitar || 1000,
      cupoEmpresa: license.cupoEmpresa || 1000,
      cupoDeportista: license.cupoDeportista || 1000,
      observaciones: license.observaciones || '',
      estado: license.estado || 'ACTIVA'
    });
    setShowEditModal(true);
  };

  const handleDeleteClick = (license: Licencia) => {
    setSelectedLicense(license);
    setShowDeleteModal(true);
  };

  const handleViewDetails = (license: Licencia) => {
    setSelectedLicense(license);
    setShowViewModal(true);
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

      {/* Botón crear licencia */}
      <div className="mb-6">
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center"
        >
          <span className="mr-2">+</span>
          Crear Nueva Licencia
        </button>
      </div>

      {/* Tabla de licencias */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Licencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Información
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cupos
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
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{license.email}</div>
                    <div className="text-sm text-gray-500">{license.telefono}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(license.estado)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Civil:</span>
                        <span className="font-semibold text-blue-600">{license.cupoCivil || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Militar:</span>
                        <span className="font-semibold text-green-600">{license.cupoMilitar || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Empresa:</span>
                        <span className="font-semibold text-purple-600">{license.cupoEmpresa || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Deportista:</span>
                        <span className="font-semibold text-orange-600">{license.cupoDeportista || 0}</span>
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

      {/* Modal de vista de detalles */}
      {showViewModal && selectedLicense && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Detalles de Licencia {selectedLicense.numero}
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Información básica */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Información Básica</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Número de Licencia</label>
                      <p className="text-sm text-gray-900">{selectedLicense.numero}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Nombre</label>
                      <p className="text-sm text-gray-900">{selectedLicense.nombre}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">RUC</label>
                      <p className="text-sm text-gray-900">{selectedLicense.ruc}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Email</label>
                      <p className="text-sm text-gray-900">{selectedLicense.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Teléfono</label>
                      <p className="text-sm text-gray-900">{selectedLicense.telefono}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Estado</label>
                      <div className="mt-1">{getStatusBadge(selectedLicense.estado)}</div>
                    </div>
                  </div>
                </div>

                {/* Información bancaria y fechas */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Información Bancaria y Fechas</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Banco</label>
                      <p className="text-sm text-gray-900">{selectedLicense.nombreBanco}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Tipo de Cuenta</label>
                      <p className="text-sm text-gray-900">{selectedLicense.tipoCuenta}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Número de Cuenta</label>
                      <p className="text-sm text-gray-900">{selectedLicense.cuentaBancaria}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Cédula de la Cuenta</label>
                      <p className="text-sm text-gray-900">{selectedLicense.cedulaCuenta}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Fecha de Emisión</label>
                      <p className="text-sm text-gray-900">{selectedLicense.fechaEmision ? new Date(selectedLicense.fechaEmision).toLocaleDateString('es-ES') : 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600">Fecha de Vencimiento</label>
                      <p className="text-sm text-gray-900">{selectedLicense.fechaVencimiento ? new Date(selectedLicense.fechaVencimiento).toLocaleDateString('es-ES') : 'No especificada'}</p>
                    </div>
                  </div>
                </div>

                {/* Cupos */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-800 border-b pb-2">Cupos Asignados</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Civil:</span>
                      <span className="font-semibold text-blue-600">{selectedLicense.cupoCivil || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Militar:</span>
                      <span className="font-semibold text-green-600">{selectedLicense.cupoMilitar || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Empresa:</span>
                      <span className="font-semibold text-purple-600">{selectedLicense.cupoEmpresa || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Deportista:</span>
                      <span className="font-semibold text-orange-600">{selectedLicense.cupoDeportista || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded text-sm hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LicenseManagement;
