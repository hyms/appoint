<script setup lang="ts">
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import api from '@/api'; // Importa tu instancia de Axios configurada
import { VCard, VBtn, VAlert, VRow, VCol, VList, VListItem, VListItemTitle, VListItemSubtitle } from 'vuetify/components';

const authStore = useAuthStore();

const protectedMessage = ref('');
const protectedMessageType = ref('success');

const callProtectedEndpoint = async (endpoint: string) => {
  protectedMessage.value = 'Cargando...';
  protectedMessageType.value = 'info';

  try {
    const response = await api.get(`/${endpoint}`);
    protectedMessage.value = `Acceso exitoso a /${endpoint}: ${response.data.message}`;
    protectedMessageType.value = 'success';
  } catch (error: any) {
    console.error(`Error al llamar al endpoint /${endpoint}:`, error.response?.data || error.message);
    if (error.response?.status === 401) {
      protectedMessage.value = `Acceso denegado al endpoint /${endpoint}: No autenticado o token inválido.`;
      protectedMessageType.value = 'error';
    } else if (error.response?.status === 403) {
      protectedMessage.value = `Acceso denegado al endpoint /${endpoint}: Permisos insuficientes.`;
      protectedMessageType.value = 'warning';
    } else {
      protectedMessage.value = `Error al acceder a /${endpoint}: ${error.message}`;
      protectedMessageType.value = 'error';
    }
  }
};
</script>

<template>
  <v-card class="pa-6 rounded-lg elevation-4">
    <v-card-title class="text-h4 text-center font-weight-bold text-grey-darken-3 mb-4">
      Dashboard Principal
    </v-card-title>
    <v-card-subtitle class="text-h6 text-center text-grey-darken-1 mb-6">
      Bienvenido, {{ authStore.getUserInfo?.email }} (Rol: {{ authStore.userRole }})
    </v-card-subtitle>

    <v-card class="mb-6 pa-4 rounded-lg elevation-2 bg-blue-lighten-5">
      <v-card-title class="text-h6 font-weight-bold text-blue-darken-3 mb-2">
        Información del Usuario
      </v-card-title>
      <v-list dense class="bg-transparent">
        <v-list-item>
          <v-list-item-title><strong>ID:</strong></v-list-item-title>
          <v-list-item-subtitle>{{ authStore.getUserInfo?.userId }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <v-list-item-title><strong>Email:</strong></v-list-item-title>
          <v-list-item-subtitle>{{ authStore.getUserInfo?.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <v-list-item-title><strong>Rol:</strong></v-list-item-title>
          <v-list-item-subtitle>{{ authStore.userRole }}</v-list-item-subtitle>
        </v-list-item>
        <v-list-item>
          <v-list-item-title><strong>Permisos:</strong></v-list-item-title>
          <v-list-item-subtitle>{{ authStore.userPermissions.join(', ') || 'Ninguno' }}</v-list-item-subtitle>
        </v-list-item>
      </v-list>
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
              :disabled="!authStore.hasRole('Admin')"
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
              :disabled="!authStore.hasPermission('ManageUsers')"
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
              :disabled="!authStore.hasPermission('ViewLogs')"
              class="rounded-md text-capitalize"
            >
              Ver Logs (Permiso 'ViewLogs')
            </v-btn>
          </v-col>
          <v-col cols="12">
            <v-btn
              color="teal-darken-2"
              block
              @click="callProtectedEndpoint('schedule-appointment-data')"
              :disabled="!authStore.hasRole('Doctor') && !authStore.hasRole('Admin')"
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
              :disabled="!authStore.hasPermission('ViewPatientData')"
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
  </v-card>
</template>
