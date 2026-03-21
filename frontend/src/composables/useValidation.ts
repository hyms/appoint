export function useValidation() {
  const emailRules = [
    (v: string) => !!v || 'Email is required',
    (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email must be valid',
  ]

  const passwordRules = [
    (v: string) => !!v || 'Password is required',
    (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
  ]

  const requiredRule = (v: string) => !!v || 'This field is required'

  const phoneRules = [
    (v: string) => !!v || 'Phone number is required',
    (v: string) => /^\+?[\d\s-()]{8,}$/.test(v) || 'Invalid phone number',
  ]

  return {
    emailRules,
    passwordRules,
    requiredRule,
    phoneRules,
  }
}
