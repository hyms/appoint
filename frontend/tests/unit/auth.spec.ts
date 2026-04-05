import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import api from '@/services/api'

// Mocks globales para useOneSignal (las funciones espía)
const loginToOneSignalMock = vi.fn()
const logoutFromOneSignalMock = vi.fn()
const initOneSignalMock = vi.fn()

// Mock del módulo @/composables/useOneSignal
vi.mock('@/composables/useOneSignal', () => ({
  // Al mockear un composable, el factory debe devolver un objeto con la función mockeada
  useOneSignal: vi.fn(() => ({
    loginToOneSignal: loginToOneSignalMock,
    logoutFromOneSignal: logoutFromOneSignalMock,
    initOneSignal: initOneSignalMock,
  })),
}))

// Mock de api para simular llamadas HTTP
vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}))

describe('Auth Store', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    // Reiniciar Pinia y el store antes de cada test
    setActivePinia(createPinia())
    authStore = useAuthStore()

    // Limpiar localStorage
    localStorage.clear()

    // Reiniciar el estado de Pinia para el store de autenticación
    authStore.token = null
    authStore.user = null

    // Restablecer mocks de api
    vi.clearAllMocks()

    // Restablecer el estado de los spies de OneSignal para cada test
    loginToOneSignalMock.mockClear()
    logoutFromOneSignalMock.mockClear()
    initOneSignalMock.mockClear()
  })

  it('should login successfully', async () => {
    // Arrange
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'ADMIN',
    }
    const mockToken = 'mock-jwt-token'

    ;(api.post as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: { access_token: mockToken, user: mockUser },
    })

    // Act
    await authStore.login('test@example.com', 'password123')

    // Assert
    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    })
    expect(authStore.token).toBe(mockToken)
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe(mockToken)
    expect(loginToOneSignalMock).toHaveBeenCalledWith(mockUser.id)
  })

  it('should handle login error', async () => {
    // Arrange
    const errorMessage = 'Invalid credentials'
    ;(api.post as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { data: { message: errorMessage } },
    })

    // Act & Assert
    await expect(authStore.login('wrong@example.com', 'wrongpass')).rejects.toEqual(
      expect.objectContaining({
        response: { data: { message: errorMessage } },
      }),
    )
    expect(authStore.token).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(loginToOneSignalMock).not.toHaveBeenCalled()
  })

  it('should logout', async () => {
    // Arrange
    authStore.token = 'some-token'
    authStore.user = { id: 'user-123', email: 'a@b.com', role: 'PATIENT' }
    localStorage.setItem('token', 'some-token')

    // Act
    authStore.logout()

    // Assert
    expect(authStore.token).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(logoutFromOneSignalMock).toHaveBeenCalledOnce()
  })

  it('should initialize session with existing token', async () => {
    // Arrange
    const mockToken = 'existing-token'
    const mockUser = {
      id: 'user-456',
      email: 'existing@example.com',
      role: 'PROFESSIONAL',
    }
    localStorage.setItem('token', mockToken)
    authStore.token = mockToken // Explicitly set token in store

    ;(api.get as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      data: mockUser,
    })

    // Act
    await authStore.initializeSession()

    // Assert
    expect(authStore.token).toBe(mockToken)
    expect(authStore.user).toEqual(mockUser)
    expect(authStore.isAuthenticated).toBe(true)
    expect(api.get).toHaveBeenCalledWith('/auth/me')
    expect(loginToOneSignalMock).toHaveBeenCalledWith(mockUser.id)
  })

  it('should not initialize session without token', async () => {
    // Arrange
    localStorage.clear()
    authStore.token = null // Explicitly clear token in store

    // Act
    await authStore.initializeSession()

    // Assert
    expect(authStore.token).toBeNull()
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(api.get).not.toHaveBeenCalled()
    expect(loginToOneSignalMock).not.toHaveBeenCalled()
  })

  it('should handle fetchCurrentUser error during session initialization', async () => {
    // Arrange
    const mockToken = 'bad-token'
    localStorage.setItem('token', mockToken)
    authStore.token = mockToken // Explicitly set token in store

    ;(api.get as ReturnType<typeof vi.fn>).mockRejectedValueOnce({
      response: { status: 401 },
    })

    // Act
    await authStore.initializeSession()

    // Assert
    expect(authStore.token).toBeNull() // Should clear token on error
    expect(authStore.user).toBeNull()
    expect(authStore.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(logoutFromOneSignalMock).toHaveBeenCalledOnce()
  })
})

