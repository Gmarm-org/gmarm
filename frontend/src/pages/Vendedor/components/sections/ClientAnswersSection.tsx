import React from 'react';

interface ClientAnswersSectionProps {
  mode: 'create' | 'edit' | 'view';
  clientQuestions: any[];
  getAnswerForQuestion: (pregunta: string) => string;
  handleAnswerChange: (pregunta: string, respuesta: string, preguntaId?: number) => void;
  clienteBloqueado: boolean;
  motivoBloqueo: string;
  tipoClienteCodigo?: string; // Para identificar si es Deportista (DEP)
}

export const ClientAnswersSection: React.FC<ClientAnswersSectionProps> = ({
  mode,
  clientQuestions,
  getAnswerForQuestion,
  handleAnswerChange,
  clienteBloqueado,
  motivoBloqueo,
  tipoClienteCodigo
}) => {
  return (
    <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center mb-6">
        <div className="bg-purple-100 p-3 rounded-full mr-4">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Preguntas de Seguridad</h2>
      </div>

      {/* Advertencia de Cliente Bloqueado */}
      {clienteBloqueado && (
        <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-6">
          <div className="flex items-start">
            <div className="bg-red-100 p-2 rounded-full mr-4 mt-1">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">CLIENTE BLOQUEADO</h3>
              <p className="text-red-700 mb-3">
                <strong>Motivo:</strong> {motivoBloqueo}
              </p>
              <p className="text-red-600 text-sm">
                ⚠️ El cliente puede ser guardado pero NO podrá continuar con el proceso de selección de armas.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {clientQuestions.map((question) => {
          console.log('Rendering question:', { 
            id: question.id, 
            pregunta: question.pregunta, 
            tipoRespuesta: question.tipoRespuesta,
            currentValue: getAnswerForQuestion(question.pregunta),
            isViolenceQuestion: question.pregunta.includes('denuncias de violencia'),
            fullQuestion: question
          });
          return (
          <div key={question.id} className="bg-white p-4 rounded-xl border-2 border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">{question.pregunta}</h3>
                <div className="flex flex-wrap gap-2">
                  {question.obligatoria && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Obligatoria
                    </span>
                  )}
                  {question.tipoRespuesta === 'SI_NO' && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      SI/NO
                    </span>
                  )}
                  {question.bloquea_proceso && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Bloquea Proceso
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {mode === 'view' ? (
              <div className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-medium">
                {getAnswerForQuestion(question.pregunta) || 'Sin respuesta'}
              </div>
            ) : (
              question.tipoRespuesta === 'SI_NO' ? (
                <div className="space-y-3">
                  {/* Primer dropdown: SI/NO */}
                  <select
                    key={`${question.id}-${getAnswerForQuestion(question.pregunta)}`}
                    value={getAnswerForQuestion(question.pregunta)?.startsWith('SI') ? 'SI' : getAnswerForQuestion(question.pregunta)?.startsWith('NO') ? 'NO' : ''}
                    onChange={(e) => {
                      console.log('Dropdown SI/NO onChange triggered:', { 
                        question: question.pregunta, 
                        newValue: e.target.value,
                        currentValue: getAnswerForQuestion(question.pregunta)
                      });
                      
                      if (e.target.value === 'NO') {
                        // Si es NO, solo guardar NO
                        handleAnswerChange(question.pregunta, 'NO', question.id);
                      } else if (e.target.value === 'SI') {
                        // Si es SI, mantener el valor actual si ya tiene cantidad, o poner solo SI
                        const currentAnswer = getAnswerForQuestion(question.pregunta);
                        if (currentAnswer && currentAnswer.startsWith('SI')) {
                          handleAnswerChange(question.pregunta, currentAnswer, question.id);
                        } else {
                          handleAnswerChange(question.pregunta, 'SI', question.id);
                        }
                      }
                    }}
                    required={question.obligatoria}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                  >
                    <option value="">Seleccionar respuesta</option>
                    <option value="SI">Sí</option>
                    <option value="NO">No</option>
                  </select>

                  {/* Segundo dropdown: Cantidad de armas (solo si responde SI y es la pregunta de armas registradas) */}
                  {/* NO mostrar para Deportistas (DEP) ya que no tienen límite de armas */}
                  {getAnswerForQuestion(question.pregunta)?.startsWith('SI') && 
                   question.pregunta.toLowerCase().includes('armas registradas') &&
                   tipoClienteCodigo !== 'DEP' && (
                    <select
                      value={getAnswerForQuestion(question.pregunta)?.includes('1 arma') ? '1 arma' : 
                             getAnswerForQuestion(question.pregunta)?.includes('2 armas') ? '2 armas' : 
                             getAnswerForQuestion(question.pregunta)?.includes('más armas') ? 'más armas' : ''}
                      onChange={(e) => {
                        console.log('Dropdown cantidad onChange triggered:', { 
                          question: question.pregunta, 
                          newValue: e.target.value
                        });
                        
                        // Combinar SI con la cantidad seleccionada
                        const combinedAnswer = `SI, ${e.target.value}`;
                        handleAnswerChange(question.pregunta, combinedAnswer, question.id);
                      }}
                      required={question.obligatoria}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200"
                    >
                      <option value="">Seleccionar cantidad</option>
                      <option value="1 arma">1 arma</option>
                      <option value="2 armas">2 armas</option>
                      <option value="más armas">más armas</option>
                    </select>
                  )}
                  
                  {/* Advertencia cuando responde NO a cuenta en Sicoar */}
                  {getAnswerForQuestion(question.pregunta) === 'NO' && 
                   question.pregunta.toLowerCase().includes('cuenta en el sicoar') && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 mt-3">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3 flex-1">
                          <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                            ⚠️ Advertencia Importante
                          </h4>
                          <p className="text-sm text-yellow-700">
                            Debe crear una cuenta en el Sicoar y la dirección registrada debe coincidir con su domicilio actual. Esta información será enviada al correo electrónico del cliente cuando valide sus datos.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={getAnswerForQuestion(question.pregunta)}
                  onChange={(e) => handleAnswerChange(question.pregunta, e.target.value, question.id)}
                  required={question.obligatoria}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 transition-all duration-200 resize-none"
                  placeholder="Escriba su respuesta aquí..."
                />
              )
            )}
          </div>
        );
        })}
      </div>
      
      {/* Aviso de bloqueo por exceso de armas */}
      {clienteBloqueado && motivoBloqueo.includes('arma registrada') && (
        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                ⚠️ Cliente Bloqueado para Selección de Armas
              </h3>
              <p className="text-red-700 mb-3">
                {motivoBloqueo}
              </p>
              <p className="text-sm text-red-600 font-medium">
                El cliente puede ser guardado en el sistema, pero NO podrá continuar con la selección de armas hasta que se resuelva esta situación.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

