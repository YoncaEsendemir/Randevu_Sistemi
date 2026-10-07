import axios from 'axios';
import type { BusinessHours, Service } from '../types';

/**
 * Public booking için ayrı axios instance - Authorization header EKLEMEZ
 * (apiClient'ın request interceptor'ı token ekliyor, burada istemiyoruz).
 */
const publicClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api',
});

export interface PublicBusiness {
  name: string;
  slug: string;
  business_hours: BusinessHours;
}

export interface PublicShowResponse {
  business: PublicBusiness;
  services: Pick<Service, 'id' | 'name' | 'duration_minutes' | 'price'>[];
}

export async function fetchBusinessInfo(slug: string): Promise<PublicShowResponse> {
  const { data } = await publicClient.get<PublicShowResponse>(`/public/${slug}`);
  return data;
}

export async function fetchAvailableSlots(
  slug: string,
  date: string,
  serviceId: number,
): Promise<string[]> {
  const { data } = await publicClient.get<{ slots: string[] }>(
    `/public/${slug}/available-slots`,
    { params: { date, service_id: serviceId } },
  );
  return data.slots;
}

export interface BookPayload {
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  service_id: number;
  starts_at: string; // "YYYY-MM-DD HH:mm:ss"
  note?: string;
}

export interface BookResponse {
  message: string;
  sms_sent: boolean;
  appointment: {
    starts_at: string;
    ends_at: string;
    service: string;
  };
}

export async function createPublicBooking(
  slug: string,
  payload: BookPayload,
): Promise<BookResponse> {
  const { data } = await publicClient.post<BookResponse>(`/public/${slug}/book`, payload);
  return data;
}
