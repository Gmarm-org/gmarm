import React from 'react';
import { calcularEdad, validarEdadMinima, obtenerMensajeErrorEdad } from '../../../../utils/ageValidation';
import { getNombreTipoIdentificacion, getMaxLength } from '../../utils/clientFormHelpers';

interface ClientPersonalDataSectionProps {
  mode: 'create' | 'edit' | 'view';
  formData: any;
  handleInputChange: (field: string, value: string) => void;
  tiposCliente: any[];
  tiposIdentificacion: any[];
  provincias: Array<{codigo: string, nombre: string}>;
  availableCantons: string[];
  getNombreProvincia: (codigo: string) => string;
  isUniformadoByType: boolean;
  isMilitaryType: boolean;
  isPoliceType: boolean; // Nuevo prop para policías
  getBorderColor: (field: string, value: string) => string;
}

export const ClientPersonalDataSection: React.FC<ClientPersonalDataSectionProps> = ({
  mode,
  formData,
  handleInputChange,
  tiposCliente,
  tiposIdentificacion,
  provincias,
  availableCantons,
  getNombreProvincia,
  isUniformadoByType,
  isMilitaryType,
  isPoliceType, // Nuevo prop para policías
  getBorderColor
}) => {
  // Cálculos de edad
  const edad = formData.fechaNacimiento ? calcularEdad(formData.fechaNacimiento) : null;
  const edadValida = formData.fechaNacimiento ? validarEdadMinima(formData.fechaNacimiento) : false;
  const mensajeErrorEdad = formData.fechaNacimiento ? obtenerMensajeErrorEdad(formData.fechaNacimiento) : 'Fecha de nacimiento no especificada';
  
  // Helpers locales
  const getMaxLengthLocal = () => getMaxLength(formData);
  const getNombreTipoIdentificacionLocal = (codigo: string) => getNombreTipoIdentificacion(codigo, tiposIdentificacion);
  
  // Calcular fecha máxima para el input date
  const fechaMaxima = (() => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  })();

  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {formData.tipoCliente === 'Compañía de Seguridad' ? 'Datos de representante legal' : 'Datos Personales'}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tipo de Cliente */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Cliente *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.tipoCliente || 'No especificado'}
            </div>
          ) : (
            <select
              value={formData.tipoCliente}
              onChange={(e) => handleInputChange('tipoCliente', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Seleccionar tipo</option>
              {tiposCliente.map(tipo => (
                <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {/* Tipo de Identificación */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Identificación *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.tipoIdentificacion ? getNombreTipoIdentificacionLocal(formData.tipoIdentificacion) : 'No especificado'}
            </div>
          ) : (
            <select
              value={formData.tipoIdentificacion}
              onChange={(e) => handleInputChange('tipoIdentificacion', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Seleccionar tipo</option>
              {tiposIdentificacion
                .filter(tipo => {
                  // RUC solo debe aparecer para Compañía de Seguridad
                  if (tipo.codigo === 'RUC' || tipo.nombre === 'RUC') {
                    return formData.tipoCliente === 'Compañía de Seguridad';
                  }
                  return true;
                })
                .map(tipo => (
                  <option key={tipo.id} value={tipo.codigo}>{tipo.nombre}</option>
                ))}
            </select>
          )}
        </div>

        {/* Número de Identificación */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Número de Identificación *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.numeroIdentificacion || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.numeroIdentificacion}
              onChange={(e) => handleInputChange('numeroIdentificacion', e.target.value)}
              required
              maxLength={getMaxLengthLocal()}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('numeroIdentificacion', formData.numeroIdentificacion)}`}
              placeholder={`Ingrese ${formData.tipoIdentificacion ? getNombreTipoIdentificacionLocal(formData.tipoIdentificacion).toLowerCase() : 'número de identificación'}`}
            />
          )}
        </div>

        {/* Rango - Solo para uniformados */}
        {isUniformadoByType && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Rango (Opcional)</label>
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {formData.rango || 'No especificado'}
              </div>
            ) : (
              <input
                type="text"
                value={formData.rango}
                onChange={(e) => handleInputChange('rango', e.target.value.toUpperCase())}
                placeholder="Ej: TENIENTE, CAPITÁN, MAYOR, etc."
                maxLength={100}
                style={{ textTransform: 'uppercase' }}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              />
            )}
          </div>
        )}

        {/* Nombres */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombres *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.nombres || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.nombres}
              onChange={(e) => handleInputChange('nombres', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              placeholder="Ingrese nombres"
            />
          )}
        </div>

        {/* Apellidos */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Apellidos *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.apellidos || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.apellidos}
              onChange={(e) => handleInputChange('apellidos', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              placeholder="Ingrese los apellidos"
            />
          )}
        </div>

        {/* Fecha de Nacimiento */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Fecha de Nacimiento *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.fechaNacimiento || 'No especificado'}
            </div>
          ) : (
            <>
              <input
                type="date"
                value={formData.fechaNacimiento}
                onChange={(e) => handleInputChange('fechaNacimiento', e.target.value)}
                min="1900-01-01"
                max={fechaMaxima}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              />
              <p className="mt-1 text-xs text-gray-500">
                Rango válido: 1900 - {new Date().getFullYear()} • El cliente debe tener al menos 25 años
              </p>
            </>
          )}
          {formData.fechaNacimiento && edad !== null && (
            <div className={`mt-2 p-3 rounded-lg text-sm ${edadValida ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              <span className="font-medium">Edad: {edad} años</span>
              {!edadValida && (
                <div className="mt-2">
                  <p className="font-bold">⚠️ CLIENTE INHABILITADO PARA COMPRA DE ARMAS</p>
                  <p className="mt-1">{mensajeErrorEdad}</p>
                  <p className="mt-1 text-xs">El cliente se guardará pero NO podrá seleccionar armas hasta cumplir 25 años.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Correo Electrónico */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Correo Electrónico *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.email || 'No especificado'}
            </div>
          ) : (
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('email', formData.email)}`}
              placeholder="ejemplo@correo.com"
            />
          )}
        </div>

        {/* Teléfono Principal */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Principal *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.telefonoPrincipal || 'No especificado'}
            </div>
          ) : (
            <input
              type="tel"
              value={formData.telefonoPrincipal}
              onChange={(e) => handleInputChange('telefonoPrincipal', e.target.value)}
              required
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('telefonoPrincipal', formData.telefonoPrincipal)}`}
              placeholder="0999999999"
            />
          )}
        </div>

        {/* Teléfono Secundario */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono Secundario</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.telefonoSecundario || 'No especificado'}
            </div>
          ) : (
            <input
              type="tel"
              value={formData.telefonoSecundario}
              onChange={(e) => handleInputChange('telefonoSecundario', e.target.value)}
              className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 ${getBorderColor('telefonoSecundario', formData.telefonoSecundario || '')}`}
              placeholder="0999999999 (opcional)"
            />
          )}
        </div>

        {/* Provincia */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Provincia *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {getNombreProvincia(formData.provincia)}
            </div>
          ) : (
            <select
              value={formData.provincia}
              onChange={(e) => handleInputChange('provincia', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
            >
              <option value="">Seleccionar provincia</option>
              {provincias.map(provincia => (
                <option key={provincia.codigo} value={provincia.codigo}>{provincia.nombre}</option>
              ))}
            </select>
          )}
        </div>

        {/* Cantón */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Cantón *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.canton || 'No especificado'}
            </div>
          ) : (
            <select
              value={formData.canton}
              onChange={(e) => handleInputChange('canton', e.target.value)}
              disabled={!formData.provincia}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 transition-all duration-200"
            >
              <option value="">Seleccionar cantón</option>
              {availableCantons.map((canton, index) => (
                <option key={`canton-${index}-${canton}`} value={canton}>{canton}</option>
              ))}
            </select>
          )}
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Dirección *</label>
          {mode === 'view' ? (
            <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
              {formData.direccion || 'No especificado'}
            </div>
          ) : (
            <input
              type="text"
              value={formData.direccion}
              onChange={(e) => handleInputChange('direccion', e.target.value)}
              required
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              placeholder="Ingrese la dirección completa"
            />
          )}
        </div>

        {/* Estado Militar - Solo para uniformados */}
        {isUniformadoByType && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Estado Militar *</label>
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {formData.estadoMilitar || 'No especificado'}
              </div>
            ) : (
              <select
                value={formData.estadoMilitar}
                onChange={(e) => handleInputChange('estadoMilitar', e.target.value)}
                required
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200"
              >
                <option value="">Seleccionar estado</option>
                <option value="ACTIVO">Activo</option>
                <option value="PASIVO">Pasivo</option>
              </select>
            )}
          </div>
        )}

        {/* Código ISSFA - Solo para tipos militares específicos */}
        {isMilitaryType && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código ISSFA {formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO' ? '*' : ''}
            </label>
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {formData.codigoIssfa || 'No especificado'}
              </div>
            ) : (
              <input
                type="text"
                value={formData.codigoIssfa || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleInputChange('codigoIssfa', value);
                }}
                placeholder="Ingrese código ISSFA de 10 dígitos"
                required={formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO'}
                maxLength={10}
                pattern="\d{10}"
                className={`w-full px-4 py-3 border-2 ${getBorderColor('codigoIssfa', formData.codigoIssfa || '')} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200`}
              />
            )}
          </div>
        )}

        {/* Código ISSPOL - Solo para tipos policía */}
        {isPoliceType && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Código ISSPOL {formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO' ? '*' : ''}
            </label>
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {formData.codigoIsspol || 'No especificado'}
              </div>
            ) : (
              <input
                type="text"
                value={formData.codigoIsspol || ''}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleInputChange('codigoIsspol', value);
                }}
                placeholder="Ingrese código ISSPOL de 10 dígitos"
                required={formData.estadoMilitar === 'ACTIVO' || formData.estadoMilitar === 'PASIVO'}
                maxLength={10}
                pattern="\d{10}"
                className={`w-full px-4 py-3 border-2 ${getBorderColor('codigoIsspol', formData.codigoIsspol || '')} rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200`}
              />
            )}
          </div>
        )}

        {/* Mensaje informativo para uniformados en estado pasivo */}
        {isUniformadoByType && formData.estadoMilitar === 'PASIVO' && (
          <div className="md:col-span-2">
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6">
              <div className="flex items-start">
                <div className="bg-yellow-100 p-2 rounded-full mr-4 mt-1">
                  <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Proceso como Cliente Civil</h3>
                  <p className="text-yellow-700">
                    Al estar en estado pasivo, el proceso continuará como cliente Civil. 
                    Se aplicarán las preguntas y documentos correspondientes a clientes Civiles.
                    El código ISSFA es obligatorio.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

