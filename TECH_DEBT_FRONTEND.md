# 🔧 Deuda Técnica - Frontend (React + TypeScript)

## 📋 Documento de Deuda Técnica y Mejoras Pendientes

**Proyecto**: GMARM - Sistema de Gestión de Armas  
**Fecha de Creación**: 9 de Noviembre, 2025
**Última Actualización**: 13 de Febrero, 2026

---

## 🚨 Problemas Críticos

### 1. 🟡 ClientForm.tsx - Componente Grande (1,843 líneas)

**Ubicación**: `frontend/src/pages/Vendedor/components/ClientForm.tsx`

**Progreso**: Reducido de 2,623 → 1,843 líneas (refactorización parcial)

**Problema actual**:
- 🟡 **1,843 líneas** — mejor que antes pero aún por encima del límite de 500
- 🟡 Aún mezcla lógica de negocio, UI, validaciones y estado
- 🟡 Dificulta testing unitario

**Impacto**:
- 🟡 **Medio** - Funcional pero dificulta mantenimiento
- La reducción de ~800 líneas ayudó pero la estructura interna aún necesita modularización

**Estado**: 🟡 Parcialmente resuelto — requiere split en hooks + sub-componentes

---

## 📐 Plan de Refactorización: ClientForm

### Objetivo
Reducir `ClientForm.tsx` de **2,623 líneas → ~400 líneas** mediante modularización.

### Estructura Propuesta

```
frontend/src/pages/Vendedor/components/
├── ClientForm/
│   ├── index.tsx                          (~400 líneas) ✅ Componente principal
│   ├── types.ts                           (~50 líneas)  ✅ Interfaces y tipos
│   │
│   ├── hooks/                             [Custom Hooks para lógica]
│   │   ├── useClientForm.ts              (~150 líneas) - Estado y lógica principal del formulario
│   │   ├── useClientQuestions.ts         (~100 líneas) - Gestión de preguntas dinámicas
│   │   ├── useClientDocuments.ts         (~150 líneas) - Carga y validación de documentos
│   │   └── useProvinciasCantons.ts       (~80 líneas)  - Gestión de provincias y cantones
│   │
│   ├── utils/                             [Utilidades puras]
│   │   ├── validators.ts                  (~100 líneas) - Validaciones específicas del formulario
│   │   └── formatters.ts                  (~50 líneas)  - Formateadores de datos
│   │
│   └── components/                        [Sub-componentes]
│       ├── PersonalDataSection.tsx        (~200 líneas) - Sección datos personales
│       ├── CompanyDataSection.tsx         (~200 líneas) - Sección datos de empresa
│       ├── MilitaryDataSection.tsx        (~150 líneas) - Sección datos militares
│       ├── DocumentsSection.tsx           (~200 líneas) - Sección de documentos
│       ├── QuestionsSection.tsx           (~150 líneas) - Sección de preguntas dinámicas
│       └── WeaponSummarySection.tsx       (~200 líneas) - Resumen de arma seleccionada
```

### Desglose Detallado

#### 1. **types.ts** - Tipos e Interfaces
```typescript
// Centralizar todos los tipos del formulario
- ClientFormData
- RespuestaFormulario
- ClientFormProps
- DocumentUploadState
- ValidationErrors
```

#### 2. **hooks/useClientForm.ts** - Lógica Principal
**Responsabilidades**:
- Gestión del estado principal del formulario
- Función `handleInputChange`
- Función `handleSubmit`
- Validaciones generales
- Integración con API

**Exporta**:
```typescript
{
  formData,
  setFormData,
  handleInputChange,
  handleSubmit,
  validateForm,
  isLoading,
  errors
}
```

#### 3. **hooks/useClientQuestions.ts** - Preguntas Dinámicas
**Responsabilidades**:
- Cargar preguntas según tipo de cliente
- Gestionar respuestas de preguntas
- Validar respuestas obligatorias

**Exporta**:
```typescript
{
  clientQuestions,
  respuestas,
  handleRespuestaChange,
  validateQuestions
}
```

#### 4. **hooks/useClientDocuments.ts** - Gestión de Documentos
**Responsabilidades**:
- Cargar documentos requeridos
- Gestionar upload de archivos
- Validar documentos obligatorios
- Eliminar documentos

**Exporta**:
```typescript
{
  requiredDocuments,
  uploadedDocuments,
  loadedDocuments,
  handleFileChange,
  handleDeleteDocument,
  validateDocuments,
  documentStatus
}
```

#### 5. **hooks/useProvinciasCantons.ts** - Ubicaciones
**Responsabilidades**:
- Cargar lista de provincias
- Cargar cantones por provincia
- Gestionar provincias/cantones de empresa

**Exporta**:
```typescript
{
  provincias,
  availableCantons,
  availableCantonsEmpresa,
  loadCantons
}
```

#### 6. **utils/validators.ts** - Validaciones Específicas
**Funciones**:
```typescript
- validatePersonalData(formData): ValidationResult
- validateCompanyData(formData): ValidationResult
- validateMilitaryData(formData): ValidationResult
- getBorderColor(fieldName, value): string
- getMaxLength(tipoIdentificacion): number
```

#### 7. **utils/formatters.ts** - Formateadores
**Funciones**:
```typescript
- formatTelefono(telefono): string
- formatIdentificacion(identificacion): string
- formatCurrency(amount): string
- getNombreTipoIdentificacion(codigo): string
```

#### 8. **components/PersonalDataSection.tsx**
**Campos**:
- Tipo de Cliente
- Tipo de Identificación
- Número de Identificación
- Nombres, Apellidos
- Email
- Teléfonos (principal, secundario)
- Fecha de Nacimiento
- Dirección, Provincia, Cantón

#### 9. **components/CompanyDataSection.tsx**
**Campos** (Solo si es Compañía):
- RUC
- Nombre de Empresa
- Representante Legal
- Dirección Fiscal
- Provincia Empresa, Cantón Empresa
- Correo Empresa
- Teléfono Referencia

#### 10. **components/MilitaryDataSection.tsx**
**Campos** (Solo si es Uniformado):
- Estado Militar
- Código ISSFA
- Rango (Opcional)
- Advertencia de validación ISSFA

#### 11. **components/DocumentsSection.tsx**
**Funcionalidad**:
- Lista de documentos requeridos
- Upload de archivos
- Vista previa de documentos
- Eliminación de documentos
- Validación de documentos obligatorios

#### 12. **components/QuestionsSection.tsx**
**Funcionalidad**:
- Renderizado dinámico de preguntas
- Inputs según tipo (text, number, date, etc.)
- Validación de respuestas obligatorias

#### 13. **components/WeaponSummarySection.tsx**
**Funcionalidad** (Solo si hay arma seleccionada):
- Resumen de arma seleccionada
- Precio modificado
- Cantidad
- Cálculo de IVA
- Total a pagar
- Botón para cambiar arma

---

## 🎯 Beneficios de la Refactorización

### Inmediatos
- ✅ **Legibilidad**: Cada archivo tiene responsabilidad única
- ✅ **Mantenibilidad**: Fácil localizar y modificar funcionalidad
- ✅ **Testing**: Cada módulo es testeable independientemente
- ✅ **Reutilización**: Hooks y utilidades reutilizables
- ✅ **Clean Code**: Cumple con máximo 500 líneas por archivo

### A Largo Plazo
- ✅ **Escalabilidad**: Fácil agregar nuevas secciones
- ✅ **Onboarding**: Nuevos devs entienden el código rápidamente
- ✅ **Performance**: Lazy loading de componentes pesados
- ✅ **Debugging**: Errores más fáciles de rastrear
- ✅ **Colaboración**: Múltiples devs pueden trabajar sin conflictos

---

## 📅 Plan de Implementación

### Fase 1: Preparación (1 día)
- [ ] Crear estructura de carpetas
- [ ] Crear archivos `types.ts`
- [ ] Documentar dependencias actuales

### Fase 2: Hooks (2-3 días)
- [ ] Implementar `useClientForm.ts`
- [ ] Implementar `useClientQuestions.ts`
- [ ] Implementar `useClientDocuments.ts`
- [ ] Implementar `useProvinciasCantons.ts`
- [ ] Testing de hooks

### Fase 3: Utilidades (1 día)
- [ ] Implementar `validators.ts`
- [ ] Implementar `formatters.ts`
- [ ] Testing de utilidades

### Fase 4: Componentes (3-4 días)
- [ ] Implementar `PersonalDataSection.tsx`
- [ ] Implementar `CompanyDataSection.tsx`
- [ ] Implementar `MilitaryDataSection.tsx`
- [ ] Implementar `DocumentsSection.tsx`
- [ ] Implementar `QuestionsSection.tsx`
- [ ] Implementar `WeaponSummarySection.tsx`

### Fase 5: Integración (2 días)
- [ ] Integrar todos los componentes en `index.tsx`
- [ ] Testing de integración
- [ ] Verificar que toda funcionalidad existente funcione

### Fase 6: Testing y QA (2 días)
- [ ] Testing completo en todos los flujos
- [ ] Corrección de bugs
- [ ] Optimización de performance

### Fase 7: Limpieza (1 día)
- [ ] Eliminar archivo monolítico original
- [ ] Actualizar imports en otros archivos
- [ ] Documentación final

**Tiempo Estimado Total**: 12-14 días de desarrollo

---

## 📊 Métricas

### Estado Actual (Feb 2026)
| Métrica | Antes | Ahora | Objetivo |
|---------|-------|-------|----------|
| Líneas de código | 2,623 | 1,843 | < 400 |
| Archivos | 1 | 1 | 14 |
| Testeable | ❌ | ❌ | ✅ |
| Mantenible | ❌ | 🟡 Parcial | ✅ |

---

## ✅ Deuda Técnica Resuelta (Feb 2026)

### api.ts Monolítico — RESUELTO
**Antes**: `api.ts` (2,001 líneas) + `adminApi.ts` (1,014 líneas) — todo en 2 archivos monolíticos.

**Después**: Split en 14 módulos por dominio:
```
services/
├── apiClient.ts       (instancia axios + interceptors)
├── api.ts             (barrel re-export, compatibilidad)
├── authApi.ts, clientApi.ts, weaponApi.ts, paymentApi.ts,
├── licenseApi.ts, importGroupApi.ts, documentApi.ts,
├── contractApi.ts, catalogApi.ts, configApi.ts, userApi.ts
└── types.ts           (tipos compartidos)
```

### Archivo backup eliminado
- ✅ Eliminado `useVendedorLogic.backup.ts` (1,274 líneas sin referencias)

---

## 🔄 Deuda Técnica Pendiente

### 2. 🟡 Componentes Grandes Pendientes de Split

| Componente | Líneas | Plan |
|-----------|--------|------|
| ClientForm.tsx | 1,843 | Split en hooks + sub-componentes |
| JefeVentas.tsx | 962 | Split en views + hooks (planificado) |
| WeaponReserve.tsx | 927 | Evaluar split |
| Vendedor.tsx | 920 | Evaluar split |
| PagosFinanzas.tsx | 687 | Split en hooks + modales (planificado) |

**Prioridad**: 🟡 Media

---

### 3. 🟡 Validaciones Duplicadas

**Ubicación**: Múltiples componentes

**Problema**:
- Validaciones de identificación, teléfono, email duplicadas
- Lógica de validación mezclada con UI

**Solución Propuesta**:
- ✅ Ya implementado: `frontend/src/utils/validations.ts`
- Pendiente: Usar consistentemente en todos los formularios

**Prioridad**: 🟡 Media

---

### 4. 🟡 Hardcodeo de Valores de Negocio

**Ubicación**: Varios archivos del frontend

**Problema**:
- IVA con fallback hardcodeado `|| 15` o `0.15` en múltiples lugares
- Valores que deberían venir exclusivamente de `configuracion_sistema`

**Archivos Afectados** (actualizado Feb 2026):
```
- PagosFinanzas.tsx:220,369       (fallback || 15)
- useVendedorExport.ts:88-89,95  (fallback 0.15 y * 1.15)
- useJefeVentasExport.ts:87-88,94 (fallback 0.15 y * 1.15)
- useConfiguracion.ts:48-49       (fallback aceptable como último recurso)
```

**Solución**:
- ✅ Ya implementado: Hook `useIVA()` en `useConfiguracion.ts`
- Pendiente: Refactorizar archivos de export para usar el hook y pasar IVA como parámetro

**Prioridad**: 🟡 Media

---

### 5. 🟢 Falta de Tests Unitarios

**Problema**:
- No hay tests para componentes críticos
- No hay tests para validaciones
- No hay tests para hooks personalizados

**Solución Propuesta**:
```
frontend/src/
├── __tests__/
│   ├── components/
│   │   ├── ClientForm.test.tsx
│   │   └── ...
│   ├── hooks/
│   │   ├── useClientForm.test.ts
│   │   └── ...
│   └── utils/
│       ├── validations.test.ts
│       └── ...
```

**Prioridad**: 🟢 Baja (pero importante)

---

### 6. 🟢 Optimización de Performance

**Problema**:
- Bundle de JavaScript > 1 MB
- No hay code splitting
- No hay lazy loading de rutas

**Solución Propuesta**:
```typescript
// Implementar lazy loading
const ClientForm = lazy(() => import('./pages/Vendedor/components/ClientForm'));
const AdminPanel = lazy(() => import('./pages/Admin'));

// Code splitting por rutas
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/vendedor" element={<ClientForm />} />
    <Route path="/admin" element={<AdminPanel />} />
  </Routes>
</Suspense>
```

**Prioridad**: 🟢 Baja

---

### 7. 🟡 Gestión de Estado Global

**Problema**:
- Múltiples contexts con responsabilidades mezcladas
- Props drilling en componentes profundos
- Re-renders innecesarios

**Solución Propuesta**:
- Considerar usar Zustand o Redux Toolkit
- Implementar memoization con `useMemo` y `useCallback`
- Optimizar contextos

**Prioridad**: 🟡 Media

---

## 📚 Recursos y Referencias

### Clean Code - Frontend
- ✅ Máximo 500 líneas por archivo/componente
- ✅ Un componente = Una responsabilidad
- ✅ Separar lógica de presentación (Hooks + Components)
- ✅ Nombres descriptivos y específicos
- ✅ Evitar props drilling (max 3 niveles)

### Estructura Recomendada
```
Component/
├── index.tsx          - Componente principal
├── types.ts           - Tipos e interfaces
├── styles.ts          - Estilos (si aplica)
├── hooks/             - Custom hooks
├── utils/             - Utilidades puras
└── components/        - Sub-componentes
```

### Testing
- Jest + React Testing Library
- Coverage mínimo: 70%
- Tests unitarios + integración

---

## ✅ Checklist de Implementación

### Pre-requisitos
- [ ] Backup del código actual
- [ ] Branch dedicado: `refactor/client-form-modularization`
- [ ] Comunicación con equipo sobre cambios

### Durante Implementación
- [ ] Mantener funcionalidad existente intacta
- [ ] Agregar tests para cada módulo nuevo
- [ ] Documentar cambios en CHANGELOG.md
- [ ] Code review por pares

### Post-implementación
- [ ] Testing exhaustivo en staging
- [ ] Actualizar documentación
- [ ] Capacitar al equipo sobre nueva estructura
- [ ] Monitorear errores en producción

---

## 🎓 Lecciones Aprendidas

### Lo que NO hacer:
- ❌ Archivos con más de 500 líneas
- ❌ Mezclar múltiples responsabilidades
- ❌ Duplicar código de validación
- ❌ Hardcodear valores de negocio
- ❌ Componentes sin tests

### Lo que SÍ hacer:
- ✅ Componentes pequeños y reutilizables
- ✅ Custom hooks para lógica compartida
- ✅ Utilidades puras y testeables
- ✅ Configuración desde backend
- ✅ Tests desde el inicio

---

## 📞 Contacto y Responsables

**Propietario de Deuda Técnica**: Equipo de Desarrollo Frontend  
**Revisión**: Mensual  
**Actualización**: Al identificar nuevos problemas

---

## 🔖 Versiones del Documento

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-11-09 | Documento inicial - Identificación de ClientForm.tsx como deuda técnica crítica |
| 1.1 | 2026-02-13 | Actualizar estado: api.ts split resuelto, ClientForm reducido, agregar componentes grandes pendientes, actualizar archivos afectados por IVA |

---

**Nota**: Este documento debe actualizarse conforme se resuelva deuda técnica o se identifiquen nuevos problemas.

