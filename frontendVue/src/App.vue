<script setup>
import { ref, onMounted } from 'vue';
import AuthService from './services/auth.service';
import { VCard, VTextField, VBtn, VAlert, VContainer, VRow, VCol, VSpacer } from 'vuetify/components';

// Estado de la aplicación
const email = ref('');
const password = ref('');
const message = ref('');
const messageType = ref('success'); // 'success' | 'error' | 'warning'

const isLoggedIn = ref(false);
const userId = ref('');
const userEmail = ref('');
const userRole = ref('');
const userPermissions = ref([]);

const protectedMessage = ref('');
const protectedMessageType = ref('success'); // 'success' | 'error' | 'warning'

// Lógica de Login
const handleLogin = async () => {
  message.value = 'Iniciando sesión...';
  messageType.value = 'info';

  try {
    const response = await AuthService.login(email.value, password.value);
    if (response) {
      userId.value = response.userId;
      userEmail.value = response.email;
      userRole.value = response.role;
      userPermissions.value = response.permissions;
      isLoggedIn.value = true;
      message.value = '¡Login exitoso! Bienvenido.';
      messageType.value = 'success';
      clearLoginForm();
    } else {
      message.value = 'Credenciales inválidas o error en el servidor.';
      messageType.value = 'error';
    }
  } catch (error) {
    console.error('Error durante el login:', error);
    message.value = error.message || 'Error desconocido durante el login.';
    messageType.value = 'error';
  }
};

// Lógica de Logout
const handleLogout = () => {
  AuthService.logout();
  isLoggedIn.value = false;
  userId.value = '';
  userEmail.value = '';
  userRole.value = '';
  userPermissions.value = [];
  message.value = 'Sesión cerrada.';
  messageType.value = 'info';
  protectedMessage.value = ''; // Limpiar mensaje de contenido protegido
};

// Limpiar formulario de login
const clearLoginForm = () => {
  email.value = '';
  password.value = '';
};

// Llamar a un endpoint protegido
const callProtectedEndpoint = async (endpoint) => {
  protectedMessage.value = 'Cargando...';
  protectedMessageType.value = 'info';

  try {
    const data = await AuthService.callProtectedEndpoint(endpoint);
    protectedMessage.value = `Acceso exitoso a /${endpoint}: ${data.message}`;
    protectedMessageType.value = 'success';
  } catch (error) {
    console.error(`Error al llamar al endpoint /${endpoint}:`, error);
    if (error.response && error.response.status === 401) {
      protectedMessage.value = `Acceso denegado al endpoint /${endpoint}: No autenticado o token inválido.`;
      protectedMessageType.value = 'error';
      // Podrías forzar logout si el token es inválido aquí
      // handleLogout();
    } else if (error.response && error.response.status === 403) {
      protectedMessage.value = `Acceso denegado al endpoint /${endpoint}: Permisos insuficientes.`;
      protectedMessageType.value = 'warning';
    } else {
      protectedMessage.value = `Error al acceder a /${endpoint}: ${error.message}`;
      protectedMessageType.value = 'error';
    }
  }
};

// Comprobar la sesión al montar el componente
onMounted(() => {
  const token = localStorage.getItem('jwtToken');
  const storedUserId = localStorage.getItem('userId');
  const storedEmail = localStorage.getItem('userEmail');
  const storedRole = localStorage.getItem('userRole');
  const storedPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');

  if (token && storedUserId && storedEmail && storedRole) {
    userId.value = storedUserId;
    userEmail.value = storedEmail;
    userRole.value = storedRole;
    userPermissions.value = storedPermissions;
    isLoggedIn.value = true;
    message.value = 'Sesión activa. ¡Bienvenido de nuevo!';
    messageType.value = 'info';
  }
});
</script>

<template>
  <v-app>
    <v-main class="bg-grey-lighten-3 d-flex align-center justify-center min-h-screen pa-4">
      <v-container class="w-full" style="max-width: 500px;">
        <v-card class="pa-6 rounded-lg elevation-4">
          <v-card-title class="text-h4 text-center font-weight-bold text-grey-darken-3 mb-4">
            Sistema de Citas Médicas
          </v-card-title>
          <v-card-subtitle class="text-h6 text-center text-grey-darken-1 mb-6">
            Inicio de Sesión
          </v-card-subtitle>

          <!-- Mensajes de la aplicación -->
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

          <!-- Formulario de Login -->
          <v-form @submit.prevent="handleLogin" v-if="!isLoggedIn">
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

          <!-- Información del Usuario y Contenido Protegido -->
          <div v-else>
            <v-card class="mb-6 pa-4 rounded-lg elevation-2 bg-blue-lighten-5">
              <v-card-title class="text-h6 font-weight-bold text-blue-darken-3 mb-2">
                Información del Usuario
              </v-card-title>
              <v-card-text>
                <p><strong>ID:</strong> {{ userId }}</p>
                <p><strong>Email:</strong> {{ userEmail }}</p>
                <p><strong>Rol:</strong> {{ userRole }}</p>
                <p><strong>Permisos:</strong> {{ userPermissions.join(', ') || 'Ninguno' }}</p>
              </v-card-text>
              <v-btn
                color="red-darken-2"
                block
                size="large"
                class="mt-4 rounded-md text-capitalize"
                @click="handleLogout"
              >
                Cerrar Sesión
              </v-btn>
            </v-card>

            <v-card class="pa-4 rounded-lg elevation-2 bg-green-lighten-5">
              <v-card-title class="text-h6 font-weight-bold text-green-darken-3 mb-2">
                Contenido Protegido (ejemplos)
              </v-card-title>
              <v-card-text>
                <v-row dense class="mb-2">
                  <v-col cols="12">
                    <v-btn
                      color="green-darken-2"
                      block
                      @click="callProtectedEndpoint('admin-data')"
                      class="rounded-md text-capitalize"
                    >
                      Obtener Datos de Admin (Solo Admin)
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="purple-darken-2"
                      block
                      @click="callProtectedEndpoint('manage-users')"
                      class="rounded-md text-capitalize"
                    >
                      Gestionar Usuarios (Permiso 'ManageUsers')
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="yellow-darken-2"
                      block
                      @click="callProtectedEndpoint('view-logs')"
                      class="rounded-md text-capitalize"
                    >
                      Ver Logs (Permiso 'ViewLogs')
                  </v-col>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="teal-darken-2"
                      block
                      @click="callProtectedEndpoint('schedule-appointment-data')"
                      class="rounded-md text-capitalize"
                    >
                      Datos de Citas (Doctor, Admin)
                    </v-btn>
                  </v-col>
                  <v-col cols="12">
                    <v-btn
                      color="orange-darken-2"
                      block
                      @click="callProtectedEndpoint('view-patient-data')"
                      class="rounded-md text-capitalize"
                    >
                      Ver Datos Pacientes (Permiso 'ViewPatientData')
                    </v-btn>
                  </v-col>
                </v-row>
                <v-alert
                  v-if="protectedMessage"
                  :type="protectedMessageType"
                  class="mt-4 text-center"
                  variant="tonal"
                  density="compact"
                  border="start"
                >
                  {{ protectedMessage }}
                </v-alert>
              </v-card-text>
            </v-card>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style>
/* Estilos adicionales si son necesarios, Vuetify ya maneja mucho */
body {
  font-family: 'Inter', sans-serif; /* Tailwind usa Inter por defecto, mantenemos consistencia */
}
</style>
