import api from './api'
import type { Slot } from '@/types/appointment.types'

export type { Slot }

export interface Appointment {
  id: string
  patientId: string
  professionalId: string
  locationId?: string
  slotId?: string
  date: string
  startTime: string
  endTime: string
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  notes?: string
  qrPaymentUrl?: string
  paymentStatus?: string
  patient?: { email: string; profile?: { firstName: string; lastName: string } }
  professional?: { email: string; profile?: { firstName: string; lastName: string } }
  location?: { name: string; address: string }
  slot?: Slot
}

export const appointmentsService = {
  async getAll(params?: { 
    page?: number; 
    limit?: number; 
    status?: string; 
    patientId?: string; 
    professionalId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.patientId) queryParams.append('patientId', params.patientId)
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    const response = await api.get(`/appointments?${queryParams}`)
    return response.data
  },

  async getById(id: string): Promise<Appointment> {
    const response = await api.get(`/appointments/${id}`)
    return response.data
  },

  async update(id: string, data: { patientId?: string; professionalId?: string; slotId?: string; locationId?: string; date?: string; notes?: string }) {
    const response = await api.patch(`/appointments/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    const response = await api.delete(`/appointments/${id}`)
    return response.data
  },

  async getMyAppointments(): Promise<Appointment[]> {
    const response = await api.get('/appointments/my')
    return response.data
  },

  async getUpcoming(): Promise<Appointment[]> {
    const response = await api.get('/appointments/upcoming')
    return response.data
  },

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const response = await api.get(`/appointments/patient/${patientId}`)
    return response.data
  },

  async getProfessionalAppointments(startDate?: string, endDate?: string) {
    const params = new URLSearchParams()
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    const response = await api.get(`/appointments/professional?${params}`)
    return response.data
  },

  async create(data: { professionalId: string; slotId: string; locationId?: string; notes?: string }): Promise<Appointment> {
    const response = await api.post('/appointments', data)
    return response.data
  },

  async updateStatus(id: string, status: string, notes?: string) {
    const response = await api.patch(`/appointments/${id}/status`, { status, notes })
    return response.data
  },

  async cancel(id: string, reason: string) {
    const response = await api.post(`/appointments/${id}/cancel`, { reason })
    return response.data
  }
}
