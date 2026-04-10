import api from '@/services/api'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || ''

export function useOneSignal() {
  const initOneSignal = async () => {
    return new Promise<void>((resolve) => {
      if (typeof window.OneSignal !== 'undefined') {
        window.OneSignalDeferred = window.OneSignalDeferred || []
        window.OneSignalDeferred.push(async (OneSignal) => {
          await OneSignal.init({
            appId: ONESIGNAL_APP_ID,
            notifyButton: { enable: true },
          })
          resolve()
        })
      } else {
        console.warn('OneSignal SDK not loaded from CDN.')
        resolve()
      }
    })
  }

  const loginToOneSignal = async (userId: string) => {
    try {
      if (typeof window.OneSignal !== 'undefined') {
        await window.OneSignal.login(userId)
        const playerId = await window.OneSignal.User.PushSubscription.id
        if (playerId) {
          await api.post('/auth/one-signal-id', { playerId })
        }
      }
    } catch (err) {
      console.error('OneSignal login error:', err)
    }
  }

  const logoutFromOneSignal = async () => {
    try {
      if (typeof window.OneSignal !== 'undefined') {
        await window.OneSignal.logout()
      }
    } catch (err) {
      console.error('OneSignal logout error:', err)
    }
  }

  return {
    initOneSignal,
    loginToOneSignal,
    logoutFromOneSignal,
  }
}

declare global {
  interface Window {
    OneSignalDeferred: any[]
  }
}
