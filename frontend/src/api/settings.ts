import apiClient from './client';
import type { BusinessHours, BusinessHoursResponse } from '../types';

// GET /settings/business-hours - mevcut çalışma saatlerini + yazma yetkisini döner.
export async function fetchBusinessHours(): Promise<BusinessHoursResponse> {
  const { data } = await apiClient.get<BusinessHoursResponse>('/settings/business-hours');
  return data;
}

// PUT /settings/business-hours - sadece admin kullanabilir, aksi halde 403.
export async function updateBusinessHours(
  businessHours: BusinessHours,
): Promise<BusinessHoursResponse> {
  const { data } = await apiClient.put<BusinessHoursResponse>('/settings/business-hours', {
    business_hours: businessHours,
  });
  return data;
}
