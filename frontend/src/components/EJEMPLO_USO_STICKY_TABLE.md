# 📋 Ejemplo de Uso: StickyTable

## ¿Qué es StickyTable?

Un componente reutilizable de tabla con columna de acciones que **siempre se mantiene visible** (sticky) en el lado derecho, sin importar el scroll horizontal.

---

## ✅ Beneficios

- ✅ **Columna de acciones siempre visible** - No necesitas hacer scroll para ver botones
- ✅ **Código más limpio** - Define columnas y acciones de forma declarativa
- ✅ **Reutilizable** - Mismo componente en todas las pantallas
- ✅ **Mantenible** - Cambios en un solo lugar afectan todas las tablas
- ✅ **Consistente** - Misma UX en toda la aplicación

---

## 📖 Uso Básico

### Antes (sin StickyTable):

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full divide-y divide-gray-200">
    <thead className="bg-gray-50">
      <tr>
        <th>ID</th>
        <th>Cliente</th>
        <th>Monto</th>
        <th>Estado</th>
        <th>Acciones</th> {/* Acciones ocultas con scroll */}
      </tr>
    </thead>
    <tbody>
      {data.map(item => (
        <tr key={item.id}>
          <td>{item.id}</td>
          <td>{item.cliente}</td>
          <td>{item.monto}</td>
          <td>{item.estado}</td>
          <td>
            <button onClick={() => handleEdit(item)}>Editar</button>
            <button onClick={() => handleDelete(item)}>Eliminar</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Después (con StickyTable):

```tsx
import { StickyTable } from '../../components/StickyTable';

<StickyTable
  data={pagos}
  columns={[
    {
      key: 'id',
      header: 'ID',
      render: (pago) => pago.id
    },
    {
      key: 'cliente',
      header: 'Cliente',
      render: (pago) => (
        <div>
          <div className="font-medium">{pago.cliente.nombres}</div>
          <div className="text-gray-500 text-xs">{pago.cliente.numeroIdentificacion}</div>
        </div>
      )
    },
    {
      key: 'monto',
      header: 'Monto Total',
      render: (pago) => `$${pago.montoTotal.toFixed(2)}`
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (pago) => (
        <span className={`px-2 py-1 text-xs rounded-full ${
          pago.estado === 'COMPLETADO' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {pago.estado}
        </span>
      )
    }
  ]}
  actions={[
    {
      label: 'Ver Cuotas',
      onClick: (pago) => handleVerCuotas(pago),
      className: 'text-blue-600 hover:text-blue-900',
      show: (pago) => pago.tipoPago === 'CREDITO' // Solo mostrar si es a crédito
    },
    {
      label: 'Ver Datos Factura',
      onClick: (pago) => handleVerDatosFactura(pago),
      className: 'text-green-600 hover:text-green-900'
    },
    {
      label: '📄 Cargar Factura',
      onClick: (pago) => handleCargarFactura(pago),
      className: 'text-purple-600 hover:text-purple-900'
    },
    {
      label: '📊 Descargar Excel',
      onClick: (pago) => exportarPagoDetalleAExcel(pago),
      className: 'text-green-700 hover:text-green-900'
    }
  ]}
  getRowKey={(pago) => pago.id}
  emptyMessage="No hay pagos registrados"
/>
```

---

## 🎯 Props del Componente

### `data: T[]`
Array de datos a mostrar en la tabla.

### `columns: Column<T>[]`
Definición de columnas:
```tsx
{
  key: string;           // ID único de la columna
  header: string | ReactNode;  // Encabezado (puede ser JSX)
  render: (item: T) => ReactNode;  // Función para renderizar la celda
  className?: string;    // Clases CSS opcionales para la celda
  headerClassName?: string; // Clases CSS opcionales para el encabezado
}
```

### `actions?: ActionButton<T>[]`
Botones de acción (opcional):
```tsx
{
  label: string | ReactNode;  // Texto o JSX del botón
  onClick: (item: T) => void; // Handler del click
  className?: string;         // Clases CSS opcionales
  show?: (item: T) => boolean; // Condición para mostrar (opcional)
}
```

### `getRowKey: (item: T) => string | number`
Función para obtener la key única de cada fila.

### `emptyMessage?: string`
Mensaje cuando no hay datos (default: "No hay datos para mostrar").

### `className?: string`
Clases CSS adicionales para el contenedor.

---

## 🔥 Ejemplos Avanzados

### Con Header Personalizado

```tsx
<StickyTable
  data={clientes}
  columns={[
    {
      key: 'nombre',
      header: (
        <div className="flex items-center gap-2">
          👤 Nombre Completo
        </div>
      ),
      render: (c) => `${c.nombres} ${c.apellidos}`
    }
  ]}
  // ...
/>
```

### Con Acciones Condicionales

```tsx
actions={[
  {
    label: 'Activar',
    onClick: (item) => handleActivar(item),
    show: (item) => !item.estado // Solo mostrar si está inactivo
  },
  {
    label: 'Desactivar',
    onClick: (item) => handleDesactivar(item),
    show: (item) => item.estado // Solo mostrar si está activo
  }
]}
```

### Con Estilos Personalizados por Columna

```tsx
columns={[
  {
    key: 'saldo',
    header: 'Saldo',
    render: (item) => `$${item.saldo.toFixed(2)}`,
    className: 'text-right font-bold text-green-600'
  }
]}
```

---

## 📝 Checklist de Migración

Para migrar una tabla existente a StickyTable:

1. ✅ Importar StickyTable
   ```tsx
   import { StickyTable } from '../../components/StickyTable';
   ```

2. ✅ Definir columnas como array de objetos
   ```tsx
   const columns = [...]
   ```

3. ✅ Definir acciones como array de objetos
   ```tsx
   const actions = [...]
   ```

4. ✅ Reemplazar `<table>` por `<StickyTable>`

5. ✅ Eliminar código HTML de tabla redundante

6. ✅ Verificar que funciona correctamente

7. ✅ Eliminar estilos sticky manuales si los había

---

## 🚀 Próximos Pasos

Aplicar StickyTable en:
- ✅ PagosFinanzas.tsx
- ⬜ ClientesAsignados.tsx
- ⬜ ClientManagement.tsx (Jefe Ventas)
- ⬜ ImportGroupManagement.tsx
- ⬜ WeaponManagement.tsx
- ⬜ ClientTable.tsx (Vendedor)
- ⬜ LicenseManagement.tsx (Admin)
- ⬜ AsignacionSeries.tsx
- ⬜ AdminDataTable.tsx
- ⬜ Operaciones.tsx
- ⬜ GrupoImportacionDetalle.tsx

---

**Última actualización:** Febrero 2026
