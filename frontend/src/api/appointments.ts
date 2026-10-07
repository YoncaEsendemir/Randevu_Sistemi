import apiClient from './client';
import type { Appointment, AppointmentStatus } from '../types';

export interface CreateAppointmentPayload {
  customer_id: number;
  service_id: number;
  starts_at: string;
  ends_at: string;
  note?: string;
}

export interface UpdateAppointmentPayload {
  customer_id?: number;
  service_id?: number;
  starts_at?: string;
  ends_at?: string;
  status?: AppointmentStatus;
  note?: string;
}

// customer ve service bilgisiyle BİRLİKTE gelir (backend load() ile ekliyordu)
export async function getAppointments(): Promise<Appointment[]> {
  const { data } = await apiClient.get<Appointment[]>('/appointments');
  return data;
}

// Backend çakışma bulursa 409 durum koduyla hata fırlatır;
// bu fonksiyon hatayı olduğu gibi yukarı (çağıran koda) iletir, kendi içinde yutmaz.
export async function createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
  const { data } = await apiClient.post<Appointment>('/appointments', payload);
  return data;
}

export async function updateAppointment(
  id: number,
  payload: UpdateAppointmentPayload,
): Promise<Appointment> {
  const { data } = await apiClient.put<Appointment>(`/appointments/${id}`, payload);
  return data;
}

export async function deleteAppointment(id: number): Promise<void> {
  await apiClient.delete(`/appointments/${id}`);
}