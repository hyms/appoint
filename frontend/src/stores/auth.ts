import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export interface User {
  id: string
  email: string
  phone?: string
  role: 'ADMIN' | 'SECRETARY' | 'PATIENT' | 'PROFESSIONAL'
  isActive: boolean
  profile?: {
    firstName: string
    lastName: string
    dni?: string
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    try {
      const response = await api.post('/auth/login', { email, password })
      token.value = response.data.access_token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    try {
      const response = await api.post('/auth/register', data)
      token.value = response.data.access_token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function magicLink(phone: string) {
    try {
      const response = await api.post('/auth/magic-link', { phone })
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function validateMagicLink(token: string) {
    try {
      const response = await api.post('/auth/magic-link/validate', { token })
      token.value = response.data.access_token
      user.value = response.data.user
      localStorage.setItem('token', token.value)
      return response.data
    } catch (error) {
      throw error
    }
  }

  async function fetchCurrentUser() {
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      return response.data
    } catch (error) {
      logout()
      throw error
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
  }

  if (token.value) {
    fetchCurrentUser()
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    magicLink,
    validateMagicLink,
    fetchCurrentUser,
    logout
  }
})
