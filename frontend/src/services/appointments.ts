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
  async getUpcoming() {
    const response = await api.get('/appointments/upcoming')
    return response.data
  },

  async getPatientAppointments(patientId: string) {
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

  async create(data: { professionalId: string; slotId: string; locationId?: string; notes?: string }) {
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

export const slotsService = {
  // Admin CRUD
  async getAll(params?: { page?: number; limit?: number; professionalId?: string; date?: string; isBooked?: boolean }) {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.professionalId) queryParams.append('professionalId', params.professionalId)
    if (params?.date) queryParams.append('date', params.date)
    if (params?.isBooked !== undefined) queryParams.append('isBooked', params.isBooked.toString())
    const response = await api.get(`/slots?${queryParams}`)
    return response.data
  },

  async getById(id: string) {
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

  // Existing methods
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

export const emergencyService = {
  async getStatus() {
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

  async getAffectedPatients() {
    const response = await api.get('/emergency/affected-patients')
    return response.data
  }
}

export const strikesService = {
  async getPatientStrikes(patientId: string) {
    const response = await api.get(`/strikes/patient/${patientId}`)
    return response.data
  },

  async getProfessionalStrikes() {
    const response = await api.get('/strikes/professional')
    return response.data
  },

  async create(patientId: string, reason: string) {
    const response = await api.post('/strikes', { patientId, reason })
    return response.data
  },

  async resolve(strikeId: string, resolution: string) {
    const response = await api.post(`/strikes/${strikeId}/resolve`, { resolution })
    return response.data
  },

  async checkBlocked(patientId: string, professionalId?: string) {
    const url = professionalId 
      ? `/strikes/check/${patientId}?professionalId=${professionalId}`
      : `/strikes/check/${patientId}`
    const response = await api.get(url)
    return response.data
  },

  async getStats() {
    const response = await api.get('/strikes/stats')
    return response.data
  }
}
