import { reactive } from 'vue'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

const toasts = reactive<Toast[]>([])

export function useToast() {
  const show = (type: Toast['type'], message: string, duration = 4000) => {
    const id = Math.random().toString(36).substr(2, 9)
    const toast: Toast = { id, type, message, duration }
    toasts.push(toast)

    if (duration > 0) {
      setTimeout(() => {
        remove(id)
      }, duration)
    }

    return id
  }

  const remove = (id: string) => {
    const index = toasts.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.splice(index, 1)
    }
  }

  const success = (message: string, duration?: number) => show('success', message, duration)
  const error = (message: string, duration?: number) => show('error', message, duration)
  const warning = (message: string, duration?: number) => show('warning', message, duration)
  const info = (message: string, duration?: number) => show('info', message, duration)

  return {
    toasts,
    show,
    remove,
    success,
    error,
    warning,
    info,
  }
}
