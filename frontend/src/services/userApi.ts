import { request } from './apiClient';
import type { User } from './types';

export async function getUsers(page: number = 0, size: number = 10): Promise<any> {
  return request<any>(`/api/usuarios?page=${page}&size=${size}`);
}

export async function getUser(id: number): Promise<User> {
  return request<User>(`/api/usuarios/${id}`);
}

export async function createUser(userData: Partial<User>): Promise<User> {
  return request<User>('/api/usuarios', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function updateUser(id: number, userData: Partial<User>): Promise<User> {
  return request<User>(`/api/usuarios/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}

export async function deleteUser(id: number): Promise<void> {
  await request(`/api/usuarios/${id}`, { method: 'DELETE' });
}

export async function getVendedores(): Promise<User[]> {
  return request<User[]>('/api/usuarios/vendedores');
}

export async function getUserRolesByUserId(userId: number): Promise<any[]> {
  return request<any[]>(`/api/usuarios/${userId}/roles`);
}

export async function assignRoles(userId: number, roleIds: number[]): Promise<void> {
  await request(`/api/usuarios/${userId}/roles`, {
    method: 'POST',
    body: JSON.stringify(roleIds),
  });
}

export async function removeUserRole(userId: number, roleId: number): Promise<void> {
  await request(`/api/usuarios/${userId}/roles/${roleId}`, { method: 'DELETE' });
}
