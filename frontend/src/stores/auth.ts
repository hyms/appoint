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
    const response = await api.post('/auth/login', { email, password })
    token.value = response.data.access_token
    user.value = response.data.user
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    return response.data
  }

  async function register(data: { email: string; password: string; firstName: string; lastName: string; phone?: string }) {
    const response = await api.post('/auth/register', data)
    token.value = response.data.access_token
    user.value = response.data.user
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    return response.data
  }

  async function magicLink(phone: string) {
    const response = await api.post('/auth/magic-link', { phone })
    return response.data
  }

  async function validateMagicLink(magicToken: string) {
    const response = await api.post('/auth/magic-link/validate', { token: magicToken })
    token.value = response.data.access_token
    user.value = response.data.user
    if (token.value) {
      localStorage.setItem('token', token.value)
    }
    return response.data
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

  async function initializeSession() {
    if (token.value) {
      await fetchCurrentUser()
    }
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
    logout,
    initializeSession
  }
})
