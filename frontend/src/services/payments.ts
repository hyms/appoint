import api from './api'

export interface QRPayment {
  id: string
  appointmentId: string
  qrImageUrl: string
  status: 'PENDING' | 'UPLOADED' | 'VERIFIED' | 'REJECTED'
  uploadedAt?: string
  verifiedAt?: string
  verifiedBy?: string
}

export const paymentsService = {
  async uploadPayment(appointmentId: string, file: File): Promise<QRPayment> {
    const formData = new FormData()
    formData.append('qrImage', file)
    formData.append('appointmentId', appointmentId)
    
    const response = await api.post('/payments/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  },

  async getPaymentStatus(appointmentId: string): Promise<QRPayment | null> {
    const response = await api.get(`/payments/status/${appointmentId}`)
    return response.data
  },

  async getPaymentsList(filters?: { status?: string; patientId?: string }): Promise<QRPayment[]> {
    const params = new URLSearchParams()
    if (filters?.status) params.append('status', filters.status)
    if (filters?.patientId) params.append('patientId', filters.patientId)
    const response = await api.get(`/payments?${params}`)
    return response.data
  },

  async getMyPayments(): Promise<QRPayment[]> {
    const response = await api.get('/payments/my')
    return response.data
  },

  async verifyPayment(paymentId: string, status: 'VERIFIED' | 'REJECTED'): Promise<QRPayment> {
    const response = await api.post(`/payments/${paymentId}/verify`, { status })
    return response.data
  }
}
