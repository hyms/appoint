import api from './api'

export interface EmergencyStatus {
  isActive: boolean
  message?: string
  activatedAt?: string
  deactivatedAt?: string
}

export interface AffectedPatient {
  id: string
  email: string
  profile?: { firstName: string; lastName: string }
}

export const emergencyService = {
  async getStatus(): Promise<EmergencyStatus> {
    const response = await api.get('/emergency/status')
    return response.data
  },

  async activate(message: string, affectedDays?: number) {
    const response = await api.post('/emergency/activate', { message, affectedDays })
    return response.data
  },

  async deactivate(reason: string) {
    const response = await api.post('/emergency/deactivate', { reason })
    return response.data
  },

  async getAffectedPatients(): Promise<AffectedPatient[]> {
    const response = await api.get('/emergency/affected-patients')
    return response.data
  }
}
