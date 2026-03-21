import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export type UserRole = 'ADMIN' | 'SECRETARY' | 'PATIENT' | 'PROFESSIONAL'

export enum Permission {
  VIEW_ALL_APPOINTMENTS = 'VIEW_ALL_APPOINTMENTS',
  MANAGE_ALL_APPOINTMENTS = 'MANAGE_ALL_APPOINTMENTS',
  BOOK_FOR_OTHERS = 'BOOK_FOR_OTHERS',
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_PAYMENTS = 'MANAGE_PAYMENTS',
  MANAGE_STRIKES = 'MANAGE_STRIKES',
  SEND_NOTIFICATIONS = 'SEND_NOTIFICATIONS',
  MANAGE_CONFIG = 'MANAGE_CONFIG',
}

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.MANAGE_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_USERS,
    Permission.MANAGE_PAYMENTS,
    Permission.MANAGE_STRIKES,
    Permission.SEND_NOTIFICATIONS,
    Permission.MANAGE_CONFIG,
  ],
  SECRETARY: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.MANAGE_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
    Permission.VIEW_ALL_USERS,
    Permission.MANAGE_PAYMENTS,
    Permission.SEND_NOTIFICATIONS,
  ],
  PROFESSIONAL: [
    Permission.VIEW_ALL_APPOINTMENTS,
    Permission.BOOK_FOR_OTHERS,
  ],
  PATIENT: [],
}

export function useAuthorization() {
  const authStore = useAuthStore()

  const userRole = computed(() => authStore.user?.role as UserRole | undefined)

  const hasPermission = (permission: Permission): boolean => {
    const role = userRole.value
    if (!role) return false
    return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
  }

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(p => hasPermission(p))
  }

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(p => hasPermission(p))
  }

  const canViewAllAppointments = computed(() => hasPermission(Permission.VIEW_ALL_APPOINTMENTS))
  const canManageAllAppointments = computed(() => hasPermission(Permission.MANAGE_ALL_APPOINTMENTS))
  const canBookForOthers = computed(() => hasPermission(Permission.BOOK_FOR_OTHERS))
  const canViewAllUsers = computed(() => hasPermission(Permission.VIEW_ALL_USERS))
  const canManageUsers = computed(() => hasPermission(Permission.MANAGE_USERS))
  const canManagePayments = computed(() => hasPermission(Permission.MANAGE_PAYMENTS))
  const canManageStrikes = computed(() => hasPermission(Permission.MANAGE_STRIKES))
  const canSendNotifications = computed(() => hasPermission(Permission.SEND_NOTIFICATIONS))
  const canManageConfig = computed(() => hasPermission(Permission.MANAGE_CONFIG))

  const isAdmin = computed(() => userRole.value === 'ADMIN')
  const isSecretary = computed(() => userRole.value === 'SECRETARY')
  const isProfessional = computed(() => userRole.value === 'PROFESSIONAL')
  const isPatient = computed(() => userRole.value === 'PATIENT')

  const isAdminOrSecretary = computed(() => isAdmin.value || isSecretary.value)
  const isAdminOrSecretaryOrProfessional = computed(() => isAdmin.value || isSecretary.value || isProfessional.value)

  return {
    userRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewAllAppointments,
    canManageAllAppointments,
    canBookForOthers,
    canViewAllUsers,
    canManageUsers,
    canManagePayments,
    canManageStrikes,
    canSendNotifications,
    canManageConfig,
    isAdmin,
    isSecretary,
    isProfessional,
    isPatient,
    isAdminOrSecretary,
    isAdminOrSecretaryOrProfessional,
  }
}
