import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../../services/api';

interface VerificationResponse {
  success: boolean;
  message: string;
  clienteId?: number;
  email?: string;
  nombres?: string;
  apellidos?: string;
  numeroIdentificacion?: string;
  tipoIdentificacion?: string;
  direccion?: string;
  provincia?: string;
  canton?: string;
  fechaNacimiento?: string;
  telefonoPrincipal?: string;
  telefonoSecundario?: string;
}

const VerifyPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verificando' | 'review' | 'success' | 'error' | 'datosIncorrectos'>('verificando');
  const [message, setMessage] = useState<string>('');
  const [clienteInfo, setClienteInfo] = useState<VerificationResponse | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get('token');

      if (!token) {
        setStatus('error');
        setMessage('No se proporcionó un token de verificación. Por favor, verifica el enlace del correo.');
        return;
      }

      try {
        // Primero obtener información del token sin verificar
        const tokenInfo = await apiService.getTokenInfo(token);
        
        if (tokenInfo.success === false) {
          setStatus('error');
          setMessage(tokenInfo.message || 'Error al obtener información del token');
          return;
        }

        // Mostrar datos para revisión antes de verificar
        setClienteInfo(tokenInfo as VerificationResponse);
        setStatus('review');
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        setStatus('error');
        
        // Mensajes más amigables según el tipo de error
        if (errorMessage.includes('Token de verificación inválido')) {
          setMessage('El enlace de verificación no es válido. Por favor, verifica que copiaste el enlace completo del correo.');
        } else if (errorMessage.includes('expirado')) {
          setMessage('El enlace de verificación ha expirado. Por favor, solicita un nuevo correo de verificación.');
        } else if (errorMessage.includes('ya fue utilizado')) {
          setMessage('Este enlace de verificación ya fue utilizado. Tu correo electrónico ya está verificado.');
        } else {
          setMessage(errorMessage || 'Error al verificar el correo electrónico. Por favor, intenta nuevamente.');
        }
      }
    };

    verifyEmail();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 px-8 py-12 text-center text-white">
            <div className="bg-white/20 p-4 rounded-full inline-block mb-4">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Verificación de Correo</h1>
            <p className="text-blue-100">GMARM - Sistema de Gestión</p>
          </div>

          {/* Content */}
          <div className="px-8 py-12">
            {status === 'verificando' && (
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-6"></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Verificando...</h2>
                <p className="text-gray-600">Por favor espera mientras verificamos tu correo electrónico.</p>
              </div>
            )}

            {status === 'review' && clienteInfo && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">Revisa tus Datos Personales</h2>
                <p className="text-gray-600 mb-6 text-center">
                  Por favor, verifica cuidadosamente que todos los siguientes datos sean correctos:
                </p>

                {/* Tabla de datos personales */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                    📋 Tus Datos Personales
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Nombres:</span>
                      <span className="text-gray-900 font-medium">{clienteInfo.nombres || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Apellidos:</span>
                      <span className="text-gray-900 font-medium">{clienteInfo.apellidos || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Tipo de Identificación:</span>
                      <span className="text-gray-900">{clienteInfo.tipoIdentificacion || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Número de Identificación:</span>
                      <span className="text-gray-900 font-medium">{clienteInfo.numeroIdentificacion || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Dirección:</span>
                      <span className="text-gray-900 text-right">{clienteInfo.direccion || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Provincia:</span>
                      <span className="text-gray-900">{clienteInfo.provincia || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Cantón:</span>
                      <span className="text-gray-900">{clienteInfo.canton || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Fecha de Nacimiento:</span>
                      <span className="text-gray-900">{clienteInfo.fechaNacimiento || 'No especificada'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-600 font-semibold">Teléfono Principal:</span>
                      <span className="text-gray-900">{clienteInfo.telefonoPrincipal || 'No especificado'}</span>
                    </div>
                    <div className="flex justify-between pb-2">
                      <span className="text-gray-600 font-semibold">Teléfono Secundario:</span>
                      <span className="text-gray-900">{clienteInfo.telefonoSecundario || 'No especificado'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-yellow-800 font-medium text-sm">
                    ⚠️ <strong>Importante:</strong> Si alguno de estos datos es incorrecto, haz clic en "Datos Incorrectos" y comunícate con el vendedor o la persona que gestionó tu compra.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={async () => {
                      const token = searchParams.get('token');
                      if (!token) {
                        setStatus('error');
                        setMessage('No se encontró el token de verificación');
                        return;
                      }

                      try {
                        console.log('🔄 Verificando token...', token);
                        const response = await apiService.verifyEmailToken(token);
                        console.log('📥 Respuesta del servidor:', response);
                        
                        if (response && response.success === true) {
                          setStatus('success');
                          setMessage(response.message || 'Correo electrónico verificado exitosamente');
                          setClienteInfo(response);
                          console.log('✅ Verificación exitosa');
                        } else {
                          // El backend retornó success: false
                          setStatus('error');
                          setMessage(response?.message || 'Error al verificar el correo electrónico. El servidor indicó que la verificación falló.');
                          console.error('❌ Verificación falló:', response);
                        }
                      } catch (error: any) {
                        console.error('❌ Error al verificar token:', error);
                        setStatus('error');
                        
                        // Extraer mensaje de error más descriptivo
                        let errorMessage = 'Error al verificar el correo electrónico';
                        if (error?.response?.data?.message) {
                          errorMessage = error.response.data.message;
                        } else if (error?.message) {
                          errorMessage = error.message;
                        } else if (typeof error === 'string') {
                          errorMessage = error;
                        }
                        
                        // Mensajes más amigables según el tipo de error
                        if (errorMessage.includes('Token de verificación inválido')) {
                          setMessage('El enlace de verificación no es válido. Por favor, verifica que copiaste el enlace completo del correo.');
                        } else if (errorMessage.includes('expirado')) {
                          setMessage('El enlace de verificación ha expirado. Por favor, solicita un nuevo correo de verificación.');
                        } else if (errorMessage.includes('ya fue utilizado')) {
                          setMessage('Este enlace de verificación ya fue utilizado. Tu correo electrónico ya está verificado.');
                        } else {
                          setMessage(errorMessage);
                        }
                      }
                    }}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg"
                  >
                    ✅ Confirmar - Todos los Datos son Correctos
                  </button>
                  
                  <button
                    onClick={() => setStatus('datosIncorrectos')}
                    className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-lg"
                  >
                    ❌ Datos Incorrectos
                  </button>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="bg-green-100 p-4 rounded-full inline-block mb-6">
                  <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">¡Verificación Exitosa!</h2>
                <p className="text-gray-600 mb-6">{message}</p>

                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 mb-6">
                  <p className="text-green-800 font-medium">
                    ✅ Tu correo electrónico y datos personales han sido verificados correctamente.
                  </p>
                  <p className="text-green-700 text-sm mt-2">
                    Ya puedes recibir notificaciones y actualizaciones sobre tu proceso de importación.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
                >
                  Volver al inicio
                </button>
              </div>
            )}

            {status === 'datosIncorrectos' && (
              <div className="text-center">
                <div className="bg-orange-100 p-4 rounded-full inline-block mb-6">
                  <svg className="w-16 h-16 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Datos Incorrectos</h2>
                
                <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6 mb-6">
                  <p className="text-orange-800 font-medium mb-4">
                    ⚠️ Has indicado que algunos de tus datos personales son incorrectos.
                  </p>
                  <p className="text-orange-700 text-sm mb-4">
                    Para corregir esta información, por favor <strong>comunícate directamente con el vendedor</strong> o la persona que gestionó tu compra de arma.
                  </p>
                  <p className="text-orange-700 text-sm">
                    Ellos podrán actualizar tus datos en el sistema y enviarte un nuevo correo de verificación.
                  </p>
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                  <p className="text-blue-800 font-semibold mb-2">📞 Información de Contacto:</p>
                  <p className="text-blue-700 text-sm">
                    Contacta con el vendedor que te atendió o revisa la información de contacto que te proporcionaron durante el proceso de compra.
                  </p>
                </div>

                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200"
                >
                  Volver al inicio
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="bg-red-100 p-4 rounded-full inline-block mb-6">
                  <svg className="w-16 h-16 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Error de Verificación</h2>
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                  <p className="text-red-800 font-medium mb-2">{message}</p>
                  <p className="text-red-700 text-sm">
                    Si el problema persiste, por favor contacta con el administrador del sistema.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-gray-700 transition-all duration-200"
                >
                  Volver al inicio
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-8 py-6 text-center border-t border-gray-200">
            <p className="text-sm text-gray-600">
              © 2024 GMARM - Sistema de Gestión de Armas
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyPage;

