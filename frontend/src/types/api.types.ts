export type UserRole = 'ADMIN' | 'SECRETARY' | 'PATIENT' | 'PROFESSIONAL';

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  dni?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  medicalNotes?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedParams {
  page?: number;
  limit?: number;
}

export interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}
