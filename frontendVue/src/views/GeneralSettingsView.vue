<template>
  <default-layout :title-page="labels.setting.general_details">
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

      <v-card class="pa-6 " :loading="loading" variant="elevated">
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
            </v-row>
          </v-card-text>

          <v-card-actions class="px-6 pb-4">
            <v-btn color="primary" type="submit" variant="flat" :loading="loading"
                   :disabled="loading">
              {{ labels.btn.save_changes }}
            </v-btn>
          </v-card-actions>
        </v-form>
      </v-card>
  </default-layout>
</template>

<script setup lang="ts">
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import { onMounted, ref, reactive } from 'vue'
import api from '@/api'

const props = defineProps<{
  sectionName?: string;
  setting?: Record<string, any>;
  paymentGateways?: string[];
  selectedPaymentGateways?: string[];
}>()

const snackbar = reactive({
  view: false,
  color: '',
  text: '',
  timeout: 3000
})

const loading = ref(false)
const form = ref<HTMLFormElement | null>(null)

const generalForm = ref({
  clinic_name: '',
  contact_no: '',
  email: '',
  // specialities: [] as string[], // Eliminado: Solo para doctores
  // default_country_code: '', // Eliminado: No componente de país
  email_verified: false,
  currency: '', // Ahora un string para v-text-field
  payment_gateway: {} as Record<string, boolean>
})

const labels = {
  setting: {
    general_details: 'Detalles Generales',
    clinic_name: 'Nombre de la Clínica',
    contact_no: 'Número de Contacto',
    // default_country_code: 'Código de País por Defecto', // Eliminado
    email: 'Email de la Clínica',
    // specialities: 'Especialidades', // Eliminado
    do_not_allow_to_login_without_email_verification: 'No permitir iniciar sesión sin verificación de email',
    currency: 'Moneda'
  },
  patient: {
    contact_no: 'Número de Contacto'
  },
  user: {
    email: 'Email'
  },
  appointment: {
    payment_method: 'Método de Pago'
  },
  btn: {
    save_changes: 'Guardar Cambios'
  }
}

const rules = {
  required: [(v: string) => !!v || 'Campo obligatorio.'],
  email: [(v: string) => /.+@.+\..+/.test(v) || 'El email debe ser válido.']
}

async function saveSetting() {
  const { valid } = await form.value!.validate()

  if (valid) {
    loading.value = true
    try {
      const payload = {
        // Asegúrate de que el 'sectionName' se maneje correctamente en el backend si aún es relevante
        sectionName: props.sectionName,
        clinic_name: generalForm.value.clinic_name,
        contact_no: generalForm.value.contact_no,
        email: generalForm.value.email,
        email_verified: generalForm.value.email_verified,
        currency: generalForm.value.currency,
        payment_gateway: Object.keys(generalForm.value.payment_gateway).filter(key => generalForm.value.payment_gateway[key])
      }

      // --- CAMBIO DE API.POST A API.PUT Y RUTA AJUSTADA ---
      // La URL ahora es '/settings/general' según tu SettingsController
      const response = await api.put('/settings/general', payload)

      snackbar.text = response.data.message || 'Configuración guardada exitosamente.'
      snackbar.color = 'success'
      snackbar.view = true

      console.log('Configuración guardada:', response.data)

    } catch (error: any) {
      console.error('Error al guardar la configuración:', error)
      snackbar.text = error.response?.data?.message || 'Error al guardar la configuración.'
      snackbar.color = 'error'
      snackbar.view = true
    } finally {
      loading.value = false
    }
  } else {
    snackbar.text = 'Por favor, corrige los errores en el formulario.'
    snackbar.color = 'warning'
    snackbar.view = true
  }
}

async function fetchSettingByKey(key: string): Promise<string | null> {
  try {
    const response = await api.get(`/settings/${key}`);
    return response.data.data; // Asumiendo que la respuesta es ApiResponse<string>
  } catch (error: any) {
    console.error(`Error al obtener la configuración '${key}':`, error);
    snackbar.text = `Error al cargar la configuración '${key}'.`;
    snackbar.color = 'error';
    snackbar.view = true;
    return null;
  }
}

// Función para cargar todas las configuraciones generales (si la prop 'setting' no está presente)
async function loadAllGeneralSettings() {
  loading.value = true;
  try {
    // Asume que GET /settings devuelve un ApiResponse<Dictionary<string, string>>
    const response = await api.get('/settings');
    const settingsData = response.data.data; // Esto es un Dictionary<string, string> desde el backend

    // Mapear los datos del diccionario a las propiedades de generalForm
    generalForm.value.clinic_name = settingsData['clinic_name'] || '';
    generalForm.value.contact_no = settingsData['contact_no'] || '';
    generalForm.value.email = settingsData['email'] || '';
    generalForm.value.email_verified = settingsData['email_verified'] === 'true'; // Convertir string a boolean
    generalForm.value.currency = settingsData['currency'] || '';

    snackbar.text = 'Configuraciones cargadas exitosamente.';
    snackbar.color = 'success';
    // snackbar.view = true; // No mostrar snackbar al cargar, solo si hay error
  } catch (error: any) {
    console.error('Error al cargar las configuraciones generales:', error);
    snackbar.text = error.response?.data?.message || 'Error al cargar las configuraciones iniciales.';
    snackbar.color = 'error';
    snackbar.view = true;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  if (props.setting && Object.keys(props.setting).length > 0) {
    // Si la prop 'setting' ya trae los datos, los usamos directamente
    generalForm.value.clinic_name = props.setting.clinic_name || '';
    generalForm.value.contact_no = props.setting.contact_no || '';
    generalForm.value.email = props.setting.email || '';
    generalForm.value.email_verified = props.setting.email_verified || false;
    generalForm.value.currency = props.setting.currency || '';

    // Si tienes lógica para payment_gateway aquí
    generalForm.value.payment_gateway = {};
    if (props.paymentGateways && props.selectedPaymentGateways) {
      for (let gatewayName of props.paymentGateways) {
        generalForm.value.payment_gateway[gatewayName] = props.selectedPaymentGateways.includes(gatewayName);
      }
    }
  } else {
    // Si la prop 'setting' está vacía o no existe, cargamos los datos desde la API
    loadAllGeneralSettings();
  }
});
</script>

<style scoped>
/* Estilos específicos si son necesarios */
</style>
