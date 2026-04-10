<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-md mx-auto">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-1">
          {{ pageTitle }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mb-6">
          {{ pageDescription }}
        </p>
      </v-col>
    </v-row>

    <!-- ADMIN VIEW -->
    <template v-if="authStore.user?.role === 'ADMIN'">
      <v-card variant="flat">
        <v-tabs v-model="adminTab" color="primary" grow>
          <v-tab value="appointments">{{ $t('appointments.title') }}</v-tab>
          <v-tab value="slots">{{ $t('admin.schedules') }}</v-tab>
          <v-tab value="users">{{ $t('admin.users') }}</v-tab>
          <v-tab value="professionals">{{ $t('admin.professionals') }}</v-tab>
        </v-tabs>

        <v-divider />

        <v-window v-model="adminTab">
          <v-window-item value="appointments" class="pa-4">
            <AdminAppointmentsTab
              v-model:filters="appointmentFilters"
              :appointments="appointments"
              :loading="appointmentsLoading"
              :headers="appointmentHeaders"
              :status-options="statusOptions"
              :loading-patients="loadingPatients"
              :loading-professionals="loadingProfessionalsForFilter"
              :patients-list="patientsList"
              :professionals-list="professionalsList"
              @update-list="loadAppointments"
              @view-details="viewAppointmentAdmin"
            />
          </v-window-item>

          <v-window-item value="slots" class="pa-4">
            <AdminSlotsTab
              :slots="slots"
              :loading="slotsLoading"
              :filters="slotFilters"
              :slot-status-options="slotStatusOptions"
              :headers="slotHeaders"
              :loading-professionals="loadingProfessionals"
              :professionals-list="professionalsList"
              @update-list="loadSlots"
              @open-generate-dialog="generateDialog = true"
              @block-slot="blockSlot"
              @unblock-slot="unblockSlot"
              @delete-slot="deleteSlot"
            />
          </v-window-item>

          <v-window-item value="users" class="pa-4">
            <AdminUsersTab v-model="userFilters" @delete-user="deleteUser" />
          </v-window-item>

          <v-window-item value="professionals" class="pa-4">
            <AdminProfessionalsTab
              :professionals-list="professionalsList"
              :loading-professionals="loadingProfessionals"
            />
          </v-window-item>
        </v-window>
      </v-card>

      <v-dialog v-model="generateDialog" max-width="600">
        <GenerateSlotDialog
          :professionals-list="professionalsList"
          :loading-professionals="loadingProfessionals"
          @generate="handleGenerateSlots"
          @close="generateDialog = false"
        />
      </v-dialog>

      <v-dialog v-model="viewDialog" max-width="600">
        <v-card v-if="selectedAppointment">
          <v-card-title class="d-flex justify-space-between">
            <span>{{ $t('admin.appointmentDetails') }}</span>
            <v-btn
              icon="mdi-close"
              variant="text"
              @click="viewDialog = false"
              :aria-label="$t('common.close')"
            />
          </v-card-title>
          <v-card-text>
            <AppointmentDetailCard :appointment="selectedAppointment" />
          </v-card-text>
        </v-card>
      </v-dialog>

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
            <v-btn color="error" @click="confirmCancelAppointment" :loading="cancelling">{{
              $t('admin.yesCancel')
            }}</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { slotsService } from '@/services/slots'
import { usersService, type User } from '@/services/users'
import api from '@/services/api'
import { formatDate } from '@/utils/date'
import { useToast } from '@/composables/useToast'
import AdminAppointmentsTab from '../components/admin/AdminAppointmentsTab.vue'
import AdminSlotsTab from '../components/admin/AdminSlotsTab.vue'
import AdminUsersTab from '../components/admin/AdminUsersTab.vue'
import AdminProfessionalsTab from '../components/admin/AdminProfessionalsTab.vue'
import GenerateSlotDialog from '../components/admin/GenerateSlotDialog.vue'
import AppointmentDetailCard from '@/components/appointments/AppointmentDetailCard.vue'

const { success, error } = useToast()
const authStore = useAuthStore()
const adminTab = ref('appointments')

// Use i18n for computed properties
import { useI18n } from 'vue-i18n'
const { t } = useI18n()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    appointments: t('admin.administration'),
    slots: t('admin.schedules'),
    users: t('admin.users'),
    professionals: t('admin.professionals'),
  }
  return titles[adminTab.value] || t('admin.administration')
})

const pageDescription = computed(() => {
  const descriptions: Record<string, string> = {
    appointments: t('admin.manageAppointments'),
    slots: t('admin.manageSchedules'),
    users: t('admin.manageUsers'),
    professionals: t('admin.manageProfessionals'),
  }
  return descriptions[adminTab.value] || ''
})

// --- Appointments State ---
const appointments = ref<any[]>([])
const appointmentsLoading = ref(false)
const loadingPatients = ref(false)
const patientsList = ref<{ id: string; label: string }[]>([])
const loadingProfessionalsForFilter = ref(false)
const appointmentFilters = reactive({
  date: '',
  startDate: '',
  endDate: '',
  status: '',
  patientId: '',
  professionalId: '',
})
const appointmentHeaders = computed(() => [
  { title: t('admin.date'), key: 'date' },
  { title: t('admin.time'), key: 'startTime' },
  { title: t('admin.patient'), key: 'patient' },
  { title: t('admin.professional'), key: 'professional' },
  { title: t('admin.status'), key: 'status' },
  { title: t('admin.paymentStatus'), key: 'paymentStatus' },
  { title: t('admin.actions'), key: 'actions', sortable: false },
])
const statusOptions = [
  { text: 'Pendiente', value: 'PENDING' },
  { text: 'Confirmada', value: 'CONFIRMED' },
  { text: 'Completada', value: 'COMPLETED' },
  { text: 'Cancelada', value: 'CANCELLED' },
  { text: 'No Asistió', value: 'NO_SHOW' },
]

// --- Slots State ---
const slots = ref<any[]>([])
const slotsLoading = ref(false)
const slotFilters = reactive({ date: '', isBooked: undefined as boolean | undefined })
const slotHeaders = computed(() => [
  { title: t('admin.date'), key: 'date' },
  { title: t('admin.start'), key: 'startTime' },
  { title: t('admin.end'), key: 'endTime' },
  { title: t('admin.status'), key: 'isBooked' },
  { title: t('admin.blocked'), key: 'isBlocked' },
  { title: t('admin.professional'), key: 'professional.profile.lastName' },
  { title: t('admin.actions'), key: 'actions', sortable: false },
])
const slotStatusOptions = [
  { text: t('admin.available'), value: false },
  { text: t('admin.booked'), value: true },
]
const generateDialog = ref(false)

// --- User State ---
const userFilters = reactive({ role: '', isActive: undefined as boolean | undefined })

// --- Professional State ---
const professionalsList = ref<{ id: string; label: string }[]>([])
const loadingProfessionals = ref(false)

// --- General State ---
const viewDialog = ref(false)
const selectedAppointment = ref<Appointment | null>(null)

// --- Cancel State ---
const cancelDialog = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

// --- Life Cycle & Fetching ---
onMounted(async () => {
  if (authStore.user?.role === 'ADMIN') {
    await loadAppointments()
    await loadSlots()
    await loadPatients()
    await loadProfessionalsListForAdmin()
  }
})

// --- Logic ---
async function loadAppointments() {
  appointmentsLoading.value = true
  try {
    const params: any = { page: 1, limit: 50 }
    if (appointmentFilters.date) params.date = appointmentFilters.date
    if (appointmentFilters.startDate) params.startDate = appointmentFilters.startDate
    if (appointmentFilters.endDate) params.endDate = appointmentFilters.endDate
    if (appointmentFilters.status) params.status = appointmentFilters.status
    if (appointmentFilters.patientId) params.patientId = appointmentFilters.patientId
    if (appointmentFilters.professionalId) params.professionalId = appointmentFilters.professionalId

    const response = await appointmentsService.getAll(params)
    appointments.value = response.data || response
  } catch (err) {
    console.error('Failed to load admin appointments:', err)
    error(t('admin.errorLoadingAppointments'))
  } finally {
    appointmentsLoading.value = false
  }
}

function viewAppointmentAdmin(item: any) {
  selectedAppointment.value = item
  viewDialog.value = true
}

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

async function loadSlots() {
  slotsLoading.value = true
  try {
    const params: any = { page: 1, limit: 20 }
    if (slotFilters.date) params.date = slotFilters.date
    if (slotFilters.isBooked !== undefined) params.isBooked = slotFilters.isBooked
    const response = await slotsService.getAll(params)
    slots.value = response.data || response
  } catch (err) {
    console.error('Failed to load slots:', err)
    error(t('admin.errorLoadingSlots'))
  } finally {
    slotsLoading.value = false
  }
}

async function handleGenerateSlots() {
  await loadSlots()
  success(t('admin.slotsGeneratedSuccess'))
}

async function blockSlot(slot: any) {
  const reason = prompt(t('admin.enterBlockReason'))
  if (reason) {
    try {
      await slotsService.block(slot.id, reason)
      await loadSlots()
      success(t('admin.slotBlockedSuccess'))
    } catch (err) {
      error(t('admin.failedToBlockSlot'))
    }
  }
}

async function unblockSlot(slot: any) {
  try {
    await slotsService.unblock(slot.id)
    await loadSlots()
    success(t('admin.slotUnblockedSuccess'))
  } catch (err) {
    error(t('admin.failedToUnblockSlot'))
  }
}

async function deleteSlot(slot: any) {
  if (confirm(t('admin.confirmDeleteSlot', { date: formatDate(slot.date) }))) {
    try {
      await slotsService.delete(slot.id)
      await loadSlots()
      success(t('admin.slotDeletedSuccess'))
    } catch (err) {
      error(t('admin.failedToDeleteSlot'))
    }
  }
}

async function loadUsers() {
  // Handled internally by AdminUsersTab
}

async function deleteUser(user: User) {
  if (confirm(t('admin.confirmDeleteUser', { email: user.email }))) {
    try {
      await usersService.delete(user.id)
      success(t('admin.userDeletedSuccess'))
      await loadUsers()
    } catch (e) {
      error(t('admin.failedToDeleteUser'))
    }
  }
}

async function loadProfessionalsListForAdmin() {
  loadingProfessionals.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionalsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.firstName || ''} ${u.lastName || ''} (${u.email})`.trim(),
    }))
  } catch (err) {
    console.error('Failed to load professionals:', err)
    error(t('admin.failedToLoadProfessionals'))
  } finally {
    loadingProfessionals.value = false
  }
}

async function loadPatients() {
  loadingPatients.value = true
  try {
    const response = await api.get('/auth/users?role=PATIENT')
    patientsList.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''} (${u.email})`.trim(),
    }))
  } catch (err) {
    console.error('Failed to load patients:', err)
    error(t('admin.failedToLoadPatients'))
  } finally {
    loadingPatients.value = false
  }
}
</script>
