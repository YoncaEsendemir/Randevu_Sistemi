export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'staff';
  phone: string | null;
  slug?: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
}

export interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price: string | number;
  is_active: boolean;
}

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Appointment {
  id: number;
  customer_id: number;
  service_id: number;
  user_id: number;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  note: string | null;
  customer?: Customer;
  service?: Service;
  sms_sent?: boolean;
}

export type WeekDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface DayHours {
  is_open: boolean;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  break_start: string | null;
  break_end: string | null;
}

export type BusinessHours = Record<WeekDay, DayHours>;

export interface BusinessHoursResponse {
  business_hours: BusinessHours;
  editable: boolean;
}