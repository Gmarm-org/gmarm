import { request, setToken, clearToken } from './apiClient';
import type { LoginRequest, LoginResponse, User } from './types';

export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

export async function logout(): Promise<void> {
  await request('/api/auth/logout', { method: 'POST' });
  clearToken();
}

export async function refreshToken(): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/api/auth/refresh', { method: 'POST' });
  setToken(response.token);
  return response;
}

export async function getCurrentUser(): Promise<User> {
  return request<User>('/api/auth/me');
}

export async function getMe(): Promise<any> {
  return request<any>('/api/auth/me');
}

export async function getUserRolesFromAuth(): Promise<string[]> {
  try {
    const user = await getCurrentUser();
    return user.roles;
  } catch {
    return [];
  }
}

export async function hasRole(role: string): Promise<boolean> {
  const roles = await getUserRolesFromAuth();
  return roles.includes(role);
}

export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const userRoles = await getUserRolesFromAuth();
  return roles.some(role => userRoles.includes(role));
}
