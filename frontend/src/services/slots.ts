import api from './api'

export interface Slot {
  id: string
  professionalId: string
  locationId?: string
  date: string
  startTime: string
  endTime: string
  isBooked: boolean
  isBlocked: boolean
  blockReason?: string
}

export const slotsService = {
  async getAll(params?: { 
    page?: number; 
    limit?: number; 
    professionalId?: string; 
    date?: string; 
    isBooked?: boolean 
  }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId)
    if (params?.date) queryParams.append('date', params.date)
    if (params?.isBooked !== undefined) queryParams.append('isBooked', params.isBooked.toString())
    const response = await api.get(`/slots?${queryParams}`)
    return response.data
  },

  async getById(id: string): Promise<Slot> {
    const response = await api.get(`/slots/${id}`)
    return response.data
  },

  async update(id: string, data: { isBooked?: boolean; isBlocked?: boolean; blockReason?: string }) {
    const response = await api.patch(`/slots/${id}`, data)
    return response.data
  },

  async delete(id: string) {
    const response = await api.delete(`/slots/${id}`)
    return response.data
  },

  async generate(data: { professionalId: string; startDate: string; endDate: string; locationId?: string }) {
    const response = await api.post('/slots/generate', data)
    return response.data
  },

  async getAvailable(professionalId: string, date: string) {
    const response = await api.get(`/slots/available/${professionalId}?date=${date}`)
    return response.data
  },

  async getByProfessional(professionalId: string, startDate: string, endDate: string) {
    const response = await api.get(`/slots/professional/${professionalId}?startDate=${startDate}&endDate=${endDate}`)
    return response.data
  },

  async block(slotId: string, reason?: string) {
    const response = await api.post('/slots/block', { slotId, reason })
    return response.data
  },

  async unblock(slotId: string) {
    const response = await api.delete(`/slots/${slotId}/unblock`)
    return response.data
  }
}
