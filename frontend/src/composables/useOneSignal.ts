import api from '@/services/api'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || 'PLACEHOLDER_APP_ID'

export function useOneSignal() {
  const initOneSignal = async () => {
    try {
      if (typeof window.OneSignal !== 'undefined') {
        await window.OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          allowLocalhostAsSecureOrigin: true,
        })
        console.log('OneSignal Initialized via CDN.')
      } else {
        console.warn('OneSignal SDK not loaded from CDN.')
      }
    } catch (err) {
      console.error('OneSignal initialization error:', err)
    }
  }

  const loginToOneSignal = async (userId: string) => {
    try {
      if (typeof window.OneSignal !== 'undefined') {
        await window.OneSignal.login(userId)
        const playerId = await window.OneSignal.User.PushSubscription.id
        if (playerId) {
          await api.post('/auth/one-signal-id', { playerId })
          console.log('OneSignal Player ID linked to user:', userId)
        }
      } else {
        console.warn('OneSignal not available for login.')
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
