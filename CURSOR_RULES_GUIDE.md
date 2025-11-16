# 📋 Guía de Reglas Globales de Cursor

## 🎯 ¿Qué son las Reglas Globales?

Las reglas globales en `.cursor/rules/global.mdc` son **instrucciones automáticas** que Cursor aplica en **todas las conversaciones** para mantener consistencia en el código.

---

## ✅ **Estado Actual**

**Archivo**: `.cursor/rules/global.mdc`  
**Estado**: ✅ Configurado y activo  
**Aplicación**: Automática (`alwaysApply: true`)

---

## 🔍 **Cómo Funcionan**

### **1. Aplicación Automática**

Las reglas se aplican automáticamente cuando:
- ✅ Usas Cursor Chat (Ctrl+L / Cmd+L)
- ✅ Usas Composer (Ctrl+I / Cmd+I)
- ✅ Usas cualquier función de IA en Cursor

**No necesitas hacer nada** - Cursor lee el archivo automáticamente.

### **2. Verificación**

Para verificar que las reglas están activas:

1. **Abre Cursor Chat** (Ctrl+L)
2. **Pregunta**: "¿Cuáles son las reglas de código para React?"
3. **Debería responder** con las reglas de `.cursor/rules/global.mdc`

---

## 📚 **Reglas Incluidas**

### **TypeScript (Frontend)**
- ✅ Funciones < 20 statements
- ✅ Componentes < 500 líneas
- ✅ Sin `any`, usar tipos explícitos
- ✅ Convenciones de nombres (PascalCase, camelCase, etc.)

### **Java (Backend)**
- ✅ Clases < 500 líneas, <10 métodos públicos
- ✅ Java 17+ features
- ✅ Stream API sobre loops
- ✅ DTOs en lugar de entidades

### **React Conventions**
- ✅ Componentes funcionales con hooks
- ✅ **SOLID Principles** aplicados
- ✅ **KISS** (Keep It Simple, Stupid)
- ✅ **Variables mantenibles** con nombres descriptivos
- ✅ Componentes < 500 líneas
- ✅ Funciones < 20 statements

### **Spring Boot**
- ✅ Anotaciones correctas (@Service, @Controller, etc.)
- ✅ Dependency injection por constructor
- ✅ DTOs con validación
- ✅ Manejo de errores con @ControllerAdvice

### **Testing**
- ✅ Backend: JUnit 5 + Mockito (≥80% cobertura)
- ✅ Frontend: Vitest + React Testing Library (≥70% cobertura)

### **Seguridad**
- ✅ Validación DTO como primera línea de defensa
- ✅ Spring Security para autenticación
- ✅ No almacenar datos sensibles en localStorage
- ✅ Sanitizar inputs del usuario

### **Proyecto Específico**
- ✅ SQL maestro único (`datos/00_gmarm_completo.sql`)
- ✅ Feature flags para migraciones
- ✅ No hardcodear valores (usar `configuracion_sistema`)
- ✅ Testing antes de push

---

## 🧪 **Prueba Rápida**

### **Test 1: Verificar que Cursor conoce las reglas**

**Pregunta en Cursor Chat:**
```
¿Cuál es el límite de líneas para componentes React?
```

**Respuesta esperada:**
```
Los componentes React deben tener menos de 500 líneas.
```

### **Test 2: Verificar aplicación de reglas**

**Pregunta en Cursor Chat:**
```
¿Cómo debo estructurar un componente React según las reglas del proyecto?
```

**Respuesta esperada:**
- Mencionar límite de 500 líneas
- Mencionar SOLID principles
- Mencionar variables mantenibles
- Mencionar KISS

### **Test 3: Verificar reglas de backend**

**Pregunta en Cursor Chat:**
```
¿Cuántas líneas máximo debe tener una clase Java?
```

**Respuesta esperada:**
```
Las clases Java deben tener menos de 500 líneas con menos de 10 métodos públicos.
```

---

## 📝 **Cómo Usar las Reglas**

### **Cuando pides código a Cursor:**

Las reglas se aplican automáticamente. Por ejemplo:

**Tu solicitud:**
```
Crea un componente React para mostrar una lista de clientes
```

**Cursor automáticamente:**
- ✅ Usará TypeScript con tipos explícitos
- ✅ Componente < 500 líneas
- ✅ Funciones < 20 statements
- ✅ Variables con nombres descriptivos
- ✅ Seguirá principios SOLID
- ✅ Código simple (KISS)
- ✅ Usará React Query para data fetching

### **Cuando revisas código:**

Las reglas ayudan a Cursor a sugerir mejoras:

**Tu solicitud:**
```
Revisa este componente y sugiere mejoras
```

**Cursor automáticamente verificará:**
- ✅ ¿Tiene < 500 líneas?
- ✅ ¿Las funciones tienen < 20 statements?
- ✅ ¿Sigue SOLID?
- ✅ ¿Las variables son mantenibles?
- ✅ ¿Es simple (KISS)?

---

## 🔧 **Troubleshooting**

### **Problema: Las reglas no se aplican**

**Solución 1: Verificar ubicación del archivo**
```bash
# El archivo debe estar en:
.cursor/rules/global.mdc
```

**Solución 2: Verificar formato**
```markdown
---
alwaysApply: true
---

[contenido de las reglas]
```

**Solución 3: Reiniciar Cursor**
- Cierra y vuelve a abrir Cursor
- Las reglas se cargan al inicio

**Solución 4: Verificar que el archivo existe**
```bash
# En PowerShell
Test-Path .cursor/rules/global.mdc
# Debe retornar: True
```

### **Problema: Cursor no responde según las reglas**

**Solución:**
1. Verifica que `alwaysApply: true` esté en el header
2. Pregunta explícitamente: "Según las reglas del proyecto, ¿cómo debo...?"
3. Si persiste, verifica que el archivo no tenga errores de sintaxis

---

## 📊 **Ejemplos de Aplicación**

### **Ejemplo 1: Crear Componente**

**Solicitud:**
```
Crea un componente para mostrar el perfil de usuario
```

**Cursor aplicará automáticamente:**
- ✅ TypeScript con interfaces
- ✅ Componente funcional con hooks
- ✅ < 500 líneas
- ✅ Variables descriptivas (`userProfile`, `isLoading`, `handleSave`)
- ✅ Separación de lógica (custom hooks si es necesario)
- ✅ Manejo de errores y loading states

### **Ejemplo 2: Crear Servicio Java**

**Solicitud:**
```
Crea un servicio para gestionar clientes
```

**Cursor aplicará automáticamente:**
- ✅ Anotación @Service
- ✅ Dependency injection por constructor
- ✅ DTOs en lugar de entidades
- ✅ Validación con @Valid
- ✅ Manejo de excepciones
- ✅ Clase < 500 líneas
- ✅ Métodos < 10 públicos

### **Ejemplo 3: Refactorizar Código**

**Solicitud:**
```
Refactoriza este componente que tiene 800 líneas
```

**Cursor automáticamente:**
- ✅ Identificará que excede 500 líneas
- ✅ Sugerirá dividir en componentes más pequeños
- ✅ Aplicará SOLID (Single Responsibility)
- ✅ Mantendrá variables mantenibles
- ✅ Simplificará código (KISS)

---

## 🎯 **Beneficios**

### **Para el Equipo:**
- ✅ **Consistencia** - Todo el código sigue las mismas reglas
- ✅ **Calidad** - Código más limpio y mantenible
- ✅ **Velocidad** - Cursor sugiere código que ya cumple las reglas
- ✅ **Menos Code Review** - Menos correcciones necesarias

### **Para el Proyecto:**
- ✅ **Código uniforme** - Fácil de entender para cualquier desarrollador
- ✅ **Menos bugs** - Reglas de seguridad y validación aplicadas
- ✅ **Mejor testing** - Cursor sugiere tests según las reglas
- ✅ **Documentación viva** - Las reglas son la documentación

---

## 📚 **Referencias**

- **Archivo de reglas**: `.cursor/rules/global.mdc`
- **Documentación del proyecto**: `AGENTS.md`
- **Cursor Rules Docs**: [Cursor Documentation](https://cursor.sh/docs)

---

## ✅ **Checklist de Verificación**

- [x] Archivo `.cursor/rules/global.mdc` existe
- [x] `alwaysApply: true` está configurado
- [x] Reglas incluyen TypeScript, Java, React, Spring Boot
- [x] Reglas incluyen SOLID, KISS, variables mantenibles
- [x] Reglas específicas del proyecto incluidas
- [ ] **Verificar que Cursor aplica las reglas** (hacer test)

---

**Última actualización**: 2025-11-13  
**Versión**: 1.0

