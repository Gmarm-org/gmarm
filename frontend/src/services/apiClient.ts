// Core HTTP client - token management + request function
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

let token: string | null = null;

export function setToken(newToken: string) {
  token = newToken;
  localStorage.setItem('authToken', newToken);
}

export function getToken(): string | null {
  if (!token) {
    token = localStorage.getItem('authToken');
  }
  return token;
}

export function clearToken() {
  token = null;
  localStorage.removeItem('authToken');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const t = getToken();
  if (t) {
    headers['Authorization'] = `Bearer ${t}`;
  }
  const activeRole = localStorage.getItem('activeRole');
  if (activeRole) {
    headers['X-Active-Role'] = activeRole;
  }
  return headers;
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  let headers = getAuthHeaders();

  // Si es FormData, NO incluir Content-Type (se establece automaticamente)
  if (options.body instanceof FormData) {
    const newHeaders: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      if (key.toLowerCase() !== 'content-type') {
        newHeaders[key] = value;
      }
    });
    headers = newHeaders;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (response.status === 401) {
      clearToken();
      window.location.href = '/login';
      throw new Error('Sesion expirada');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Error ${response.status}`) as any;
      error.response = response;
      error.responseData = errorData;
      error.status = response.status;
      throw error;
    }

    try {
      const jsonData = await response.json();
      return jsonData;
    } catch (parseError) {
      if (response.status >= 200 && response.status < 300) {
        const contentLength = response.headers.get('content-length');
        if (contentLength === '0' || contentLength === null) {
          return { success: true } as T;
        }
        console.warn('No se pudo parsear la respuesta JSON, pero el status es exitoso:', response.status);
        return { success: true } as T;
      }
      throw parseError;
    }
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
