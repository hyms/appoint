import { getCurrentInstance } from 'vue'

export function useVuetify() {
  const vm = getCurrentInstance()
  if (!vm) {
    throw new Error('useVuetify must be called in setup()')
  }
  return vm.proxy?.$vuetify
}
