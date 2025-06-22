<template>
  <auth-layout>
    <v-card
      class="pa-8"
      max-width="450"
      width="100%"
      variant="flat"
    >
      <v-card-title class="text-h4 font-weight-bold text-center mb-4 text-grey-darken-3">
        Bienvenido
      </v-card-title>
      <v-card-subtitle class="text-center mb-8 text-grey-darken-1">
        Ingresa tus credenciales para acceder a tu cuenta.
      </v-card-subtitle>

      <!-- Mensaje de error, si existe -->
      <v-alert
        v-if="error"
        type="error"
        density="compact"
        class="mb-6 rounded-lg"
        variant="tonal"
        closable
        @click:close="error = ''"
      >
        <span class="font-weight-bold">¡Error!</span> {{ error }}
      </v-alert>

      <v-form @submit.prevent="handleSubmit">
        <!-- Campo de Email -->
        <v-text-field
          v-model="email"
          :rules="emailRules"
          label="Email"
          prepend-inner-icon="mdi-email"
          variant="outlined"
          density="comfortable"
          class="mb-4 rounded-lg"
          :disabled="loading"
          required
        ></v-text-field>

        <!-- Campo de Contraseña -->
        <v-text-field
          v-model="password"
          :rules="passwordRules"
          label="Contraseña"
          prepend-inner-icon="mdi-lock"
          variant="outlined"
          density="comfortable"
          class="mb-4 rounded-lg"
          :type="showPassword ? 'text' : 'password'"
          :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
          @click:append-inner="showPassword = !showPassword"
          :disabled="loading"
          required
        ></v-text-field>

        <!-- Botón de Inicio de Sesión -->
        <div>
          <v-btn
            variant="flat"
            color="primary"
            type="submit"
            size="large"
            block
            class="text-none font-weight-bold"
            :loading="loading"
            :disabled="loading || !isFormValid"
          >
            <v-icon left>mdi-login</v-icon> <!-- ICONO MDI -->
            {{ loading ? 'Iniciando Sesión...' : 'Iniciar Sesión' }}
          </v-btn>
        </div>
      </v-form>
    </v-card>
  </auth-layout>
</template>

<script setup>
import AuthLayout from '@/layouts/AuthLayout.vue'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

const emailRules = [
  (v) => !!v || 'El email es obligatorio',
  (v) => /.+@.+\..+/.test(v) || 'El email debe ser válido'
]

const passwordRules = [
  (v) => !!v || 'La contraseña es obligatoria',
  (v) => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres'
]

const isFormValid = computed(() => {
  return emailRules.every(rule => rule(email.value) === true) &&
    passwordRules.every(rule => rule(password.value) === true)
})

const handleSubmit = async () => {
  error.value = ''
  loading.value = true

  if (!email.value || !password.value) {
    error.value = 'Por favor, ingresa tu email y contraseña.'
    loading.value = false
    return
  }

  try {
    await authStore.login({ email: email.value, password: password.value })

    console.log('Login successful via Pinia store!')
    error.value = ''

    router.push('/dashboard')

  } catch (err) {
    console.error('Login error:', err)
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Ocurrió un error inesperado al iniciar sesión.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.v-card {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
