<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('appointments.title') }}</h1>
      </v-col>
    </v-row>

    <!-- ADMIN VIEW -->
    <template v-if="authStore.user?.role === 'ADMIN'">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Appointment Management</span>
          <v-btn color="primary" size="small" @click="loadAdminAppointments" prepend-icon="mdi-refresh">
            Actualizar
          </v-btn>
        </v-card-title>
        <v-card-text>
          <v-row class="mb-4">
            <v-col cols="12" md="2">
              <v-text-field
                v-model="adminFilters.startDate"
                label="Fecha Inicio"
                type="date"
                density="compact"
                clearable
                @update:model-value="loadAdminAppointments"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model="adminFilters.endDate"
                label="Fecha Fin"
                type="date"
                density="compact"
                clearable
                @update:model-value="loadAdminAppointments"
              />
            </v-col>
            <v-col cols="12" md="2">
              <v-select
                v-model="adminFilters.status"
                label="Estado"
                :items="statusOptions"
                item-title="text"
                item-value="value"
                density="compact"
                clearable
                @update:model-value="loadAdminAppointments"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="adminFilters.patientId"
                label="Paciente"
                :items="patientsList"
                item-title="label"
                item-value="id"
                density="compact"
                clearable
                :loading="loadingPatients"
                @update:model-value="loadAdminAppointments"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="adminFilters.professionalId"
                label="Profesional"
                :items="professionalsList"
                item-title="label"
                item-value="id"
                density="compact"
                clearable
                :loading="loadingProfessionals"
                @update:model-value="loadAdminAppointments"
              />
            </v-col>
          </v-row>

          <v-data-table
            :headers="adminHeaders"
            :items="adminAppointments"
            :loading="loadingAdmin"
            :items-per-page="10"
            class="elevation-1"
          >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.startTime="{ item }">
              {{ formatTime(item.startTime) }}
            </template>
            <template v-slot:item.patient="{ item }">
              <div v-if="item.patient">
                <div class="font-weight-medium">{{ item.patient.profile?.firstName }} {{ item.patient.profile?.lastName }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.patient.email }}</div>
              </div>
              <div v-else class="text-medium-emphasis">N/A</div>
            </template>
            <template v-slot:item.professional="{ item }">
              <div v-if="item.professional">
                <div class="font-weight-medium">{{ item.professional.profile?.firstName }} {{ item.professional.profile?.lastName }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.professional.email }}</div>
              </div>
              <div v-else class="text-medium-emphasis">N/A</div>
            </template>
            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="small">
                {{ item.status }}
              </v-chip>
            </template>
            <template v-slot:item.paymentStatus="{ item }">
              <v-chip :color="getPaymentStatusColor(item.paymentStatus)" size="x-small" variant="outlined">
                {{ item.paymentStatus || 'N/A' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                size="small"
                color="primary"
                variant="text"
                prepend-icon="mdi-eye"
                @click="viewAppointmentAdmin(item)"
              >
                Ver
              </v-btn>
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>

      <v-dialog v-model="viewDialog" max-width="600">
        <v-card v-if="selectedAppointment">
          <v-card-title class="d-flex justify-space-between">
            <span>Detalles de la Cita</span>
            <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
          </v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">ID</v-list-item-title>
                <v-list-item-subtitle>{{ selectedAppointment.id }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">Fecha y Hora</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedAppointment.date) }} {{ formatTime(selectedAppointment.startTime) }} - {{ formatTime(selectedAppointment.endTime) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">Paciente</v-list-item-title>
                <v-list-item-subtitle v-if="selectedAppointment.patient">
                  {{ selectedAppointment.patient.profile?.firstName }} {{ selectedAppointment.patient.profile?.lastName }} ({{ selectedAppointment.patient.email }})
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">Profesional</v-list-item-title>
                <v-list-item-subtitle v-if="selectedAppointment.professional">
                  {{ selectedAppointment.professional.profile?.firstName }} {{ selectedAppointment.professional.profile?.lastName }} ({{ selectedAppointment.professional.email }})
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">Estado</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip :color="getStatusColor(selectedAppointment.status)" size="small">
                    {{ selectedAppointment.status }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title class="text-caption text-medium-emphasis">Estado de Pago</v-list-item-title>
                <v-list-item-subtitle>
                  <v-chip :color="getPaymentStatusColor(selectedAppointment.paymentStatus || '')" size="small">
                    {{ selectedAppointment.paymentStatus || 'N/A' }}
                  </v-chip>
                </v-list-item-subtitle>
              </v-list-item>
              <v-list-item v-if="selectedAppointment.notes">
                <v-list-item-title class="text-caption text-medium-emphasis">Notas</v-list-item-title>
                <v-list-item-subtitle>{{ selectedAppointment.notes }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-dialog>
    </template>

    <!-- PATIENT/PROFESSIONAL VIEW -->
    <template v-else>
      <v-row>
        <v-col cols="12">
          <v-tabs v-model="tab" color="primary">
            <v-tab value="upcoming">Próximas</v-tab>
            <v-tab value="past">Pasadas</v-tab>
            <v-tab value="payments" v-if="showPaymentTab">Pagos</v-tab>
          </v-tabs>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12">
          <v-window v-model="tab">
            <v-window-item value="upcoming">
              <v-card flat>
                <v-list v-if="upcomingAppointments.length > 0">
                  <v-list-item
                    v-for="apt in upcomingAppointments"
                    :key="apt.id"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="primary">
                        <v-icon>mdi-calendar</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>
                      {{ formatDate(apt.date) }} a las {{ formatTime(apt.startTime) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Dr. {{ apt.professional?.profile?.firstName }} {{ apt.professional?.profile?.lastName }}
                    </v-list-item-subtitle>
                    <v-list-item-subtitle v-if="apt.location">
                      {{ apt.location.name }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-chip :color="getStatusColor(apt.status)" class="mr-2">
                        {{ apt.status }}
                      </v-chip>
                      <v-btn
                        v-if="apt.status !== 'CANCELLED' && apt.paymentStatus !== 'PAID' && authStore.user?.role === 'PATIENT'"
                        color="primary"
                        size="small"
                        @click="openPaymentDialog(apt)"
                      >
                        Pagar
                      </v-btn>
                      <v-btn
                        v-if="apt.status !== 'CANCELLED' && authStore.user?.role === 'PATIENT'"
                        color="error"
                        size="small"
                        @click="cancelAppointment(apt)"
                      >
                        {{ $t('appointments.cancel') }}
                      </v-btn>
                    </template>
                  </v-list-item>
                </v-list>
                <v-card-text v-else>
                  No hay citas próximas
                </v-card-text>
              </v-card>
            </v-window-item>

            <v-window-item value="past">
              <v-card flat>
                <v-list v-if="pastAppointments.length > 0">
                  <v-list-item
                    v-for="apt in pastAppointments"
                    :key="apt.id"
                    class="mb-2"
                  >
                    <template v-slot:prepend>
                      <v-avatar color="grey">
                        <v-icon>mdi-calendar-check</v-icon>
                      </v-avatar>
                    </template>
                    <v-list-item-title>
                      {{ formatDate(apt.date) }} - {{ formatTime(apt.startTime) }}
                    </v-list-item-title>
                    <v-list-item-subtitle>
                      Dr. {{ apt.professional?.profile?.firstName }} {{ apt.professional?.profile?.lastName }}
                    </v-list-item-subtitle>
                    <template v-slot:append>
                      <v-chip :color="getStatusColor(apt.status)" size="small">
                        {{ apt.status }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </v-list>
                <v-card-text v-else>
                  No hay citas pasadas
                </v-card-text>
              </v-card>
            </v-window-item>

            <v-window-item value="payments">
              <v-card flat>
                <v-card-title>Seguimiento de Pagos</v-card-title>
                <v-card-text>
                  <v-data-table
                    :headers="paymentHeaders"
                    :items="paymentRecords"
                    :loading="loadingPayments"
                  >
                    <template v-slot:item.status="{ item }">
                      <v-chip :color="getPaymentStatusColor(item.status)" size="small">
                        {{ item.status }}
                      </v-chip>
                    </template>
                    <template v-slot:item.actions="{ item }">
                      <v-btn
                        v-if="item.status === 'PENDING'"
                        size="small"
                        color="primary"
                        @click="openPaymentDialog(item.appointment)"
                      >
                        Subir Pago
                      </v-btn>
                      <v-btn
                        v-if="item.status === 'UPLOADED'"
                        size="small"
                        color="info"
                        @click="viewPayment(item)"
                      >
                        Ver
                      </v-btn>
                    </template>
                  </v-data-table>
                </v-card-text>
              </v-card>
            </v-window-item>
          </v-window>
        </v-col>
      </v-row>

      <v-dialog v-model="paymentDialog" max-width="500">
        <v-card class="pa-4">
          <v-card-title>Subir Comprobante de Pago</v-card-title>
          <v-card-text>
            <p class="mb-4">
              Cita: {{ selectedAppointment ? formatDate(selectedAppointment.date) : '' }}
            </p>
            <v-file-input
              v-model="paymentFile"
              label="Subir captura de pantalla del pago"
              accept="image/*"
              prepend-icon="mdi-camera"
            />
            <v-img
              v-if="previewUrl"
              :src="previewUrl"
              max-height="200"
              class="mt-4"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="paymentDialog = false">Cancelar</v-btn>
            <v-btn
              color="primary"
              :loading="uploading"
              :disabled="!paymentFile"
              @click="uploadPayment"
            >
              Subir
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <v-dialog v-model="paymentViewDialog" max-width="500">
        <v-card class="pa-4">
          <v-card-title>Detalles del Pago</v-card-title>
          <v-card-text v-if="selectedPayment">
            <v-img
              :src="selectedPayment.qrImageUrl"
              max-height="300"
              class="mb-4"
            />
            <v-chip :color="getPaymentStatusColor(selectedPayment.status)">
              {{ selectedPayment.status }}
            </v-chip>
            <p v-if="selectedPayment.uploadedAt" class="mt-2">
              Subido: {{ new Date(selectedPayment.uploadedAt).toLocaleString() }}
            </p>
          </v-card-text>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { paymentsService, type QRPayment } from '@/services/payments'
import api from '@/services/api'
import { formatDate, formatTime } from '@/utils/date'

const authStore = useAuthStore()
const tab = ref('upcoming')
const upcomingAppointments = ref<Appointment[]>([])
const pastAppointments = ref<Appointment[]>([])
const paymentRecords = ref<any[]>([])
const loadingPayments = ref(false)

const paymentDialog = ref(false)
const paymentViewDialog = ref(false)
const viewDialog = ref(false)
const selectedAppointment = ref<Appointment | null>(null)
const selectedPayment = ref<QRPayment | null>(null)
const paymentFile = ref<File | null>(null)
const previewUrl = ref('')
const uploading = ref(false)

const showPaymentTab = computed(() => authStore.user?.role === 'PATIENT')

const paymentHeaders = [
  { title: 'Fecha', key: 'appointment.date' },
  { title: 'Profesional', key: 'appointment.professional.profile.firstName' },
  { title: 'Estado', key: 'status' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

// Admin state
const adminAppointments = ref<any[]>([])
const loadingAdmin = ref(false)
const loadingPatients = ref(false)
const loadingProfessionals = ref(false)
const patientsList = ref<{ id: string; label: string }[]>([])
const professionalsList = ref<{ id: string; label: string }[]>([])
const adminFilters = reactive({
  startDate: '',
  endDate: '',
  status: '',
  patientId: '',
  professionalId: ''
})

const statusOptions = [
  { text: 'Pendiente', value: 'PENDING' },
  { text: 'Confirmada', value: 'CONFIRMED' },
  { text: 'Completada', value: 'COMPLETED' },
  { text: 'Cancelada', value: 'CANCELLED' },
  { text: 'No Asistió', value: 'NO_SHOW' }
]

const adminHeaders = [
  { title: 'Fecha', key: 'date' },
  { title: 'Hora', key: 'startTime' },
  { title: 'Paciente', key: 'patient' },
  { title: 'Profesional', key: 'professional' },
  { title: 'Estado', key: 'status' },
  { title: 'Pago', key: 'paymentStatus' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

onMounted(async () => {
  if (authStore.user?.role === 'ADMIN') {
    await loadAdminAppointments()
    await loadPatients()
    await loadProfessionals()
  } else {
    await loadAppointments()
  }
})

async function loadPatients() {
  loadingPatients.value = true
  try {
    const response = await api.get('/auth/users?role=PATIENT')
    patientsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''} (${u.email})`.trim()
    }))
  } catch (error) {
    console.error('Failed to load patients:', error)
  } finally {
    loadingPatients.value = false
  }
}

async function loadProfessionals() {
  loadingProfessionals.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionalsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim()
    }))
  } catch (error) {
    console.error('Failed to load professionals:', error)
  } finally {
    loadingProfessionals.value = false
  }
}

async function loadAdminAppointments() {
  loadingAdmin.value = true
  try {
    const params: any = { page: 1, limit: 50 }
    if (adminFilters.startDate) params.startDate = adminFilters.startDate
    if (adminFilters.endDate) params.endDate = adminFilters.endDate
    if (adminFilters.status) params.status = adminFilters.status
    if (adminFilters.patientId) params.patientId = adminFilters.patientId
    if (adminFilters.professionalId) params.professionalId = adminFilters.professionalId
    
    const response = await appointmentsService.getAll(params)
    adminAppointments.value = response.data || response
  } catch (error) {
    console.error('Failed to load admin appointments:', error)
  } finally {
    loadingAdmin.value = false
  }
}

function viewAppointmentAdmin(item: any) {
  selectedAppointment.value = item
  viewDialog.value = true
}

async function loadAppointments() {
  try {
    let allAppointments: Appointment[] = []
    
    // Use different endpoints based on user role
    if (authStore.user?.role === 'PROFESSIONAL') {
      allAppointments = await appointmentsService.getProfessionalAppointments()
    } else {
      allAppointments = await appointmentsService.getMyAppointments()
    }
    
    const now = new Date()
    upcomingAppointments.value = allAppointments.filter((a: Appointment) =>
      new Date(a.date) >= now && a.status !== 'CANCELLED'
    )
    pastAppointments.value = allAppointments.filter((a: Appointment) =>
      new Date(a.date) < now || a.status === 'CANCELLED'
    )
    await loadPaymentRecords()
  } catch (error) {
    console.error('Failed to load appointments:', error)
  }
}

async function loadPaymentRecords() {
  loadingPayments.value = true
  try {
    paymentRecords.value = await paymentsService.getMyPayments()
  } catch (error) {
    console.error('Failed to load payments:', error)
  } finally {
    loadingPayments.value = false
  }
}

function openPaymentDialog(apt: Appointment) {
  selectedAppointment.value = apt
  paymentFile.value = null
  previewUrl.value = ''
  paymentDialog.value = true
}

function viewPayment(payment: any) {
  selectedPayment.value = payment
  paymentViewDialog.value = true
}

async function uploadPayment() {
  if (!selectedAppointment.value || !paymentFile.value) return

  uploading.value = true
  try {
    await paymentsService.uploadPayment(selectedAppointment.value.id, paymentFile.value)
    alert('Payment uploaded successfully!')
    paymentDialog.value = false
    await loadPaymentRecords()
  } catch (error) {
    alert('Failed to upload payment')
  } finally {
    uploading.value = false
  }
}

async function cancelAppointment(apt: Appointment) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    try {
      await appointmentsService.cancel(apt.id, 'Cancelled by patient')
      upcomingAppointments.value = upcomingAppointments.value.filter(a => a.id !== apt.id)
    } catch (error) {
      alert('Failed to cancel appointment')
    }
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    COMPLETED: 'info',
    CANCELLED: 'error',
    NO_SHOW: 'error'
  }
  return colors[status] || 'grey'
}

function getPaymentStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    UPLOADED: 'info',
    VERIFIED: 'success',
    REJECTED: 'error'
  }
  return colors[status] || 'grey'
}
</script>
