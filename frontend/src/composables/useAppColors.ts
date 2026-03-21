import { useI18n } from 'vue-i18n'

export function useAppColors() {
  useI18n()

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'warning',
      CONFIRMED: 'success',
      VOICE_VERIFIED: 'info',
      COMPLETED: 'primary',
      CANCELLED: 'error',
      NO_SHOW: 'error',
    }
    return colors[status] || 'grey'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'warning',
      UPLOADED: 'info',
      VERIFIED: 'success',
      REJECTED: 'error',
    }
    return colors[status] || 'grey'
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'purple',
      SECRETARY: 'blue',
      PROFESSIONAL: 'green',
      PATIENT: 'orange',
    }
    return colors[role] || 'grey'
  }

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace('_', ' ')
  }

  return {
    getStatusColor,
    getPaymentStatusColor,
    getRoleColor,
    formatStatus,
  }
}
