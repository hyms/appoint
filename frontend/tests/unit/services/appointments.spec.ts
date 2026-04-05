import { describe, it, expect, vi, beforeEach } from 'vitest'
import { appointmentsService } from '@/services/appointments'
import api from '@/services/api'

// Mock de api para simular llamadas HTTP
vi.mock('@/services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('Appointments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get all appointments', async () => {
    const mockData = [{ id: '1' }]
    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData })

    const result = await appointmentsService.getAll({ status: 'PENDING' })

    expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/appointments?status=PENDING'))
    expect(result).toEqual(mockData)
  })

  it('should get appointment by id', async () => {
    const mockData = { id: '1' }
    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: mockData })

    const result = await appointmentsService.getById('1')

    expect(api.get).toHaveBeenCalledWith('/appointments/1')
    expect(result).toEqual(mockData)
  })

  it('should create an appointment', async () => {
    const mockData = { professionalId: 'p1', slotId: 's1' }
    const result = { id: 'new-1' }
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: result })

    const response = await appointmentsService.create(mockData)

    expect(api.post).toHaveBeenCalledWith('/appointments', mockData)
    expect(response).toEqual(result)
  })

  it('should cancel an appointment', async () => {
    const result = { id: '1', status: 'CANCELLED' }
    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: result })

    const response = await appointmentsService.cancel('1', 'Reason')

    expect(api.post).toHaveBeenCalledWith('/appointments/1/cancel', { reason: 'Reason' })
    expect(response).toEqual(result)
  })
})
