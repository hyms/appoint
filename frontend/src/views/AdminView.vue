<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-md mx-auto">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-1">
          {{ $t('appointments.title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          Manage all your scheduled appointments here.
        </p>
      </v-col>
    </v-row>

    <!-- ADMIN VIEW -->
    <template v-if="authStore.user?.role === 'ADMIN'">
      <AdminAppointmentsTab 
        v-model:filters="appointmentFilters"
        :loading-patients="loadingPatients"
        :loading-professionals="loadingProfessionalsForFilter"
        :patients-list="patientsList"
        :professionals-list="professionalsList"
        @update-list="loadAppointments"
        @view-details="(item) => { selectedAppointment = item; viewDialog = true; }"
      />
      
      <v-dialog v-model="viewDialog" max-width="600">
        <v-card v-if="selectedAppointment">
          <v-card-title class="d-flex justify-space-between">
            <span>Appointment Details</span>
            <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
          </v-card-title>
          <v-card-text>
            <AppointmentDetailCard :appointment="selectedAppointment" />
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Cancel Appointment Dialog (Kept here for dependency reasons until componentized) -->
      <v-dialog v-model="cancelDialog" max-width="400">
        <v-card>
          <v-card-title>Cancel Appointment</v-card-title>
          <v-card-text>
            <p class="mb-4">Are you sure you want to cancel this appointment?</p>
            <v-textarea
              v-model="cancelReason"
              label="Cancellation Reason"
              rows="3"
              placeholder="Enter reason for cancellation"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn @click="cancelDialog = false">No</v-btn>
            <v-btn color="error" @click="confirmCancelAppointment" :loading="cancelling">Yes, Cancel</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <!-- PATIENT/PROFESSIONAL VIEW -->
    <template v-else>
      <v-tabs v-model="tab" color="primary" class="mb-6">
        <v-tab value="upcoming">Próximas</v-tab>
        <v-tab value="past">Pasadas</v-tab>
        <v-tab value="payments" v-if="showPaymentTab">Pagos</v-tab>
      </v-tabs>

      <v-window v-model="tab">
        <v-window-item value="upcoming">
          <AppointmentList
            :appointments="upcomingAppointments"
            :loading="loading"
            view-all-route="/appointments"
            :has-action="true"
          />
        </v-window-item>

        <v-window-item value="past">
          <AppointmentList
            :appointments="pastAppointments"
            :loading="loading"
            :view-all-route="null"
            :has-action="false"
          />
        </v-window-item>

        <v-window-item value="payments" v-if="showPaymentTab">
          <!-- Payment Tracking Table (Will be componentized later if needed) -->
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
                    variant="text"
                    @click="openPaymentDialog(item.appointment)"
                  >
                    Subir Pago
                  </v-btn>
                  <v-btn
                    v-if="item.status === 'UPLOADED'"
                    size="small"
                    color="info"
                    variant="text"
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
    </template>

    <!-- Modals remain here for now -->
    <v-dialog v-model="paymentDialog" max-width="500">
        <v-card class="pa-4">
          <v-card-title>Subir Comprobante de Pago</v-card-title>
          <v-card-text>
            <p class="mb-4">
              Cita: {{ selectedAppointment ? formatDate(selectedAppointment.date) : '' }}
            </p>
            <BaseInput
              v-model="paymentFile"
              type="file"
              label="Subir captura de pantalla del pago"
              accept="image/*"
              prepend-inner-icon="mdi-camera"
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
            <BaseButton
              color="primary"
              :loading="uploading"
              :disabled="!paymentFile"
              @click="uploadPayment"
            >
              Subir
            </BaseButton>
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

  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { paymentsService, type QRPayment } from '@/services/payments'
import { emergencyService } from '@/services/emergency'
import { strikesService } from '@/services/strikes'
import { slotsService } from '@/services/slots'
import { usersService, type User, type UpdateUserDto, type CreateUserDto } from '@/services/users'
import api from '@/services/api'
import { formatDate, formatTime } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import AppointmentList from '@/components/appointments/AppointmentList.vue'
import AppointmentDetailCard from '@/components/appointments/AppointmentDetailCard.vue' 
import AdminAppointmentsTab from './admin/AdminAppointmentsTab.vue'
import AdminSlotsTab from './admin/AdminSlotsTab.vue'
import AdminUsersTab from './admin/AdminUsersTab.vue'
import AdminProfessionalsTab from './admin/AdminProfessionalsTab.vue'
import AdminEmergencyTab from './admin/AdminEmergencyTab.vue'
import AdminStrikesTab from './admin/AdminStrikesTab.vue'

const { success, error } = useToast()

const authStore = useAuthStore()
const tab = ref('appointments')
const loading = ref(false)

// --- Appointments State ---
const appointments = ref<any[]>([])
const appointmentsLoading = ref(false)
const appointmentFilters = reactive({ startDate: '', endDate: '', status: '', patientId: '', professionalId: '' })
const appointmentHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'startTime' },
  { title: 'Patient', key: 'patient' },
  { title: 'Professional', key: 'professional' },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'paymentStatus' },
  { title: 'Actions', key: 'actions', sortable: false }
]
const statusOptions = [
  { text: 'Pendiente', value: 'PENDING' },
  { text: 'Confirmada', value: 'CONFIRMED' },
  { text: 'Completada', value: 'COMPLETED' },
  { text: 'Cancelada', value: 'CANCELLED' },
  { text: 'No Asistió', value: 'NO_SHOW' }
]

// --- Slots State ---
const slots = ref<any[]>([])
const slotsLoading = ref(false)
const slotFilters = reactive({ date: '', isBooked: undefined as boolean | undefined })
const slotHeaders = [
    { title: 'Date', key: 'date' }, { title: 'Start', key: 'startTime' }, { title: 'End', key: 'endTime' },
    { title: 'Status', key: 'isBooked' }, { title: 'Blocked', key: 'isBlocked' }, { title: 'Professional', key: 'professional.profile.lastName' },
    { title: 'Actions', key: 'actions', sortable: false }
]
const slotStatusOptions = [{ text: 'Available', value: false }, { text: 'Booked', value: true }]
const generateDialog = ref(false)
const generatingSlots = ref(false)
const generateData = reactive({ professionalId: '', startDate: '', endDate: '' })

// --- User State ---
const users = ref<User[]>([])
const usersLoading = ref(false)
const userDialog = ref(false)
const editingUser = ref<User | null>(null)
const savingUser = ref(false)
const userFilters = reactive({ role: '', isActive: undefined as boolean | undefined })
const userFormData = reactive<any>({ email: '', password: '', phone: '', firstName: '', lastName: '', dni: '', role: 'PATIENT', isActive: true })
const userFormRef = ref()
const roleOptions = [
  { text: 'Administrator', value: 'ADMIN' }, { text: 'Secretary', value: 'SECRETARY' },
  { text: 'Professional', value: 'PROFESSIONAL' }, { text: 'Patient', value: 'PATIENT' }
]
const activeOptions = [{ text: 'Active', value: true }, { text: 'Inactive', value: false }]

// --- Professional State ---
const professionalsList = ref<{ id: string; label: string }[]>([])
const loadingProfessionals = ref(false)
const loadingProfessionalsForFilter = ref(false)
const configTab = ref('schedule')

// --- General State ---
const paymentHeaders = [
  { title: 'Date', key: 'appointment.date' },
  { title: 'Professional', key: 'appointment.professional.profile.firstName' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
]
const paymentRecords = ref<any[]>([])
const loadingPayments = ref(false)
const paymentDialog = ref(false)
const paymentViewDialog = ref(false)
const selectedPayment = ref<QRPayment | null>(null)
const paymentFile = ref<File | null>(null)
const previewUrl = ref('')
const uploading = ref(false)

const showPaymentTab = computed(() => authStore.user?.role === 'PATIENT')

// --- Appointment View State (Replicated from AppointmentsView.vue) ---
const upcomingAppointments = ref<Appointment[]>([])
const pastAppointments = ref<Appointment[]>([])
const cancelDialog = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

// --- Global View State ---
const viewDialog = ref(false)
const selectedAppointment = ref<Appointment | null>(null)

// --- Emergency/Strikes State ---
const strikes = ref<any[]>([])
const emergencyStatus = reactive({ isActive: false, message: '' })

// --- Life Cycle & Fetching ---
onMounted(async () => {
  if (authStore.user?.role === 'ADMIN') {
    await loadAppointments() // Load appointment list for admin
    await loadPatients()
    await loadProfessionalsListForAdmin()
  }
  await loadEmergencyStatus()
  await loadStrikes()
})

// --- Appointment Admin Logic ---
async function loadAppointments() {
  appointmentsLoading.value = true
  try {
    const params: any = { page: 1, limit: 50 }
    if (appointmentFilters.startDate) params.startDate = appointmentFilters.startDate
    if (appointmentFilters.endDate) params.endDate = appointmentFilters.endDate
    if (appointmentFilters.status) params.status = appointmentFilters.status
    if (appointmentFilters.patientId) params.patientId = appointmentFilters.patientId
    if (appointmentFilters.professionalId) params.professionalId = appointmentFilters.professionalId
    
    const response = await appointmentsService.getAll(params)
    appointments.value = response.data || response
  } catch (error) {
    console.error('Failed to load admin appointments:', error)
    error('Error loading admin appointments')
  } finally {
    appointmentsLoading.value = false
  }
}

async function loadAdminAppointments() { await loadAppointments() }

function viewAppointmentAdmin(item: any) {
  selectedAppointment.value = item
  viewDialog.value = true
}

async function confirmCancelAppointment() {
  if (!cancelReason.value.trim()) {
    error('Please enter a cancellation reason')
    return
  }
  cancelling.value = true
  try {
    await appointmentsService.cancel(selectedAppointment.value.id, cancelReason.value)
    cancelDialog.value = false
    await loadAppointments()
    success('Appointment cancelled')
  } catch (err) {
    error('Failed to cancel appointment')
  } finally {
    cancelling.value = false
  }
}

// --- Slots Logic ---
async function loadSlots() {
  slotsLoading.value = true
  try {
    const params: any = { page: 1, limit: 20 }
    if (slotFilters.date) params.date = slotFilters.date
    if (slotFilters.isBooked !== undefined) params.isBooked = slotFilters.isBooked
    
    const response = await slotsService.getAll(params)
    slots.value = response.data || response
  } catch (error) {
    console.error('Failed to load slots:', error)
    error('Error loading slots')
  } finally {
    slotsLoading.value = false
  }
}

async function generateSlots() {
    generatingSlots.value = true
    try {
        await slotsService.generate({
            professionalId: generateData.professionalId,
            startDate: generateData.startDate,
            endDate: generateData.endDate
        })
        success('Slots generated successfully')
        generateDialog.value = false
        await loadSlots()
    } catch (err) {
        error('Failed to generate slots')
    } finally {
        generatingSlots.value = false
    }
}

async function blockSlot(slot: any) {
  const reason = prompt('Enter block reason:')
  if (reason) {
    try {
      await slotsService.block(slot.id, reason)
      await loadSlots()
      success('Slot blocked')
    } catch (err) {
      error('Failed to block slot')
    }
  }
}

async function unblockSlot(slot: any) {
  try {
    await slotsService.unblock(slot.id)
    await loadSlots()
    success('Slot unblocked')
  } catch (err) {
    error('Failed to unblock slot')
  }
}

async function deleteSlot(slot: any) {
  if (confirm(`Are you sure you want to delete the slot from ${formatDate(slot.date)}?`)) {
    try {
      await slotsService.delete(slot.id)
      await loadSlots()
      success('Slot deleted')
    } catch (err) {
      error('Failed to delete slot')
    }
  }
}

// --- User Logic ---
async function loadUsers() {
  usersLoading.value = true
  try {
    const params: any = {}
    if (userFilters.role) params.role = userFilters.role
    if (userFilters.isActive !== undefined) params.isActive = userFilters.isActive
    users.value = await usersService.getAll(params.role)
  } catch (error) {
    console.error('Failed to load users:', error)
    error('Error loading users')
  } finally {
    usersLoading.value = false
  }
}

function openUserDialog(user?: User) {
  // Logic implemented in AdminUsersTab component
}

async function saveUser() {
  // Logic implemented in AdminUsersTab component
}

async function deleteUser(user: User) {
  // Logic implemented in AdminUsersTab component
}

// --- Professional Logic ---
async function loadProfessionalsListForAdmin() {
  loadingProfessionals.value = true
  loadingProfessionalsForFilter.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionalsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim()
    }))
    if (generateData.professionalId === '' && professionalsList.value.length > 0) {
        generateData.professionalId = professionalsList.value[0]!.id
    }
  } catch (error) {
    console.error('Failed to load professionals:', error)
    error('Failed to load professionals')
  } finally {
    loadingProfessionals.value = false
    loadingProfessionalsForFilter.value = false
  }
}

// --- General/Misc Logic (For Patient/Pro & Admin) ---
async function loadData() {
  loading.value = true
  try {
    strikes.value = await strikesService.getAll()
    const status = await emergencyService.getStatus()
    emergencyStatus.isActive = status.isActive
    emergencyStatus.message = status.message || ''
  } catch (error) {
    console.error('Failed to load general data:', error)
  } finally {
    loading.value = false
  }
}

async function loadEmergencyStatus() {
    try {
        const status = await emergencyService.getStatus()
        emergencyStatus.isActive = status.isActive
        emergencyStatus.message = status.message || ''
    } catch (e) {
        error('Could not retrieve emergency status.')
    }
}

async function loadStrikes() {
    loading.value = true
    try {
        strikes.value = await strikesService.getAll()
    } catch (e) {
        error('Failed to load strikes.')
    } finally {
        loading.value = false
    }
}

// --- Payment Logic ---
async function loadPaymentRecords() {
  loadingPayments.value = true
  try {
    paymentRecords.value = await paymentsService.getAll() 
  } catch (error) {
    console.error('Failed to load payments:', error)
    error('Failed to load payment records')
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
    success('Payment uploaded successfully!')
    paymentDialog.value = false
    await loadPaymentRecords()
  } catch (err) {
    error('Failed to upload payment')
  } finally {
    uploading.value = false
  }
}

// --- Patient-side Appointment Logic (For reference) ---
async function loadAppointments() {
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
  } catch (error) {
    console.error('Failed to load appointments:', error)
    error('Failed to load appointments')
  }
}

async function cancelAppointment(apt: Appointment) {
  if (confirm('Are you sure you want to cancel this appointment?')) {
    try {
      await appointmentsService.cancel(apt.id, 'Cancelled by patient')
      upcomingAppointments.value = upcomingAppointments.value.filter(a => a.id !== apt.id)
      success('Appointment cancelled')
    } catch (err) {
      error('Failed to cancel appointment')
    }
  }
}

// --- Utility Functions ---
function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'warning', CONFIRMED: 'success', COMPLETED: 'info', CANCELLED: 'error', NO_SHOW: 'error'
  }
  return colors[status] || 'grey'
}

function getPaymentColor(status: string | undefined) {
  if (!status) return 'grey'
  const colors: Record<string, string> = {
    PENDING: 'warning', UPLOADED: 'info', VERIFIED: 'success', REJECTED: 'error'
  }
  return colors[status] || 'grey'
}
</script>

<style scoped>
.letter-spacing-1 { letter-spacing: 1px !important; }
.gap-2 { gap: 8px; }
.admin-tab-card { border-radius: 8px !important; border: 1px solid rgba(var(--v-border-color), 0.4) !important; }
.border-bottom-thick { border-bottom: 2px solid rgba(var(--v-border-color), 0.15) !important; }
.data-table-industrial { border-radius: 6px !important; }
</style>