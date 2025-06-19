<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router' // Import useRouter for navigation
import { useAuthStore } from '@/stores/auth' // Import your Pinia auth store

// Initialize router and auth store
const router = useRouter()
const authStore = useAuthStore()

// Form state
const email = ref('')
const password = ref('')
const showPassword = ref(false) // For showing/hiding password
const loading = ref(false)
const error = ref('')

// Validation rules for fields
const emailRules = [
  (v) => !!v || 'El email es obligatorio',
  (v) => /.+@.+\..+/.test(v) || 'El email debe ser válido'
]

const passwordRules = [
  (v) => !!v || 'La contraseña es obligatoria',
  (v) => v.length >= 6 || 'La contraseña debe tener al menos 6 caracteres'
]

// Computed property to check if the form is valid (to disable the button)
const isFormValid = computed(() => {
  // A more robust validation would use `v-form` ref and its `validate()` method
  // For simplicity, here only basic rule validation is applied.
  return emailRules.every(rule => rule(email.value) === true) &&
    passwordRules.every(rule => rule(password.value) === true)
})

// Function to handle form submission
const handleSubmit = async () => {
  error.value = '' // Clear any previous error
  loading.value = true // Indicate that the operation is in progress

  // Basic additional validation (though Vuetify's rules handle most)
  if (!email.value || !password.value) {
    error.value = 'Por favor, ingresa tu email y contraseña.'
    loading.value = false
    return
  }

  try {
    // Call the login action from your Pinia auth store
    // The authStore.login action should handle the actual API call (using `api` instance)
    // and store the token/user data upon success.
    await authStore.login({ email: email.value, password: password.value });

    console.log('Login successful via Pinia store!')
    error.value = '' // Ensure no error if successful

    // Redirect the user to the dashboard
    router.push('/dashboard')

  } catch (err) {
    console.error('Login error:', err)
    // The axios.ts interceptor should handle 401 logout.
    // For other errors, display the message from the API response if available.
    if (err.response && err.response.data && err.response.data.message) {
      error.value = err.response.data.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Ocurrió un error inesperado al iniciar sesión.'
    }
  } finally {
    loading.value = false // Finalize loading state
  }
}
</script>
<template>
  <v-card
    class="border-grey-lighten-2 pa-8"
    max-width="450"
    width="100%"
    rounded
    variant="flat"
  >
    <v-card-title class="text-h4 font-weight-bold text-center mb-4 text-grey-darken-3">
      Bienvenido
    </v-card-title>
    <v-card-subtitle class="text-center mb-8 text-grey-darken-1">
      Ingresa tus credenciales para acceder a tu cuenta.
    </v-card-subtitle>
    <v-card-item>

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
            type="submit"
            color="indigo-darken-2"
            size="large"
            block
            class="rounded-lg text-none font-weight-bold"
            :loading="loading"
            :disabled="loading || !isFormValid"
          >
            <v-icon left>mdi-login</v-icon>
            {{ loading ? 'Iniciando Sesión...' : 'Iniciar Sesión' }}
          </v-btn>
        </div>
      </v-form>
    </v-card-item>
  </v-card>
</template>

<style scoped>
/* Vuetify proporciona la mayoría de los estilos.
   Aquí puedes añadir estilos personalizados si son necesarios
   y no se pueden lograr con las clases de Vuetify/Tailwind (si lo usaras junto). */
.v-card {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>
