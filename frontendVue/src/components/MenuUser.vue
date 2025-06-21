<template>
  <!-- Snackbar para notificaciones -->
  <v-snackbar :text="snackbar.text" v-model="snackbar.view" :color="snackbar.color" :timeout="snackbar.timeout || 3000">
    <template v-slot:actions>
      <v-btn color="white" variant="text" @click="snackbar.view = false">Cerrar</v-btn>
    </template>
  </v-snackbar>

  <!-- Diálogo para cambiar contraseña -->
  <v-dialog
    v-model="passwordDialog"
    :max-width="400"
    persistent
  >
    <v-card :loading="loading">
      <v-card-title class="headline">{{ labels.btn.change_password }}</v-card-title>
      <v-card-text>
        <v-form ref="passwordFormRef">
          <v-text-field
            v-model="passwordForm.current_password"
            :label="labels.user.current_password"
            :rules="[rules.required, rules.minLength(6)]"
            type="password"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.new_password"
            :label="labels.user.new_password"
            :rules="[rules.required, rules.minLength(6)]"
            type="password"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model="passwordForm.confirm_password"
            :label="labels.user.confirm_password"
            :rules="[rules.required, rules.minLength(6), rules.equalValue(passwordForm.new_password)]"
            type="password"
            hide-details="auto"
            variant="outlined"
            density="comfortable"
          ></v-text-field>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal" :disabled="loading">
          {{ labels.btn.cancel }}
        </v-btn>
        <v-btn color="primary" variant="flat" @click="savePasswordModal" :loading="loading">
          {{ labels.btn.save_changes }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Botón del Menú de Usuario en la App Bar -->
  <v-btn color="primary" variant="outlined" prepend-icon="mdi-account" class="ma-1">
    {{ authStore.userInfo?.fullName || 'Usuario' }}

    <v-menu activator="parent">
      <v-list density="compact">
        <v-list-item
          @click="router.push('/profile/edit')"
          :active="currentRoutePath === '/profile/edit'"
          link
        >
          <v-list-item-title>{{ labels.btn.profile }}</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="passwordDialog = true"
          link
        >
          <v-list-item-title>{{ labels.btn.change_password }}</v-list-item-title>
        </v-list-item>
        <v-list-item @click="authStore.logout()" link>
          <v-list-item-title>{{ labels.btn.logout }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </v-btn>
</template>

<script setup lang="ts">
import { computed, ref, reactive } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Importa tu store de Pinia
import api from '@/api'; // Importa tu instancia de Axios

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// Referencia al formulario de contraseña para la validación
const passwordFormRef = ref<HTMLFormElement | null>(null);

const loading = ref(false);

const snackbar = reactive({ view: false, color: '', text: '', timeout: 3000 });

const passwordDialog = ref(false);
const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
});

const currentRoutePath = computed(() => route.path);

// --- PLACEHOLDERS para 'labels' y 'rules' ---
const labels = {
  btn: {
    change_password: 'Cambiar Contraseña',
    profile: 'Perfil',
    logout: 'Cerrar Sesión',
    save_changes: 'Guardar Cambios',
    cancel: 'Cancelar',
  },
  user: {
    current_password: 'Contraseña Actual',
    new_password: 'Nueva Contraseña',
    confirm_password: 'Confirmar Contraseña',
  },
};

const rules = {
  required: (value: string) => !!value || 'Campo obligatorio.',
  min: (length: number) => (value: string) => (value && value.length >= length) || `Mínimo ${length} caracteres.`,
  equalValue: (otherValue: string) => (value: string) => value === otherValue || 'Las contraseñas no coinciden.',
};
// --- FIN PLACEHOLDERS ---

// Asegúrate de que authStore.userInfo tenga 'fullName' o créalo dinámicamente
// Si tu AuthenticatedUserResponse no tiene FullName, puedes derivarlo aquí
// const fullName = computed(() => authStore.userInfo?.firstName + ' ' + authStore.userInfo?.lastName);
// Ya deberías tenerlo en authStore.userInfo.fullName si sigues las últimas actualizaciones.

async function savePasswordModal() {
  const { valid } = await passwordFormRef.value!.validate();

  if (!valid) {
    snackbar.text = 'Por favor, corrige los errores en el formulario.';
    snackbar.color = 'warning';
    snackbar.view = true;
    return;
  }

  loading.value = true;
  try {
    // La URL de tu API para cambiar contraseña debe ser ajustada
    // Asumiendo que es PUT a /users/change-password o similar.
    await api.put('/users/change-password', passwordForm);

    snackbar.text = 'Contraseña cambiada exitosamente.';
    snackbar.color = 'success';
    snackbar.view = true;

    // Limpiar formulario y cerrar diálogo
    resetForm();
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

function resetForm() {
  passwordForm.current_password = '';
  passwordForm.new_password = '';
  passwordForm.confirm_password = '';
  passwordFormRef.value?.resetValidation(); // Resetea la validación de Vuetify
}

function closeModal() {
  resetForm();
  passwordDialog.value = false;
}
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí */
</style>
