import React from 'react';
import { useClientFormValidation, useLoginFormValidation } from '../hooks/useFormValidation';
import { validateBeforeSubmit, getFormattedErrors } from '../utils/schemaValidator';
import FormField from '../components/common/FormField';
import Button from '../components/common/Button';

// Ejemplo de uso del sistema de validación con JSON Schemas
export const ValidationExample: React.FC = () => {
  // Hook para validación de formulario de cliente
  const clientForm = useClientFormValidation({
    tipoCliente: 'Civil',
    tipoIdentificacion: 'Cédula'
  });

  // Hook para validación de formulario de login
  const loginForm = useLoginFormValidation();

  // Función para manejar envío del formulario de cliente
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar antes de enviar al backend
    const validation = clientForm.validateForm();
    
    if (validation.isValid) {
      console.log('✅ Datos válidos, enviando al backend:', clientForm.data);
      
      // Aquí iría la llamada al servicio
      // await clientService.createClient(clientForm.data);
      
      alert('Cliente creado exitosamente');
      clientForm.resetForm();
    } else {
      console.error('❌ Errores de validación:', getFormattedErrors(validation));
      alert(`Errores de validación:\n${getFormattedErrors(validation).join('\n')}`);
    }
  };

  // Función para manejar envío del formulario de login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = loginForm.validateForm();
    
    if (validation.isValid) {
      console.log('✅ Login válido:', loginForm.data);
      // await authService.login(loginForm.data.email, loginForm.data.password);
    } else {
      console.error('❌ Errores de login:', getFormattedErrors(validation));
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Sistema de Validación con JSON Schemas</h1>
      
      {/* Formulario de Cliente */}
      <div style={{ marginBottom: '3rem' }}>
        <h2>Formulario de Cliente</h2>
        <form onSubmit={handleClientSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField
              label="Tipo de Cliente"
              name="tipoCliente"
              type="select"
              value={clientForm.data.tipoCliente || ''}
              onChange={(value) => clientForm.setFieldValue('tipoCliente', value)}
              error={clientForm.getFieldError('tipoCliente')}
              options={[
                { value: 'Civil', label: 'Civil' },
                { value: 'Uniformado', label: 'Uniformado' },
                { value: 'Compañía de Seguridad', label: 'Compañía de Seguridad' }
              ]}
              required
            />
            
            <FormField
              label="Tipo de Identificación"
              name="tipoIdentificacion"
              type="select"
              value={clientForm.data.tipoIdentificacion || ''}
              onChange={(value) => clientForm.setFieldValue('tipoIdentificacion', value)}
              error={clientForm.getFieldError('tipoIdentificacion')}
              options={[
                { value: 'Cédula', label: 'Cédula' },
                { value: 'RUC', label: 'RUC' }
              ]}
              required
            />
            
            <FormField
              label="Cédula/RUC"
              name="cedula"
              type="text"
              value={clientForm.data.cedula || ''}
              onChange={(value) => clientForm.setFieldValue('cedula', value)}
              error={clientForm.getFieldError('cedula')}
              placeholder="1234567890"
              required
            />
            
            <FormField
              label="Apellidos"
              name="apellidos"
              type="text"
              value={clientForm.data.apellidos || ''}
              onChange={(value) => clientForm.setFieldValue('apellidos', value)}
              error={clientForm.getFieldError('apellidos')}
              placeholder="PÉREZ LÓPEZ"
              required
            />
            
            <FormField
              label="Nombres"
              name="nombres"
              type="text"
              value={clientForm.data.nombres || ''}
              onChange={(value) => clientForm.setFieldValue('nombres', value)}
              error={clientForm.getFieldError('nombres')}
              placeholder="JUAN CARLOS"
              required
            />
            
            <FormField
              label="Email"
              name="email"
              type="email"
              value={clientForm.data.email || ''}
              onChange={(value) => clientForm.setFieldValue('email', value)}
              error={clientForm.getFieldError('email')}
              placeholder="juan@example.com"
              required
            />
            
            <FormField
              label="Provincia"
              name="provincia"
              type="select"
              value={clientForm.data.provincia || ''}
              onChange={(value) => clientForm.setFieldValue('provincia', value)}
              error={clientForm.getFieldError('provincia')}
              options={[
                { value: 'Pichincha', label: 'Pichincha' },
                { value: 'Guayas', label: 'Guayas' },
                { value: 'Azuay', label: 'Azuay' }
              ]}
              required
            />
            
            <FormField
              label="Cantón"
              name="canton"
              type="select"
              value={clientForm.data.canton || ''}
              onChange={(value) => clientForm.setFieldValue('canton', value)}
              error={clientForm.getFieldError('canton')}
              options={[
                { value: 'Quito', label: 'Quito' },
                { value: 'Guayaquil', label: 'Guayaquil' },
                { value: 'Cuenca', label: 'Cuenca' }
              ]}
              required
            />
            
            <FormField
              label="Dirección"
              name="direccion"
              type="textarea"
              value={clientForm.data.direccion || ''}
              onChange={(value) => clientForm.setFieldValue('direccion', value)}
              error={clientForm.getFieldError('direccion')}
              placeholder="Calle principal, número, referencia"
              required
              style={{ gridColumn: '1 / -1' }}
            />
            
            <FormField
              label="Teléfono Principal"
              name="telefonoPrincipal"
              type="tel"
              value={clientForm.data.telefonoPrincipal || ''}
              onChange={(value) => clientForm.setFieldValue('telefonoPrincipal', value)}
              error={clientForm.getFieldError('telefonoPrincipal')}
              placeholder="0987654321"
              required
            />
            
            <FormField
              label="Teléfono Secundario"
              name="telefonoSecundario"
              type="tel"
              value={clientForm.data.telefonoSecundario || ''}
              onChange={(value) => clientForm.setFieldValue('telefonoSecundario', value)}
              error={clientForm.getFieldError('telefonoSecundario')}
              placeholder="0987654322"
            />
          </div>
          
          {/* Campos condicionales para Uniformado */}
          {clientForm.data.tipoCliente === 'Uniformado' && (
            <div style={{ marginTop: '1rem' }}>
              <FormField
                label="Estado Militar"
                name="estadoUniformado"
                type="select"
                value={clientForm.data.estadoUniformado || ''}
                onChange={(value) => clientForm.setFieldValue('estadoUniformado', value)}
                error={clientForm.getFieldError('estadoUniformado')}
                options={[
                  { value: 'Activo', label: 'Activo' },
                  { value: 'Pasivo', label: 'Pasivo' }
                ]}
                required
              />
            </div>
          )}
          
          {/* Campos condicionales para Compañía de Seguridad */}
          {clientForm.data.tipoCliente === 'Compañía de Seguridad' && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Datos de Compañía</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FormField
                  label="RUC"
                  name="ruc"
                  type="text"
                  value={clientForm.data.ruc || ''}
                  onChange={(value) => clientForm.setFieldValue('ruc', value)}
                  error={clientForm.getFieldError('ruc')}
                  placeholder="1234567890001"
                  required
                />
                
                <FormField
                  label="Correo Electrónico"
                  name="correoElectronico"
                  type="email"
                  value={clientForm.data.correoElectronico || ''}
                  onChange={(value) => clientForm.setFieldValue('correoElectronico', value)}
                  error={clientForm.getFieldError('correoElectronico')}
                  placeholder="empresa@example.com"
                  required
                />
                
                <FormField
                  label="Provincia Compañía"
                  name="provinciaCompania"
                  type="select"
                  value={clientForm.data.provinciaCompania || ''}
                  onChange={(value) => clientForm.setFieldValue('provinciaCompania', value)}
                  error={clientForm.getFieldError('provinciaCompania')}
                  options={[
                    { value: 'Pichincha', label: 'Pichincha' },
                    { value: 'Guayas', label: 'Guayas' },
                    { value: 'Azuay', label: 'Azuay' }
                  ]}
                  required
                />
                
                <FormField
                  label="Cantón Compañía"
                  name="cantonCompania"
                  type="select"
                  value={clientForm.data.cantonCompania || ''}
                  onChange={(value) => clientForm.setFieldValue('cantonCompania', value)}
                  error={clientForm.getFieldError('cantonCompania')}
                  options={[
                    { value: 'Quito', label: 'Quito' },
                    { value: 'Guayaquil', label: 'Guayaquil' },
                    { value: 'Cuenca', label: 'Cuenca' }
                  ]}
                  required
                />
                
                <FormField
                  label="Dirección Fiscal"
                  name="direccionFiscal"
                  type="textarea"
                  value={clientForm.data.direccionFiscal || ''}
                  onChange={(value) => clientForm.setFieldValue('direccionFiscal', value)}
                  error={clientForm.getFieldError('direccionFiscal')}
                  placeholder="Dirección fiscal de la empresa"
                  required
                  style={{ gridColumn: '1 / -1' }}
                />
                
                <FormField
                  label="Teléfono de Referencia"
                  name="telefonoReferencia"
                  type="tel"
                  value={clientForm.data.telefonoReferencia || ''}
                  onChange={(value) => clientForm.setFieldValue('telefonoReferencia', value)}
                  error={clientForm.getFieldError('telefonoReferencia')}
                  placeholder="0987654323"
                  required
                />
              </div>
            </div>
          )}
          
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
            <Button 
              type="submit" 
              variant="primary"
              disabled={!clientForm.isValid}
            >
              Crear Cliente
            </Button>
            
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => clientForm.resetForm()}
            >
              Limpiar Formulario
            </Button>
          </div>
        </form>
        
        {/* Mostrar errores generales */}
        {clientForm.hasErrors && (
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            backgroundColor: '#fef2f2', 
            border: '1px solid #fecaca',
            borderRadius: '0.375rem'
          }}>
            <h4 style={{ color: '#dc2626', margin: '0 0 0.5rem 0' }}>Errores de Validación:</h4>
            <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
              {clientForm.errors.map((error, index) => (
                <li key={index} style={{ color: '#dc2626' }}>
                  <strong>{error.field}:</strong> {error.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Formulario de Login */}
      <div>
        <h2>Formulario de Login</h2>
        <form onSubmit={handleLoginSubmit} style={{ maxWidth: '400px' }}>
          <FormField
            label="Email"
            name="email"
            type="email"
            value={loginForm.data.email || ''}
            onChange={(value) => loginForm.setFieldValue('email', value)}
            error={loginForm.getFieldError('email')}
            placeholder="usuario@example.com"
            required
          />
          
          <FormField
            label="Contraseña"
            name="password"
            type="text"
            value={loginForm.data.password || ''}
            onChange={(value) => loginForm.setFieldValue('password', value)}
            error={loginForm.getFieldError('password')}
            placeholder="Mínimo 6 caracteres"
            required
          />
          
          <Button 
            type="submit" 
            variant="primary"
            disabled={!loginForm.isValid}
            style={{ marginTop: '1rem' }}
          >
            Iniciar Sesión
          </Button>
        </form>
      </div>
      
      {/* Información del sistema */}
      <div style={{ 
        marginTop: '3rem', 
        padding: '1rem', 
        backgroundColor: '#f0f9ff', 
        border: '1px solid #bae6fd',
        borderRadius: '0.375rem'
      }}>
        <h3>Información del Sistema de Validación</h3>
        <ul>
          <li>✅ <strong>Validación en tiempo real</strong> con JSON Schemas</li>
          <li>✅ <strong>Validación antes de enviar</strong> al backend</li>
          <li>✅ <strong>Campos condicionales</strong> según tipo de cliente</li>
          <li>✅ <strong>Mensajes de error</strong> específicos por campo</li>
          <li>✅ <strong>Limpieza automática</strong> de datos</li>
          <li>✅ <strong>Prevención de errores</strong> de backend</li>
        </ul>
      </div>
    </div>
  );
};

export default ValidationExample; 