import apiClient from './client';
import type { Customer } from '../types';

// Sunucudan tüm müşterileri çeker. GET /api/customers
export async function getCustomers(): Promise<Customer[]> {
  const { data } = await apiClient.get<Customer[]>('/customers');
  return data;
}

// Yeni bir müşteri oluşturur. POST /api/customers
// 'id' hariç her şeyi parametre olarak alıyoruz çünkü id'yi sunucu üretiyor.
export async function createCustomer(payload: Omit<Customer, 'id'>): Promise<Customer> {
  const { data } = await apiClient.post<Customer>('/customers', payload);
  return data;
}

// Var olan bir müşteriyi günceller. PUT /api/customers/{id}
// Partial<Customer> = Customer'ın alanlarının HEPSİ değil, istediğin kadarı
export async function updateCustomer(id: number, payload: Partial<Customer>): Promise<Customer> {
  const { data } = await apiClient.put<Customer>(`/customers/${id}`, payload);
  return data;
}

// Bir müşteriyi siler. DELETE /api/customers/{id}
export async function deleteCustomer(id: number): Promise<void> {
  await apiClient.delete(`/customers/${id}`);
}