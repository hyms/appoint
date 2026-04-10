<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-xl mx-auto">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-2">
          {{ $t('appointments.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          {{ $t('appointmentsView.manageDescription') }}
        </p>
      </v-col>
    </v-row>

    <!-- ADMIN VIEW -->
    <template v-if="authStore.user?.role === 'ADMIN'">
      <AdminAppointmentsTab 
        v-model:filters="adminFilters"
        :appointments="adminAppointments"
        :loading="loadingAdmin"
        :headers="adminHeaders"
        :status-options="statusOptions"
        :loading-patients="loadingPatients"
        :loading-professionals="loadingProfessionalsForFilter"
        :patients-list="patientsList"
        :professionals-list="professionalsList"
        @update-list="loadAppointments"
        @view-details="viewAppointmentAdmin"
      />
      
      <v-dialog v-model="viewDialog" max-width="600">
        <v-card v-if="selectedAppointment">
          <v-card-title class="d-flex justify-space-between">
            <span>{{ $t('admin.appointmentDetails') }}</span>
            <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" :aria-label="$t('common.close')" />
          </v-card-title>
          <v-card-text>
            <AppointmentDetailCard :appointment="selectedAppointment" />
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Cancel Appointment Dialog (Keeping here for dependency reasons until componentized) -->
      <v-dialog v-model="cancelDialog" max-width="400">
        <v-card>
          <v-card-title>{{ $t('admin.cancelAppointment') }}</v-card-title>
          <v-card-text>
            <p class="mb-4">{{ $t('admin.confirmCancelAppointmentQuestion') }}</p>
            <v-textarea
              v-model="cancelReason"
              :label="$t('admin.cancellationReason')"
              rows="3"
              :placeholder="$t('admin.enterCancellationReason')"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="cancelDialog = false">{{ $t('admin.no') }}</v-btn>
            <v-btn color="error" @click="confirmCancelAppointment" :loading="cancelling">{{ $t('admin.yesCancel') }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <!-- PATIENT/PROFESSIONAL VIEW -->
    <template v-else>
      <v-tabs v-model="tab" color="primary" class="mb-6" grow>
        <v-tab value="upcoming">{{ $t('appointmentsView.upcoming') }}</v-tab>
        <v-tab value="past">{{ $t('appointmentsView.past') }}</v-tab>
        <v-tab value="payments" v-if="showPaymentTab">{{ $t('appointmentsView.payments') }}</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="upcoming">
          <AppointmentList
            :appointments="upcomingAppointments"
            :loading="loadingAppointments"
            view-all-route="/appointments"
            :has-action="true"
          />
        </v-window-item>

        <v-window-item value="past">
          <AppointmentList
            :appointments="pastAppointments"
            :loading="loadingAppointments"
            :view-all-route="undefined"
            :has-action="false"
          />
        </v-window-item>

        <v-window-item value="payments" v-if="showPaymentTab">
          <!-- Payment Tracking Table (Will be componentized later if needed) -->
          <v-card flat>
            <v-card-title>{{ $t('appointmentsView.paymentTracking') }}</v-card-title>
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
                    variant="text"
                    @click="openPaymentDialog(item.appointment)"
                  >
                    {{ $t('appointmentsView.uploadPayment') }}
                  </v-btn>
                  <v-btn
                    v-if="item.status === 'UPLOADED'"
                    size="small"
                    color="info"
                    variant="text"
                    @click="viewPayment(item)"
                  >
                    {{ $t('appointmentsView.viewDetails') }}
                  </v-btn>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </template>

    <!-- Modals remain here for now -->
    <v-dialog v-model="paymentDialog" max-width="500">
        <v-card class="pa-4">
          <v-card-title>{{ $t('appointmentsView.uploadProof') }}</v-card-title>
          <v-card-text>
            <p class="mb-4">
              {{ $t('appointmentsView.appointment') }} {{ selectedAppointment ? formatDate(selectedAppointment.date) : '' }}
            </p>
            <v-file-input
              v-model="paymentFile"
              :label="$t('appointmentsView.uploadScreenshot')"
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
            <v-btn @click="paymentDialog = false">{{ $t('common.cancel') }}</v-btn>
            <v-btn
              color="primary"
              :loading="uploading"
              :disabled="!paymentFile"
              @click="uploadPayment"
            >
              {{ $t('appointmentsView.upload') }}
            </v-btn>
          </v-card-actions>
        </v-card>
    </v-dialog>

    <v-dialog v-model="paymentViewDialog" max-width="500">
      <v-card class="pa-4">
        <v-card-title>{{ $t('appointmentsView.paymentDetails') }}</v-card-title>
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
            {{ $t('appointmentsView.uploadedAt') }} {{ new Date(selectedPayment.uploadedAt).toLocaleString() }}
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { paymentsService, type QRPayment } from '@/services/payments'
import api from '@/services/api'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import { useAppColors } from '@/composables/useAppColors'
import AppointmentList from '@/components/appointments/AppointmentList.vue'
import AppointmentDetailCard from '@/components/appointments/AppointmentDetailCard.vue'
import AdminAppointmentsTab from '../components/admin/AdminAppointmentsTab.vue'
import { useI18n } from 'vue-i18n'

const { success, error } = useToast()
const { getPaymentStatusColor } = useAppColors()
const { t } = useI18n()


const authStore = useAuthStore()
const tab = ref('upcoming')
const upcomingAppointments = ref<Appointment[]>([])
const pastAppointments = ref<Appointment[]>([])
const loadingAppointments = ref(false)
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

const paymentHeaders = computed(() => [
  { title: t('appointmentsView.appointment') + ':', key: 'appointment.date' },
  { title: t('admin.professional'), key: 'appointment.professional.profile.firstName' },
  { title: t('admin.status'), key: 'status' },
  { title: t('admin.actions'), key: 'actions', sortable: false }
])

// Admin state
const adminAppointments = ref<any[]>([])
const loadingAdmin = ref(false)
const loadingPatients = ref(false)
const loadingProfessionals = ref(false)
const loadingProfessionalsForFilter = ref(false)
const patientsList = ref<{ id: string; label: string }[]>([])
const professionalsList = ref<{ id: string; label: string }[]>([])
const adminFilters = reactive({
  date: '',
  startDate: '',
  endDate: '',
  status: '',
  patientId: '',
  professionalId: ''
})
const statusOptions = [
  { text: t('appointments.status.pending'), value: 'PENDING' },
  { text: t('appointments.status.confirmed'), value: 'CONFIRMED' },
  { text: t('appointments.status.completed'), value: 'COMPLETED' },
  { text: t('appointments.status.cancelled'), value: 'CANCELLED' },
  { text: t('appointments.status.noShow'), value: 'NO_SHOW' }
]
const adminHeaders = [
  { title: t('admin.date'), key: 'date' },
  { title: t('admin.time'), key: 'startTime' },
  { title: t('admin.patient'), key: 'patient' },
  { title: t('admin.professional'), key: 'professional' },
  { title: t('admin.status'), key: 'status' },
  { title: t('admin.paymentStatus'), key: 'paymentStatus' },
  { title: t('admin.actions'), key: 'actions', sortable: false }
]

// Dialogs
const cancelDialog = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

async function confirmCancelAppointment() {
  if (!selectedAppointment.value) return
  if (!cancelReason.value.trim()) {
    error(t('admin.enterCancellationReason'))
    return
  }
  cancelling.value = true
  try {
    await appointmentsService.cancel(selectedAppointment.value.id, cancelReason.value)
    cancelDialog.value = false
    await loadAppointments()
    success(t('admin.appointmentCancelledSuccess'))
  } catch (err) {
    error(t('admin.failedToCancelAppointment'))
  } finally {
    cancelling.value = false
  }
}

onMounted(async () => {
  if (authStore.user?.role === 'ADMIN') {
    await loadAdminAppointments()
    await loadPatients()
    await loadProfessionals()
  } else {
    await loadAppointments()
  }
})

// --- Admin Fetching ---
async function loadPatients() {
  loadingPatients.value = true
  try {
    const response = await api.get('/auth/users?role=PATIENT')
    patientsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''} (${u.email})`.trim()
    }))
  } catch (err) {
    console.error('Failed to load patients:', err)
    error(t('admin.failedToLoadPatients'))
  } finally {
    loadingPatients.value = false
  }
}

async function loadProfessionals() {
  loadingProfessionals.value = true
  loadingProfessionalsForFilter.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionalsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim()
    }))
  } catch (err) {
    console.error('Failed to load professionals:', err)
    error(t('admin.failedToLoadProfessionals'))
  } finally {
    loadingProfessionals.value = false
    loadingProfessionalsForFilter.value = false
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
  } catch (err) {
    console.error('Failed to load admin appointments:', err)
    error(t('admin.errorLoadingAppointments'))
  } finally {
    loadingAdmin.value = false
  }
}

function viewAppointmentAdmin(item: any) {
  selectedAppointment.value = item
  viewDialog.value = true
}

// --- Patient/Professional Logic ---
async function loadAppointments() {
  loadingAppointments.value = true
  try {
    let allAppointments: Appointment[] = []
    
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
  } catch (err) {
    console.error('Failed to load appointments:', err)
    error(t('appointmentsView.failedToLoadAppointments'))
  } finally {
    loadingAppointments.value = false
  }
}

async function loadPaymentRecords() {
  loadingPayments.value = true
  try {
    paymentRecords.value = await paymentsService.getMyPayments()
  } catch (err) {
    console.error('Failed to load payments:', err)
    error(t('appointmentsView.failedToLoadPaymentRecords'))
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
    success(t('appointmentsView.paymentUploadedSuccess'))
    paymentDialog.value = false
    await loadPaymentRecords()
  } catch (err) {
    error(t('appointmentsView.failedToUploadPayment'))
  } finally {
    uploading.value = false
  }
}
</script>


<style scoped>
.letter-spacing-1 { letter-spacing: 1px !important; }
</style>