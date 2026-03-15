// TODO: Fix OneSignal SDK import - currently failing with Vite
// import OneSignal from 'onesignal-web-sdk'
import api from '@/services/api'

const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID || 'PLACEHOLDER_APP_ID'

export function useOneSignal() {
  const initOneSignal = async () => {
    try {
      console.warn('OneSignal disabled - SDK import failed')
      // await OneSignal.init({
      //   appId: ONESIGNAL_APP_ID,
      //   allowLocalhostAsSecureOrigin: true,
      // })
    } catch (err) {
      console.error('OneSignal initialization error:', err)
    }
  }

  const loginToOneSignal = async (userId: string) => {
    try {
      console.warn('OneSignal login disabled')
      // await OneSignal.login(userId)
      // const playerId = await OneSignal.User.PushSubscription.id
      // if (playerId) {
      //   await api.post('/auth/one-signal-id', { playerId })
      // }
    } catch (err) {
      console.error('OneSignal login error:', err)
    }
  }

  const logoutFromOneSignal = async () => {
    try {
      // await OneSignal.logout()
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
