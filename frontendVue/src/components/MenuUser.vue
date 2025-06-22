<template>
  <!-- Snackbar para mensajes de notificación -->
  <v-snackbar :text="snackbar.text" v-model="snackbar.view" :color="snackbar.color" :timeout="snackbar.timeout" top right>
    <template v-slot:actions>
      <v-btn color="white" variant="text" @click="snackbar.view = false">Cerrar</v-btn>
    </template>
  </v-snackbar>

  <!-- Diálogo para cambiar contraseña -->
  <v-dialog
    v-model="passwordDialog"
    :persistent="loading"
    max-width="400"
  >
    <v-card class="rounded-xl pa-4" :loading="loading">
      <v-card-title class="headline">{{ labels.btn.change_password }}</v-card-title>
      <v-card-text>
        <v-form ref="passwordFormRef" @submit.prevent="savePasswordModal">
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="passwordForm.current_password"
                :label="labels.user.current_password"
                :rules="[rules.required, rules.min(6)]"
                type="password"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="loading"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="passwordForm.new_password"
                :label="labels.user.new_password"
                :rules="[rules.required, rules.min(6)]"
                type="password"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="loading"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                v-model="passwordForm.confirm_password"
                :label="labels.user.confirm_password"
                :rules="[
                  rules.required,
                  rules.min(6),
                  (v) => rules.equalValue(passwordForm.new_password)(v) || 'Las contraseñas no coinciden',
                ]"
                type="password"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
                class="mb-2"
                :disabled="loading"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal" :disabled="loading">
          {{ labels.btn.cancel }}
        </v-btn>
        <v-btn color="primary" variant="flat" @click="savePasswordModal" :loading="loading" :disabled="loading">
          {{ labels.btn.save }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Botón de perfil y menú desplegable -->
  <v-btn color="primary" variant="outlined" prepend-icon="mdi-account" class="ma-1">
    {{ fullName }}

    <v-menu activator="parent">
      <v-list density="compact">
        <v-list-item
          @click="router.push('/profile/edit')"
          :active="router.currentRoute.value.path === '/profile/edit'"
        >
          <v-list-item-title>{{ labels.btn.profile }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="passwordDialog = true"
        >
          <v-list-item-title>{{ labels.btn.change_password }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="authStore.logout()">
          <v-list-item-title>{{ labels.btn.logout }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Asegúrate de que esta ruta es correcta
import api from '@/api'; // Asegúrate de que esta ruta es correcta y que api es tu instancia de Axios

const router = useRouter();
const authStore = useAuthStore();

const snackbar = reactive({
  view: false,
  color: '',
  text: '',
  timeout: 3000 // Duración del snackbar en ms
});

const loading = ref(false);
const passwordDialog = ref(false);
const passwordFormRef = ref(null); // Referencia al formulario para validación

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

// Obtener el nombre completo del usuario desde el store de autenticación
const fullName = computed(() => authStore.fullName);

// Definición de etiquetas (labels)
const labels = {
  btn: {
    change_password: 'Cambiar Contraseña',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    cancel: 'Cancelar',
    save: 'Guardar',
  },
  user: {
    current_password: 'Contraseña Actual',
    new_password: 'Nueva Contraseña',
    confirm_password: 'Confirmar Contraseña',
  },
};

// Definición de reglas de validación
const rules = {
  required: (value: string) => !!value || 'Campo obligatorio.',
  min: (min: number) => (value: string) => value.length >= min || `Debe tener al menos ${min} caracteres.`,
  equalValue: (compareValue: string) => (value: string) => value === compareValue || 'Las contraseñas no coinciden.',
};

async function savePasswordModal() {
  const { valid } = await passwordFormRef.value.validate(); // Valida el formulario
  if (!valid) {
    snackbar.text = 'Por favor, corrige los errores en el formulario.';
    snackbar.color = 'warning';
    snackbar.view = true;
    return;
  }

  loading.value = true;
  try {
    // La URL en el backend es /api/Users/change-password
    const response = await api.put('/users/change-password', {
      currentPassword: passwordForm.current_password,
      newPassword: passwordForm.new_password,
      confirmPassword: passwordForm.confirm_password,
    });

    snackbar.text = response.data.message || 'Contraseña cambiada exitosamente.';
    snackbar.color = 'success';
    snackbar.view = true;

    // Reiniciar formulario y cerrar diálogo
    resetPasswordForm();
    passwordDialog.value = false;

  } catch (error: any) {
    console.error('Error al cambiar contraseña:', error);
    snackbar.text = error.response?.data?.message || 'Error al cambiar contraseña.';
    snackbar.color = 'error';
    snackbar.view = true;
  } finally {
    loading.value = false;
  }
}

function closeModal() {
  resetPasswordForm();
  passwordDialog.value = false;
}

function resetPasswordForm() {
  passwordForm.current_password = '';
  passwordForm.new_password = '';
  passwordForm.confirm_password = '';
  if (passwordFormRef.value) {
    passwordFormRef.value.resetValidation(); // Limpia los mensajes de error de validación
  }
}
</script>

<style scoped>
/* Puedes añadir estilos específicos para este componente aquí si es necesario */
</style>
