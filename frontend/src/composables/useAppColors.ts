import { computed } from 'vue'
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

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'error',
      SECRETARY: 'warning',
      PROFESSIONAL: 'info',
      PATIENT: 'success',
    }
    return colors[role] || 'grey'
  }

  const formatStatus = (status: string) => {
    return status.toLowerCase().replace('_', ' ')
  }

  return {
    getStatusColor,
    getRoleColor,
    formatStatus,
  }
}
