import api from './api'

export interface User {
  id: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  profile?: {
    firstName: string
    lastName: string
    dni?: string
    dateOfBirth?: string
    address?: string
    emergencyContact?: string
    medicalNotes?: string
  }
}

export interface CreateUserDto {
  email: string
  password: string
  phone?: string
  firstName: string
  lastName: string
  dni?: string
  role?: string
}

export interface UpdateUserDto {
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  dni?: string
  role?: string
  isActive?: boolean
}

export const usersService = {
  async getAll(role?: string): Promise<User[]> {
    const params = role ? { role } : {}
    const response = await api.get('/auth/users', { params })
    return response.data
  },

  async getById(id: string): Promise<User> {
    const response = await api.get(`/auth/users/${id}`)
    return response.data
  },

  async create(data: CreateUserDto): Promise<User> {
    const response = await api.post('/auth/users', data)
    return response.data
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.put(`/auth/users/${id}`, data)
    return response.data
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/auth/users/${id}`)
  }
}
