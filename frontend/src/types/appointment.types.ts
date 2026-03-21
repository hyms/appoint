import type { User, UserProfile } from './api.types';

export type AppointmentStatus = 
  | 'PENDING' 
  | 'CONFIRMED' 
  | 'VOICE_VERIFIED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED';

export interface Appointment {
  id: string;
  patientId: string;
  professionalId: string;
  locationId?: string;
  slotId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  qrPaymentUrl?: string;
  paymentStatus?: PaymentStatus;
  notificationSent24h: boolean;
  notificationSent6h: boolean;
  createdAt: string;
  updatedAt: string;
  patient?: User & { profile?: UserProfile };
  professional?: User & { profile?: UserProfile };
  location?: Location;
  slot?: Slot;
}

export interface CreateAppointmentDto {
  patientId: string;
  professionalId: string;
  slotId: string;
  locationId?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  patientId?: string;
  professionalId?: string;
  slotId?: string;
  locationId?: string;
  date?: string;
  notes?: string;
}

export interface UpdateAppointmentStatusDto {
  status: AppointmentStatus;
  notes?: string;
}

export interface CancelAppointmentDto {
  reason: string;
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  patientId?: string;
  professionalId?: string;
  startDate?: string;
  endDate?: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  phone?: string;
  isActive: boolean;
}

export interface Slot {
  id: string;
  professionalId: string;
  locationId?: string;
  date: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  isBlocked: boolean;
  blockReason?: string;
}
