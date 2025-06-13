<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { VCard, VTextField, VBtn, VAlert } from 'vuetify/components';

const authStore = useAuthStore();
const router = useRouter();

const email = ref('');
const password = ref('');
const message = ref('');
const messageType = ref('success'); // 'success' | 'error' | 'warning'

const handleLogin = async () => {
  message.value = 'Iniciando sesión...';
  messageType.value = 'info';

  try {
    const success = await authStore.login(email.value, password.value);
    if (success) {
      message.value = '¡Login exitoso! Redirigiendo...';
      messageType.value = 'success';
      email.value = '';
      password.value = '';
      router.push('/'); // Redirigir al dashboard o ruta principal
    } else {
      // Aunque el store ya relanza el error, este catch es para el mensaje local.
      message.value = 'Credenciales inválidas o error en el servidor.';
      messageType.value = 'error';
    }
  } catch (error: any) {
    message.value = error.response?.data?.message || error.message || 'Error desconocido durante el login.';
    messageType.value = 'error';
  }
};
</script>

<template>
  <v-card class="pa-6 rounded-lg elevation-4">
    <v-card-title class="text-h4 text-center font-weight-bold text-grey-darken-3 mb-4">
      Iniciar Sesión
    </v-card-title>
    <v-card-subtitle class="text-h6 text-center text-grey-darken-1 mb-6">
      Sistema de Citas Médicas
    </v-card-subtitle>

    <v-alert
      v-if="message"
      :type="messageType"
      class="mb-4 text-center"
      variant="tonal"
      density="compact"
      border="start"
      closable
      @click:close="message = ''"
    >
      {{ message }}
    </v-alert>

    <v-form @submit.prevent="handleLogin">
      <v-text-field
        label="Correo Electrónico"
        v-model="email"
        type="email"
        required
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-email"
        class="mb-4 rounded-md"
        single-line
      ></v-text-field>
      <v-text-field
        label="Contraseña"
        v-model="password"
        type="password"
        required
        variant="outlined"
        density="comfortable"
        prepend-inner-icon="mdi-lock"
        class="mb-6 rounded-md"
        single-line
      ></v-text-field>
      <v-btn
        type="submit"
        color="blue-darken-2"
        block
        size="large"
        class="rounded-md text-capitalize"
      >
        Ingresar
      </v-btn>
    </v-form>
  </v-card>
</template>
