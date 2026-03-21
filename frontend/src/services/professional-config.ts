import api from './api'

export interface WorkingHours {
  dayOfWeek: string
  startTime: string
  endTime: string
  isActive: boolean
}

export interface ProfessionalConfig {
  id: string
  professionalId: string
  slotDurationMinutes: number
  breakBetweenSlotsMinutes: number
  locationId?: string
  workingHours: WorkingHours[]
  location?: {
    id: string
    name: string
    address: string
  }
}

export const professionalConfigService = {
  async getMyConfig(): Promise<ProfessionalConfig> {
    const response = await api.get('/professional-config/my')
    return response.data
  },

  async updateMyConfig(data: {
    slotDurationMinutes?: number
    breakBetweenSlotsMinutes?: number
    locationId?: string
    workingHours?: WorkingHours[]
  }): Promise<ProfessionalConfig> {
    const response = await api.patch('/professional-config/my', data)
    return response.data
  },

  async getConfig(professionalId: string): Promise<ProfessionalConfig> {
    const response = await api.get(`/professional-config/${professionalId}`)
    return response.data
  },

  async updateConfig(professionalId: string, data: {
    slotDurationMinutes?: number
    breakBetweenSlotsMinutes?: number
    locationId?: string
    workingHours?: WorkingHours[]
  }): Promise<ProfessionalConfig> {
    const response = await api.patch(`/professional-config/${professionalId}`, data)
    return response.data
  }
}
