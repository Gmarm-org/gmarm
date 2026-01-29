# ⚛️ **Frontend - GMARM Client**

Aplicación web construida con React 18, TypeScript y Tailwind CSS para el sistema de gestión de importación de armas.

---

## 📋 **Tabla de Contenidos**

- [Tecnologías](#-tecnologías)
- [Arquitectura](#-arquitectura)
- [Estructura de Carpetas](#-estructura-de-carpetas)
- [Componentes Principales](#-componentes-principales)
- [Custom Hooks](#-custom-hooks)
- [Servicios y APIs](#-servicios-y-apis)
- [Routing y Navegación](#-routing-y-navegación)
- [State Management](#-state-management)
- [Estilos y UI](#-estilos-y-ui)
- [Configuración de Entornos](#-configuración-de-entornos)
- [Testing](#-testing)
- [Build y Deploy](#-build-y-deploy)

---

## 🛠️ **Tecnologías**

- **React 18**: Librería de UI
- **TypeScript**: Type safety y mejor DX
- **Vite**: Build tool ultra-rápido con HMR
- **Tailwind CSS**: Framework de estilos utility-first
- **React Router v6**: Routing SPA
- **React Query (TanStack Query)**: Gestión de estado del servidor
- **Axios**: Cliente HTTP
- **Lucide React**: Iconos modernos y ligeros
- **date-fns**: Manipulación de fechas
- **Vitest**: Testing framework
- **React Testing Library**: Testing de componentes

---

## 🏗️ **Arquitectura**

### **Patrón Component-Service-API**

```
┌─────────────────┐
│   Component     │  ← UI Layer (JSX/TSX)
└────────┬────────┘
         │
┌────────▼────────┐
│  Custom Hook    │  ← Business Logic (useQuery, useMutation)
└────────┬────────┘
         │
┌────────▼────────┐
│  API Service    │  ← HTTP Layer (Axios)
└────────┬────────┘
         │
┌────────▼────────┐
│  Backend API    │  ← Spring Boot REST API
└─────────────────┘
```

### **Flujo de Datos**

**Lectura (Query):**
1. **Component** → Renderiza UI
2. **Custom Hook** → `useQuery()` de React Query
3. **API Service** → `axios.get()`
4. **Backend** → Retorna datos
5. **React Query** → Cachea y devuelve datos
6. **Component** → Re-renderiza con datos

**Escritura (Mutation):**
1. **Component** → Usuario interactúa (submit form)
2. **Custom Hook** → `useMutation()` de React Query
3. **API Service** → `axios.post/put/delete()`
4. **Backend** → Procesa y retorna resultado
5. **React Query** → Invalida cache, refetch
6. **Component** → Re-renderiza con nuevos datos

---

## 📁 **Estructura de Carpetas**

```
frontend/
├── public/                          # Assets públicos
│   ├── images/
│   │   └── weapons/                # Imágenes de armas
│   └── favicon.ico
│
├── src/
│   ├── components/                  # Componentes reutilizables
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx       # Formulario de login
│   │   │   └── ProtectedRoute.tsx  # HOC para proteger rutas
│   │   ├── common/
│   │   │   ├── Button.tsx          # Botón genérico
│   │   │   ├── Input.tsx           # Input genérico
│   │   │   ├── Modal.tsx           # Modal genérico
│   │   │   ├── Table.tsx           # Tabla genérica
│   │   │   ├── Pagination.tsx      # Paginación
│   │   │   └── LoadingSpinner.tsx  # Spinner de carga
│   │   ├── layout/
│   │   │   ├── Navbar.tsx          # Barra de navegación
│   │   │   ├── Sidebar.tsx         # Menú lateral
│   │   │   └── Layout.tsx          # Layout principal
│   │   └── forms/
│   │       ├── ClientForm.tsx      # Formulario de cliente
│   │       ├── WeaponForm.tsx      # Formulario de arma
│   │       └── SaleForm.tsx        # Formulario de venta
│   │
│   ├── pages/                       # Páginas/Vistas
│   │   ├── Auth/
│   │   │   ├── Login.tsx           # Página de login
│   │   │   └── Register.tsx        # Página de registro
│   │   ├── Dashboard/
│   │   │   ├── AdminDashboard.tsx  # Dashboard para ADMIN
│   │   │   └── VendedorDashboard.tsx  # Dashboard para VENDEDOR
│   │   ├── Admin/
│   │   │   ├── ClientManagement/
│   │   │   │   ├── ClientList.tsx
│   │   │   │   └── ClientFormModal.tsx
│   │   │   ├── WeaponManagement/
│   │   │   │   ├── WeaponList.tsx
│   │   │   │   └── WeaponFormModal.tsx
│   │   │   ├── SalesManagement/
│   │   │   │   ├── SalesList.tsx
│   │   │   │   └── SaleDetails.tsx
│   │   │   └── LicenseManagement/
│   │   │       ├── LicenseList.tsx
│   │   │       └── LicenseFormModal.tsx
│   │   └── Public/
│   │       ├── Catalog.tsx         # Catálogo público de armas
│   │       └── Home.tsx            # Página de inicio
│   │
│   ├── services/                    # Servicios y APIs
│   │   ├── api.ts                  # Configuración base de Axios
│   │   ├── authApi.ts              # Endpoints de autenticación
│   │   ├── clientApi.ts            # Endpoints de clientes
│   │   ├── weaponApi.ts            # Endpoints de armas
│   │   ├── salesApi.ts             # Endpoints de ventas
│   │   ├── paymentApi.ts           # Endpoints de pagos
│   │   ├── reservationApi.ts       # Endpoints de reservas
│   │   └── adminApi.ts             # Endpoints de admin (licencias, config)
│   │
│   ├── hooks/                       # Custom React Hooks
│   │   ├── useAuth.ts              # Hook de autenticación
│   │   ├── useClients.ts           # Hook para gestionar clientes
│   │   ├── useWeapons.ts           # Hook para gestionar armas
│   │   ├── useSales.ts             # Hook para gestionar ventas
│   │   ├── usePayments.ts          # Hook para gestionar pagos
│   │   ├── useReservations.ts      # Hook para gestionar reservas
│   │   ├── useClientCatalogs.ts    # Hook para catálogos (provincias, etc.)
│   │   └── usePagination.ts        # Hook para paginación
│   │
│   ├── types/                       # TypeScript Types e Interfaces
│   │   ├── auth.types.ts           # Tipos de autenticación
│   │   ├── client.types.ts         # Tipos de cliente
│   │   ├── weapon.types.ts         # Tipos de arma
│   │   ├── sale.types.ts           # Tipos de venta
│   │   ├── payment.types.ts        # Tipos de pago
│   │   └── common.types.ts         # Tipos comunes
│   │
│   ├── utils/                       # Utilidades
│   │   ├── validators.ts           # Funciones de validación
│   │   ├── formatters.ts           # Formateo de datos
│   │   ├── constants.ts            # Constantes globales
│   │   └── helpers.ts              # Funciones helper
│   │
│   ├── styles/                      # Estilos globales
│   │   └── index.css               # Tailwind imports + estilos custom
│   │
│   ├── App.tsx                      # Componente raíz
│   ├── main.tsx                     # Entry point
│   └── router.tsx                   # Configuración de rutas
│
├── env.local                        # Variables de entorno LOCAL
├── env.development                  # Variables de entorno DEV
├── .env.prod                        # Variables de entorno PROD (NO commitear)
├── .env.example                     # Ejemplo de variables de entorno
│
├── index.html                       # HTML template
├── package.json                     # Dependencias npm
├── tsconfig.json                    # Configuración TypeScript
├── tailwind.config.js               # Configuración Tailwind
├── vite.config.ts                   # Configuración Vite
└── vitest.config.ts                 # Configuración Vitest (testing)
```

---

## 🧩 **Componentes Principales**

### **Layout Components**

#### **Navbar** (`components/layout/Navbar.tsx`)
```tsx
interface NavbarProps {
  user: User | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  return (
    <nav className="bg-blue-600 text-white">
      <div className="container mx-auto flex justify-between items-center p-4">
        <Logo />
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </nav>
  );
};
```

#### **Sidebar** (`components/layout/Sidebar.tsx`)
```tsx
interface SidebarProps {
  role: 'ADMIN' | 'VENDEDOR' | 'CLIENTE';
}

export const Sidebar: React.FC<SidebarProps> = ({ role }) => {
  const menuItems = getMenuItemsByRole(role);
  
  return (
    <aside className="w-64 bg-gray-800 text-white">
      {menuItems.map(item => (
        <NavLink key={item.path} to={item.path}>
          {item.icon} {item.label}
        </NavLink>
      ))}
    </aside>
  );
};
```

### **Form Components**

#### **ClientForm** (`components/forms/ClientForm.tsx`)
```tsx
interface ClientFormProps {
  mode: 'create' | 'edit' | 'view';
  initialData?: Client;
  onSubmit: (data: ClientFormData) => void;
  onCancel: () => void;
}

export const ClientForm: React.FC<ClientFormProps> = ({
  mode,
  initialData,
  onSubmit,
  onCancel
}) => {
  const [formData, setFormData] = useState<ClientFormData>({});
  const { provincias, cantones } = useClientCatalogs();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validaciones
    onSubmit(formData);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campos del formulario */}
    </form>
  );
};
```

### **Table Components**

#### **ClientList** (`pages/Admin/ClientManagement/ClientList.tsx`)
```tsx
export const ClientList: React.FC = () => {
  const { data: clients, isLoading } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  
  if (isLoading) return <LoadingSpinner />;
  
  return (
    <div>
      <Table
        columns={[
          { key: 'numeroIdentificacion', label: 'Cédula/RUC' },
          { key: 'nombres', label: 'Nombres' },
          { key: 'apellidos', label: 'Apellidos' },
          { key: 'tipoCliente', label: 'Tipo' },
        ]}
        data={clients}
        onRowClick={(client) => setSelectedClient(client)}
      />
      
      {selectedClient && (
        <ClientFormModal
          mode="edit"
          client={selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </div>
  );
};
```

---

## 🎣 **Custom Hooks**

### **useAuth** (`hooks/useAuth.ts`)
```tsx
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  );
  
  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    setToken(response.token);
    setUser(response.user);
    localStorage.setItem('token', response.token);
  };
  
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
  };
  
  return { user, token, login, logout, isAuthenticated: !!token };
};
```

### **useClients** (`hooks/useClients.ts`)
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientApi } from '../services/clientApi';

export const useClients = () => {
  const queryClient = useQueryClient();
  
  // Obtener todos los clientes
  const { data, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: clientApi.getAll,
  });
  
  // Crear cliente
  const createMutation = useMutation({
    mutationFn: clientApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
  
  // Actualizar cliente
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClientFormData }) =>
      clientApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
  
  // Eliminar cliente
  const deleteMutation = useMutation({
    mutationFn: clientApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
  
  return {
    clients: data,
    isLoading,
    error,
    createClient: createMutation.mutate,
    updateClient: updateMutation.mutate,
    deleteClient: deleteMutation.mutate,
  };
};
```

### **useWeapons** (`hooks/useWeapons.ts`)
```tsx
export const useWeapons = (filters?: WeaponFilters) => {
  const { data, isLoading } = useQuery({
    queryKey: ['weapons', filters],
    queryFn: () => weaponApi.getAll(filters),
  });
  
  return {
    weapons: data,
    isLoading,
    disponibles: data?.filter(w => w.cantidadDisponible > 0),
  };
};
```

### **useClientCatalogs** (`hooks/useClientCatalogs.ts`)
```tsx
export const useClientCatalogs = () => {
  const { data: provincias } = useQuery({
    queryKey: ['provincias'],
    queryFn: clientApi.getProvincias,
  });
  
  const { data: cantones } = useQuery({
    queryKey: ['cantones'],
    queryFn: clientApi.getCantones,
  });
  
  const { data: tiposCliente } = useQuery({
    queryKey: ['tiposCliente'],
    queryFn: clientApi.getTiposCliente,
  });
  
  return { provincias, cantones, tiposCliente };
};
```

---

## 🌐 **Servicios y APIs**

### **API Base** (`services/api.ts`)
```tsx
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar JWT token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### **Auth API** (`services/authApi.ts`)
```tsx
export const authApi = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    return data;
  },
  
  register: async (userData: RegisterRequest): Promise<void> => {
    await apiClient.post('/auth/register', userData);
  },
  
  refreshToken: async (token: string): Promise<string> => {
    const { data } = await apiClient.post('/auth/refresh', { token });
    return data.token;
  },
};
```

### **Client API** (`services/clientApi.ts`)
```tsx
export const clientApi = {
  getAll: async (): Promise<Client[]> => {
    const { data } = await apiClient.get('/clientes');
    return data;
  },
  
  getById: async (id: number): Promise<Client> => {
    const { data } = await apiClient.get(`/clientes/${id}`);
    return data;
  },
  
  create: async (clientData: ClientFormData): Promise<Client> => {
    const { data } = await apiClient.post('/clientes', clientData);
    return data;
  },
  
  update: async (id: number, clientData: ClientFormData): Promise<Client> => {
    const { data } = await apiClient.put(`/clientes/${id}`, clientData);
    return data;
  },
  
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/clientes/${id}`);
  },
  
  getByTipoCliente: async (tipo: string): Promise<Client[]> => {
    const { data } = await apiClient.get(`/clientes/tipo/${tipo}`);
    return data;
  },
  
  getProvincias: async (): Promise<Provincia[]> => {
    const { data } = await apiClient.get('/ubicacion/provincias');
    return data;
  },
  
  getCantones: async (provinciaId?: number): Promise<Canton[]> => {
    const url = provinciaId
      ? `/ubicacion/cantones?provinciaId=${provinciaId}`
      : '/ubicacion/cantones';
    const { data } = await apiClient.get(url);
    return data;
  },
};
```

### **Sales API** (`services/salesApi.ts`)
```tsx
export const salesApi = {
  create: async (saleData: SaleFormData): Promise<Sale> => {
    const { data } = await apiClient.post('/ventas', saleData);
    return data;
  },
  
  getDocuments: {
    contrato: async (ventaId: number): Promise<Blob> => {
      const { data } = await apiClient.get(
        `/ventas/${ventaId}/documentos/contrato`,
        { responseType: 'blob' }
      );
      return data;
    },
    
    solicitudCompra: async (ventaId: number): Promise<Blob> => {
      const { data } = await apiClient.get(
        `/ventas/${ventaId}/documentos/solicitud-compra`,
        { responseType: 'blob' }
      );
      return data;
    },
    
    cotizacion: async (ventaId: number): Promise<Blob> => {
      const { data } = await apiClient.get(
        `/ventas/${ventaId}/documentos/cotizacion`,
        { responseType: 'blob' }
      );
      return data;
    },
  },
};
```

---

## 🛣️ **Routing y Navegación**

### **Router Configuration** (`router.tsx`)
```tsx
import { createBrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalog', element: <Catalog /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      
      // Rutas protegidas
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>,
      },
      {
        path: 'admin',
        element: <ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>,
        children: [
          { path: 'clients', element: <ClientManagement /> },
          { path: 'weapons', element: <WeaponManagement /> },
          { path: 'sales', element: <SalesManagement /> },
          { path: 'licenses', element: <LicenseManagement /> },
        ],
      },
    ],
  },
]);
```

### **ProtectedRoute Component** (`components/auth/ProtectedRoute.tsx`)
```tsx
interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  roles
}) => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (roles && !roles.includes(user.rol)) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, roles]);
  
  if (!isAuthenticated) return null;
  if (roles && !roles.includes(user.rol)) return null;
  
  return <>{children}</>;
};
```

---

## 🗂️ **State Management**

### **React Query (TanStack Query)**

**Configuración** (`main.tsx`):
```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>
);
```

**Uso en Componentes:**
```tsx
// Query (GET)
const { data, isLoading, error } = useQuery({
  queryKey: ['clients'],
  queryFn: clientApi.getAll,
});

// Mutation (POST/PUT/DELETE)
const mutation = useMutation({
  mutationFn: clientApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['clients'] });
  },
});
```

### **Local State con useState**
```tsx
const [isModalOpen, setIsModalOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);
const [formData, setFormData] = useState<FormData>({});
```

---

## 🎨 **Estilos y UI**

### **Tailwind CSS**

**Configuración** (`tailwind.config.js`):
```js
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

**Uso:**
```tsx
<button className="bg-primary-500 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded">
  Click me
</button>
```

### **Componentes Reutilizables**

**Button Component:**
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  onClick,
  children
}) => {
  const baseClasses = 'font-bold rounded transition-colors';
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-700 text-white',
    danger: 'bg-red-500 hover:bg-red-700 text-white',
  };
  const sizeClasses = {
    sm: 'py-1 px-2 text-sm',
    md: 'py-2 px-4',
    lg: 'py-3 px-6 text-lg',
  };
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

---

## ⚙️ **Configuración de Entornos**

### **Variables de Entorno**

**env.local** (desarrollo local):
```env
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:5173
```

**env.development** (servidor de desarrollo):
```env
VITE_API_URL=http://tu-servidor:8080/api
VITE_WS_URL=ws://tu-servidor:5173
```

**.env.prod** (producción, NO commitear):
```env
VITE_API_URL=https://api.produccion.com/api
VITE_WS_URL=wss://api.produccion.com
```

### **Uso en Código**
```tsx
const API_URL = import.meta.env.VITE_API_URL;
const WS_URL = import.meta.env.VITE_WS_URL;
```

---

## 🧪 **Testing**

### **Configuración** (`vitest.config.ts`)
```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});
```

### **Ejemplo de Test**
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### **Ejecutar Tests**
```bash
npm run test                # Run tests
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

---

## 🏗️ **Build y Deploy**

### **Desarrollo**
```bash
# Instalar dependencias
npm install

# Dev server (Hot reload)
npm run dev

# Linting
npm run lint
```

### **Producción**
```bash
# Build para producción
npm run build

# Preview del build
npm run preview
```

### **Docker**
```bash
# Build imagen
docker build -t gmarm-frontend .

# Con docker-compose
docker-compose -f docker-compose.local.yml build frontend_local

# Build sin cache
docker-compose -f docker-compose.local.yml build --no-cache frontend_local
```

---

## 📝 **Convenciones de Código**

### **Naming**
- **Componentes**: PascalCase (`ClientForm.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useClients.ts`)
- **Utilidades**: camelCase (`formatCurrency.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)

### **Estructura de Componentes**
```tsx
// 1. Imports
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types/Interfaces
interface MyComponentProps {
  id: number;
  onClose: () => void;
}

// 3. Component
export const MyComponent: React.FC<MyComponentProps> = ({ id, onClose }) => {
  // 3.1. Hooks
  const [state, setState] = useState();
  const { data } = useQuery(...);
  
  // 3.2. Handlers
  const handleClick = () => { };
  
  // 3.3. Effects
  useEffect(() => { }, []);
  
  // 3.4. Early returns
  if (!data) return <LoadingSpinner />;
  
  // 3.5. Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};
```

### **Clean Code**
- Máximo 500 líneas por componente
- Máximo 20 statements por función
- Extraer lógica compleja a custom hooks
- Usar composición sobre herencia
- Preferir funciones puras

---

## 🔗 **Links Útiles**

- **React**: https://react.dev/
- **TypeScript**: https://www.typescriptlang.org/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **React Query**: https://tanstack.com/query/latest
- **React Router**: https://reactrouter.com/
- **Vitest**: https://vitest.dev/

---

**Ver también:**
- [📚 README Principal](../README.md)
- [📚 Backend README](../backend/README.md)
- [🤖 AGENTS.md](../AGENTS.md)

---

**Última actualización**: Enero 2026
