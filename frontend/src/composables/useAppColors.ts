import { useI18n } from 'vue-i18n'

export function useAppColors() {
  const { t } = useI18n()

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
    const statusKeys: Record<string, string> = {
      PENDING: 'appointments.status.pending',
      CONFIRMED: 'appointments.status.confirmed',
      COMPLETED: 'appointments.status.completed',
      CANCELLED: 'appointments.status.cancelled',
      NO_SHOW: 'appointments.status.noShow',
    }
    return statusKeys[status] ? t(statusKeys[status]) : status
  }

  return {
    getStatusColor,
    getPaymentStatusColor,
    getRoleColor,
    formatStatus,
  }
}
