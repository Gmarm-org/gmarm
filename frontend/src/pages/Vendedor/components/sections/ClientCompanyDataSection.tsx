import React from 'react';

interface ClientCompanyDataSectionProps {
  mode: 'create' | 'edit' | 'view';
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  provincias: Array<{codigo: string, nombre: string}>;
  availableCantonsEmpresa: string[];
  getNombreProvincia: (codigo: string) => string;
  getBorderColor: (field: string, value: string) => string;
}

export const ClientCompanyDataSection: React.FC<ClientCompanyDataSectionProps> = ({
  mode,
  formData,
  handleInputChange,
  provincias,
  availableCantonsEmpresa,
  getNombreProvincia,
  getBorderColor
}) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-purple-100 p-3 rounded-full mr-4">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Datos de la Empresa</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Representante Legal - Solo mostrar si NO es Compañía de Seguridad (ya está en Datos de representante legal) */}
        {formData.tipoCliente !== 'Compañía de Seguridad' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Representante Legal *</label>
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {formData.representanteLegal || 'No especificado'}
              </div>
            ) : (
              <input
                type="text"
                value={formData.representanteLegal}
                onChange={(e) => handleInputChange('representanteLegal', e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                placeholder="Nombres y apellidos del representante"
              />
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">RUC *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.ruc || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.ruc}
              onChange={(e) => handleInputChange('ruc', e.target.value)}
              required
              maxLength={13}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('ruc', formData.ruc || '')}`}
              placeholder="1234567890001"
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la Empresa *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.nombreEmpresa || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.nombreEmpresa}
              onChange={(e) => handleInputChange('nombreEmpresa', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
              placeholder="Nombre completo de la empresa"
            />
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección Fiscal *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.direccionFiscal || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.direccionFiscal}
              onChange={(e) => handleInputChange('direccionFiscal', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
              placeholder="Dirección fiscal de la empresa"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono de Referencia *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.telefonoReferencia || 'No especificado'}
            </div>
          ) : (
            <input
              type="tel"
              value={formData.telefonoReferencia}
              onChange={(e) => handleInputChange('telefonoReferencia', e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('telefonoReferencia', formData.telefonoReferencia || '')}`}
              placeholder="Teléfono de la empresa"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Correo de la Empresa *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.correoEmpresa || 'No especificado'}
            </div>
          ) : (
            <input
              type="email"
              value={formData.correoEmpresa}
              onChange={(e) => handleInputChange('correoEmpresa', e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 ${getBorderColor('correoEmpresa', formData.correoEmpresa || '')}`}
              placeholder="correo@empresa.com"
            />
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia de la Empresa *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {getNombreProvincia(formData.provinciaEmpresa)}
            </div>
          ) : (
            <select
              value={formData.provinciaEmpresa}
              onChange={(e) => handleInputChange('provinciaEmpresa', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
            >
              <option value="">Seleccionar provincia</option>
              {provincias.map(provincia => (
                <option key={provincia.codigo} value={provincia.codigo}>{provincia.nombre}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cantón de la Empresa *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.cantonEmpresa || 'No especificado'}
            </div>
          ) : (
            <select
              value={formData.cantonEmpresa}
              onChange={(e) => handleInputChange('cantonEmpresa', e.target.value)}
              disabled={!formData.provinciaEmpresa}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
            >
              <option value="">Seleccionar cantón</option>
              {availableCantonsEmpresa.map((canton, index) => (
                <option key={`canton-empresa-${index}-${canton}`} value={canton}>{canton}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
};

