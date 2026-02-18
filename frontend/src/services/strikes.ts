import api from './api'

export interface Strike {
  id: string
  patientId: string
  professionalId: string
  reason: string
  resolution?: string
  strikeDate: string
  isActive: boolean
  blockedUntil?: string
  patient?: { email: string; profile?: { firstName: string; lastName: string } }
  professional?: { email: string; profile?: { firstName: string; lastName: string } }
}

export const strikesService = {
  // Get my strikes (as patient)
  async getMyStrikes(): Promise<Strike[]> {
    const response = await api.get('/strikes/my')
    return response.data
  },

  // Get strikes created by me (as professional)
  async getMyProfessionalStrikes(): Promise<Strike[]> {
    const response = await api.get('/strikes/professional/my')
    return response.data
  },

  // Get all strikes (admin/secretary)
  async getAllStrikes(filters?: { patientId?: string; professionalId?: string }): Promise<Strike[]> {
    const params = new URLSearchParams()
    if (filters?.patientId) params.append('patientId', filters.patientId)
    if (filters?.professionalId) params.append('professionalId', filters.professionalId)
    const response = await api.get(`/strikes?${params}`)
    return response.data
  },

  // Get strikes for specific patient
  async getPatientStrikes(patientId: string): Promise<Strike[]> {
    const response = await api.get(`/strikes/patient/${patientId}`)
    return response.data
  },

  // Create strike (professional/admin)
  async createStrike(data: { patientId: string; reason: string; appointmentId?: string }): Promise<Strike> {
    const response = await api.post('/strikes', data)
    return response.data
  },

  // Resolve strike
  async resolveStrike(strikeId: string, resolution: string): Promise<Strike> {
    const response = await api.post(`/strikes/${strikeId}/resolve`, { resolution })
    return response.data
  },

  // Check if patient is blocked with specific professional
  async checkBlocked(patientId: string, professionalId: string): Promise<{ blocked: boolean }> {
    const response = await api.get(`/strikes/check/${patientId}/${professionalId}`)
    return response.data
  },

  // Get my strike stats (professional)
  async getMyStats(): Promise<{ totalStrikes: number; activeStrikes: number; resolvedStrikes: number; resolutionRate: string }> {
    const response = await api.get('/strikes/stats/my')
    return response.data
  },

  // Cancel appointments for blocked patient
  async cancelAppointments(patientId: string, professionalId: string): Promise<{ cancelled: number; message: string }> {
    const response = await api.post(`/strikes/cancel-appointments/${patientId}/${professionalId}`)
    return response.data
  }
}
