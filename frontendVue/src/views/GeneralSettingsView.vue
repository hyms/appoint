<template>
  <!-- El Layout (Authenticated.vue en tu original) se reemplaza por nuestro DefaultLayout -->
  <!-- Esto asume que DefaultLayout ya maneja la barra de navegación y el sidebar -->
  <DefaultLayout>
    <v-container fluid class="py-6 px-6">
      <v-row>
        <v-col cols="12">
          <h1 class="text-h4 mb-4">{{ labels.setting.general_details }}</h1>
        </v-col>
      </v-row>

      <!-- Snackbar para notificaciones de éxito/error -->
      <v-snackbar
        v-model="snackbar.view"
        :color="snackbar.color"
        :timeout="snackbar.timeout || 3000"
        top
        right
      >
        {{ snackbar.text }}
        <template v-slot:actions>
          <v-btn color="white" variant="text" @click="snackbar.view = false">Cerrar</v-btn>
        </template>
      </v-snackbar>

      <v-card class="pa-6 rounded-xl shadow-sm" :loading="loading">
        <!-- v-form con ref para validación programática -->
        <v-form ref="form" @submit.prevent="saveSetting" :disabled="loading" fast-fail>
          <v-card-text>
            <v-row>
              <!-- Campo: Nombre de la Clínica -->
              <v-col cols="12" sm="6">
                <v-text-field
                  :label="labels.setting.clinic_name + ' *'"
                  v-model="generalForm.clinic_name"
                  :rules="rules.required"
                  hide-details="auto"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Campo: Número de Contacto -->
              <v-col cols="12" sm="6">
                <v-text-field
                  :label="labels.patient.contact_no + ' *'"
                  v-model="generalForm.contact_no"
                  :rules="rules.required"
                  hide-details="auto"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Campo: Email de la Clínica -->
              <v-col cols="12" sm="6">
                <v-text-field
                  :label="labels.user.email + ' *'"
                  v-model="generalForm.email"
                  :rules="rules.email"
                  hide-details="auto"
                  variant="outlined"
                  density="comfortable"
                ></v-text-field>
              </v-col>

              <!-- Checkbox: No permitir login sin verificación de email -->
              <v-col cols="12">
                <v-checkbox
                  :label="labels.setting.do_not_allow_to_login_without_email_verification"
                  v-model="generalForm.email_verified"
                  hide-details="auto"
                  color="primary"
                ></v-checkbox>
              </v-col>

              <!-- Campo: Moneda (ahora v-text-field para una sola moneda) -->
              <v-col cols="12" sm="6">
                <v-text-field
                  :label="labels.setting.currency + ' *'"
                  v-model="generalForm.currency"
                  :rules="rules.required"
                  hide-details="auto"
                  variant="outlined"
                  density="comfortable"
                  placeholder="Ej. USD, BOB"
                ></v-text-field>
              </v-col>

              <!-- Sección de Métodos de Pago (comentado en tu original, mantenido así) -->
              <!--
              <v-col cols="12">
                  <v-card variant="text">
                      <v-card-title>{{ labels.appointment.payment_method }}</v-card-title>
                      <v-card-text>
                          <v-checkbox
                              v-for="(paymentGateway,key) in paymentGateways"
                              :label="paymentGateway+' *'"
                              v-model="generalForm.payment_gateway[key]"
                              :id="key"
                              hide-details="auto"
                          >
                          </v-checkbox>
                      </v-card-text>
                  </v-card>
              </v-col>
              -->
            </v-row>
          </v-card-text>

          <v-card-actions class="px-6 pb-4">
            <v-btn color="primary" type="submit" variant="flat" :loading="loading" :disabled="loading">
              {{ labels.btn.save_changes }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
    </v-container>
  </DefaultLayout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue';
import { onMounted, ref, reactive } from 'vue';
import api from '@/api';

const props = defineProps<{
  sectionName?: string;
  setting?: Record<string, any>;
  paymentGateways?: string[];
  selectedPaymentGateways?: string[];
}>();

const snackbar = reactive({
  view: false,
  color: '',
  text: '',
  timeout: 3000
});

const loading = ref(false);
const form = ref<HTMLFormElement | null>(null);

const generalForm = ref({
  clinic_name: '',
  contact_no: '',
  email: '',
  // specialities: [] as string[], // Eliminado: Solo para doctores
  // default_country_code: '', // Eliminado: No componente de país
  email_verified: false,
  currency: '', // Ahora un string para v-text-field
  payment_gateway: {} as Record<string, boolean>
});

const labels = {
  setting: {
    general_details: 'Detalles Generales',
    clinic_name: 'Nombre de la Clínica',
    contact_no: 'Número de Contacto',
    // default_country_code: 'Código de País por Defecto', // Eliminado
    email: 'Email de la Clínica',
    // specialities: 'Especialidades', // Eliminado
    do_not_allow_to_login_without_email_verification: 'No permitir iniciar sesión sin verificación de email',
    currency: 'Moneda',
  },
  patient: {
    contact_no: 'Número de Contacto',
  },
  user: {
    email: 'Email',
  },
  appointment: {
    payment_method: 'Método de Pago',
  },
  btn: {
    save_changes: 'Guardar Cambios',
  },
};

const rules = {
  required: [(v: string) => !!v || 'Campo obligatorio.'],
  email: [(v: string) => /.+@.+\..+/.test(v) || 'El email debe ser válido.'],
};

async function saveSetting() {
  const { valid } = await form.value!.validate();

  if (valid) {
    loading.value = true;
    try {
      const payload = {
        // Asegúrate de que el 'sectionName' se maneje correctamente en el backend si aún es relevante
        sectionName: props.sectionName, // Si el backend lo necesita, mantenlo
        clinic_name: generalForm.value.clinic_name,
        contact_no: generalForm.value.contact_no,
        // default_country_code: generalForm.value.default_country_code, // Eliminado del payload si no se configura aquí
        email: generalForm.value.email,
        // specialities: generalForm.value.specialities, // Eliminado del payload
        email_verified: generalForm.value.email_verified,
        currency: generalForm.value.currency,
        payment_gateway: Object.keys(generalForm.value.payment_gateway).filter(key => generalForm.value.payment_gateway[key]),
      };

      // --- CAMBIO DE API.POST A API.PUT Y RUTA AJUSTADA ---
      // La URL ahora es '/settings/general' según tu SettingsController
      const response = await api.put('/settings/general', payload);

      snackbar.text = response.data.message || 'Configuración guardada exitosamente.';
      snackbar.color = 'success';
      snackbar.view = true;

      console.log('Configuración guardada:', response.data);

    } catch (error: any) {
      console.error('Error al guardar la configuración:', error);
      snackbar.text = error.response?.data?.message || 'Error al guardar la configuración.';
      snackbar.color = 'error';
      snackbar.view = true;
    } finally {
      loading.value = false;
    }
  } else {
    snackbar.text = 'Por favor, corrige los errores en el formulario.';
    snackbar.color = 'warning';
    snackbar.view = true;
  }
}

onMounted(() => {
  if (props.setting && Object.keys(props.setting).length > 0) {
    generalForm.value.clinic_name = props.setting.clinic_name || '';
    generalForm.value.contact_no = props.setting.contact_no || '';
    generalForm.value.email = props.setting.email || '';
    generalForm.value.email_verified = props.setting.email_verified || false;
    generalForm.value.currency = props.setting.currency || ''; // Asigna la moneda
    // No asignamos specialities ni default_country_code si no están en el formulario

    // Inicializar payment_gateway como un objeto de booleans
    generalForm.value.payment_gateway = {};
    if (props.paymentGateways && props.selectedPaymentGateways) {
      for (let gatewayName of props.paymentGateways) {
        generalForm.value.payment_gateway[gatewayName] = props.selectedPaymentGateways.includes(gatewayName);
      }
    }
  } else {
    console.warn("No 'setting' prop provided or it is empty. Form initialized with default values.");
  }
});
</script>

<style scoped>
/* Estilos específicos si son necesarios */
</style>
