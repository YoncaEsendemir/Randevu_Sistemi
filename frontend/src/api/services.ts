import apiClient from './client';
import type { Service } from '../types';

export async function getServices(): Promise<Service[]> {
  const { data } = await apiClient.get<Service[]>('/services');
  return data;
}

export async function createService(payload: Omit<Service, 'id'>): Promise<Service> {
  const { data } = await apiClient.post<Service>('/services', payload);
  return data;
}

export async function updateService(id: number, payload: Partial<Service>): Promise<Service> {
  const { data } = await apiClient.put<Service>(`/services/${id}`, payload);
  return data;
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`);
}