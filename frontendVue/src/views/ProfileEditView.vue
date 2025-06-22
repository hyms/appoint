<template>
  <snackbar :text="snackbar.text" v-model="snackbar.view" :color="snackbar.color" :timeout="snackbar.timeout"></snackbar>

  <DefaultLayout :title-page="labels.user.edit_profile">
    <v-card class="pa-3 rounded-xl shadow-sm" :loading="loading">
      <v-form fast-fail ref="form" @submit.prevent="saveProfile" :disabled="loading">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-text-field
                :label="labels.user.first_name + ' *'"
                v-model="userForm.firstName"
                :rules="[rules.required]"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                :label="labels.user.last_name + ' *'"
                v-model="userForm.lastName"
                :rules="[rules.required]"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                :label="labels.user.email + ' *'"
                v-model="userForm.email"
                :rules="[rules.required, rules.email]"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
                type="email"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-text-field
                :label="labels.user.contact_number + ' *'"
                v-model="userForm.contact"
                :rules="[rules.required]"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
              >
                <template v-slot:prepend-inner>
                  <v-btn variant="text" :disabled="true"> {{ userForm.regionCode }}</v-btn>
                </template>
              </v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-btn type="submit" color="primary" variant="flat" :disabled="loading" :loading="loading">
            {{ labels.btn.save }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { onMounted, ref, reactive } from 'vue';
import api from '@/api';
import { useAuthStore } from '@/stores/auth'; // Para obtener la información del usuario logueado

// Define props para el componente (si recibiera datos de un padre, como Inertia solía hacer)
// En este caso, cargaremos los datos directamente en onMounted
// const props = defineProps({
//     user: Object, // Laravel/Inertia lo pasaba como prop. Ahora lo cargaremos.
//     time_zones: Array, // Ya no se usará
//     errors: Object, // Para manejo de errores desde el backend, pero usaremos snackbar
// });

const authStore = useAuthStore();

const snackbar = reactive({
  view: false,
  color: '',
  text: '',
  timeout: 3000
});

const loading = ref(false);
const form = ref(null); // Referencia al v-form

const userForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  regionCode: '591', // Hardcodeado, ya que el selector de Laravel no se migra
  contact: '',
  // No necesitamos time_zone aquí según tu código anterior
});

// Labels para la UI
const labels = {
  user: {
    edit_profile: 'Editar Perfil',
    first_name: 'Nombre',
    last_name: 'Apellido',
    email: 'Email',
    contact_number: 'Número de Contacto',
    // time_zone: 'Zona Horaria', // Comentado, ya que no se usa en el UI actual
  },
  btn: {
    save: 'Guardar',
  },
};

// Reglas de validación
const rules = {
  required: (value: string) => !!value || 'Campo obligatorio.',
  email: (value: string) => /.+@.+\..+/.test(value) || 'El email debe ser válido.',
};

async function saveProfile() {
  const { valid } = await form.value.validate();
  if (!valid) {
    snackbar.text = 'Por favor, corrige los errores en el formulario.';
    snackbar.color = 'warning';
    snackbar.view = true;
    return;
  }

  loading.value = true;
  try {
    // La URL en el backend es /api/Users/profile
    const response = await api.put('/users/profile', userForm);

    snackbar.text = response.data.message || 'Perfil actualizado exitosamente.';
    snackbar.color = 'success';
    snackbar.view = true;

    // Actualizar la información del usuario en el store de Pinia después de un guardado exitoso
    // Para reflejar los cambios en fullName en el MenuUser, etc.
    if (authStore.userInfo) {
      authStore.userInfo.firstName = userForm.firstName;
      authStore.userInfo.lastName = userForm.lastName;
      authStore.userInfo.email = userForm.email;
      // Actualiza localStorage también si userInfo se guarda allí
      localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo));
    }

  } catch (error: any) {
    console.error('Error al guardar el perfil:', error);
    snackbar.text = error.response?.data?.message || 'Error al guardar el perfil.';
    snackbar.color = 'error';
    snackbar.view = true;
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // Cargar los datos del usuario desde el store de Pinia para rellenar el formulario
  const userInfo = authStore.getUserInfo;
  if (userInfo) {
    userForm.firstName = userInfo.firstName || '';
    userForm.lastName = userInfo.lastName || '';
    userForm.email = userInfo.email || '';
    userForm.contact = userInfo.contact || '';
    userForm.regionCode = userInfo.regionCode || '591'; // Mantener el valor por defecto si no existe
  } else {
    // Si userInfo no está en el store (ej. recarga de página), intentar cargar desde el backend
    // Esto es un fallback, lo ideal es que el store ya tenga la info.
    loading.value = true;
    try {
      // Endpoint para obtener el perfil del usuario logueado
      const response = await api.get('/users/profile');
      const profileData = response.data.data; // Asumiendo que la respuesta es ApiResponse<UserProfileDetails>

      userForm.firstName = profileData.firstName || '';
      userForm.lastName = profileData.lastName || '';
      userForm.email = profileData.email || '';
      userForm.contact = profileData.contact || '';
      userForm.regionCode = profileData.regionCode || '591';

      // También podrías actualizar el store de Pinia con estos datos si quieres que se mantengan
      // authStore.userInfo = { ...authStore.userInfo, ...profileData };
      // localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo));

    } catch (error: any) {
      console.error('Error al cargar datos del perfil:', error);
      snackbar.text = error.response?.data?.message || 'Error al cargar datos del perfil.';
      snackbar.color = 'error';
      snackbar.view = true;
    } finally {
      loading.value = false;
    }
  }
});
</script>

<style scoped>
/* Estilos específicos si son necesarios */
</style>
