<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('dashboard.admin') }}</h1>
      </v-col>
    </v-row>

    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="appointments">Appointments</v-tab>
      <v-tab value="slots">Slots</v-tab>
      <v-tab value="professionals">Profesionales</v-tab>
      <v-tab value="emergency">{{ $t('dashboard.emergencies') }}</v-tab>
      <v-tab value="strikes">Strikes</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="appointments">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Appointment Management</span>
            <v-btn color="primary" size="small" @click="refreshAppointments" prepend-icon="mdi-refresh">
              Refresh
            </v-btn>
          </v-card-title>
          <v-card-text>
            <!-- Filters -->
            <v-row class="mb-4">
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="appointmentFilters.startDate"
                  label="Start Date"
                  type="date"
                  density="compact"
                  clearable
                  @update:model-value="loadAppointments"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-text-field
                  v-model="appointmentFilters.endDate"
                  label="End Date"
                  type="date"
                  density="compact"
                  clearable
                  @update:model-value="loadAppointments"
                />
              </v-col>
              <v-col cols="12" md="2">
                <v-select
                  v-model="appointmentFilters.status"
                  label="Status"
                  :items="statusOptions"
                  item-title="text"
                  item-value="value"
                  density="compact"
                  clearable
                  @update:model-value="loadAppointments"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="appointmentFilters.patientId"
                  label="Patient ID"
                  density="compact"
                  clearable
                  placeholder="Filter by patient ID"
                  @update:model-value="loadAppointments"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="appointmentFilters.professionalId"
                  label="Professional ID"
                  density="compact"
                  clearable
                  placeholder="Filter by professional ID"
                  @update:model-value="loadAppointments"
                />
              </v-col>
            </v-row>

            <v-data-table
              :headers="appointmentHeaders"
              :items="appointments"
              :loading="appointmentsLoading"
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
                <v-chip :color="getPaymentColor(item.paymentStatus)" size="x-small" variant="outlined">
                  {{ item.paymentStatus || 'N/A' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-menu>
                  <template v-slot:activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-dots-vertical" size="small" variant="text" />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="viewAppointment(item)">
                      <template v-slot:prepend>
                        <v-icon size="small">mdi-eye</v-icon>
                      </template>
                      <v-list-item-title>View Details</v-list-item-title>
                    </v-list-item>
                    <v-list-item 
                      v-if="item.status === 'PENDING'" 
                      @click="confirmAppointment(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon size="small" color="success">mdi-check</v-icon>
                      </template>
                      <v-list-item-title>Confirm</v-list-item-title>
                    </v-list-item>
                    <v-list-item 
                      v-if="item.status === 'CONFIRMED'" 
                      @click="completeAppointment(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon size="small" color="info">mdi-check-all</v-icon>
                      </template>
                      <v-list-item-title>Mark Complete</v-list-item-title>
                    </v-list-item>
                    <v-list-item 
                      v-if="item.status === 'PENDING' || item.status === 'CONFIRMED'" 
                      @click="noShowAppointment(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon size="small" color="warning">mdi-account-off</v-icon>
                      </template>
                      <v-list-item-title>No Show</v-list-item-title>
                    </v-list-item>
                    <v-list-item 
                      v-if="item.status !== 'CANCELLED' && item.status !== 'NO_SHOW'" 
                      @click="cancelAppointmentDialog(item)"
                    >
                      <template v-slot:prepend>
                        <v-icon size="small" color="error">mdi-cancel</v-icon>
                      </template>
                      <v-list-item-title>Cancel</v-list-item-title>
                    </v-list-item>
                    <v-divider class="my-1" />
                    <v-list-item @click="deleteAppointment(item)" :disabled="item.status === 'PENDING' || item.status === 'CONFIRMED'">
                      <template v-slot:prepend>
                        <v-icon size="small" color="error">mdi-delete</v-icon>
                      </template>
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- View Appointment Dialog -->
        <v-dialog v-model="viewDialog" max-width="600">
          <v-card v-if="selectedAppointment">
            <v-card-title class="d-flex justify-space-between">
              <span>Appointment Details</span>
              <v-btn icon="mdi-close" variant="text" @click="viewDialog = false" />
            </v-card-title>
            <v-card-text>
              <v-list>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">ID</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedAppointment.id }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">Date & Time</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDate(selectedAppointment.date) }} {{ formatTime(selectedAppointment.startTime) }} - {{ formatTime(selectedAppointment.endTime) }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">Patient</v-list-item-title>
                  <v-list-item-subtitle v-if="selectedAppointment.patient">
                    {{ selectedAppointment.patient.profile?.firstName }} {{ selectedAppointment.patient.profile?.lastName }} ({{ selectedAppointment.patient.email }})
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">Professional</v-list-item-title>
                  <v-list-item-subtitle v-if="selectedAppointment.professional">
                    {{ selectedAppointment.professional.profile?.firstName }} {{ selectedAppointment.professional.profile?.lastName }} ({{ selectedAppointment.professional.email }})
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip :color="getStatusColor(selectedAppointment.status)" size="small">
                      {{ selectedAppointment.status }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item>
                  <v-list-item-title class="text-caption text-medium-emphasis">Payment Status</v-list-item-title>
                  <v-list-item-subtitle>
                    <v-chip :color="getPaymentColor(selectedAppointment.paymentStatus)" size="small">
                      {{ selectedAppointment.paymentStatus || 'N/A' }}
                    </v-chip>
                  </v-list-item-subtitle>
                </v-list-item>
                <v-list-item v-if="selectedAppointment.notes">
                  <v-list-item-title class="text-caption text-medium-emphasis">Notes</v-list-item-title>
                  <v-list-item-subtitle>{{ selectedAppointment.notes }}</v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-dialog>

        <!-- Cancel Appointment Dialog -->
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
      </v-window-item>

      <v-window-item value="slots">
        <v-card>
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Slot Management</span>
            <v-btn color="primary" size="small" @click="openGenerateDialog">
              Generate Slots
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-row class="mb-4">
              <v-col cols="12" md="3">
                <v-text-field
                  v-model="slotFilters.date"
                  label="Filter by Date"
                  type="date"
                  density="compact"
                  clearable
                  @update:model-value="loadSlots"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-model="slotFilters.isBooked"
                  label="Filter by Status"
                  :items="slotStatusOptions"
                  item-title="text"
                  item-value="value"
                  density="compact"
                  clearable
                  @update:model-value="loadSlots"
                />
              </v-col>
              <v-col cols="12" md="6" class="d-flex align-center">
                <v-spacer />
                <v-btn color="primary" variant="text" @click="loadSlots" prepend-icon="mdi-refresh">
                  Refresh
                </v-btn>
              </v-col>
            </v-row>

            <v-data-table
              :headers="slotHeaders"
              :items="slots"
              :loading="slotsLoading"
              :items-per-page="10"
            >
              <template v-slot:item.date="{ item }">
                {{ formatDate(item.date) }}
              </template>
              <template v-slot:item.startTime="{ item }">
                {{ formatTime(item.startTime) }}
              </template>
              <template v-slot:item.endTime="{ item }">
                {{ formatTime(item.endTime) }}
              </template>
              <template v-slot:item.isBooked="{ item }">
                <v-chip :color="item.isBooked ? 'warning' : 'success'" size="small">
                  {{ item.isBooked ? 'Booked' : 'Available' }}
                </v-chip>
              </template>
              <template v-slot:item.isBlocked="{ item }">
                <v-chip :color="item.isBlocked ? 'error' : 'default'" size="small" :variant="item.isBlocked ? 'flat' : 'outlined'">
                  {{ item.isBlocked ? 'Blocked' : 'Open' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="!item.isBlocked"
                  size="small"
                  color="error"
                  variant="tonal"
                  @click="blockSlot(item)"
                  :disabled="item.isBooked"
                >
                  Block
                </v-btn>
                <v-btn
                  v-else
                  size="small"
                  color="success"
                  variant="tonal"
                  @click="unblockSlot(item)"
                >
                  Unblock
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  variant="text"
                  icon="mdi-delete"
                  @click="deleteSlot(item)"
                  :disabled="item.isBooked"
                />
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>

        <!-- Generate Slots Dialog -->
        <v-dialog v-model="generateDialog" max-width="500">
          <v-card>
            <v-card-title>Generate Slots</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="generateData.professionalId"
                label="Professional ID"
                placeholder="Enter professional ID"
              />
              <v-text-field
                v-model="generateData.startDate"
                label="Start Date"
                type="date"
              />
              <v-text-field
                v-model="generateData.endDate"
                label="End Date"
                type="date"
              />
            </v-card-text>
            <v-card-actions>
              <v-spacer />
              <v-btn @click="generateDialog = false">Cancel</v-btn>
              <v-btn color="primary" @click="generateSlots" :loading="generatingSlots">
                Generate
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </v-window-item>

      <v-window-item value="emergency">
        <v-card>
          <v-card-title>{{ $t('dashboard.emergencies') }}</v-card-title>
          <v-card-text>
            <v-alert v-if="emergencyStatus.isActive" type="error" class="mb-4">
              Emergency mode is ACTIVE
              <br>{{ emergencyStatus.message }}
            </v-alert>
            <v-btn
              v-if="!emergencyStatus.isActive"
              color="error"
              @click="activateEmergency"
            >
              Activate Emergency
            </v-btn>
            <v-btn
              v-else
              color="success"
              @click="deactivateEmergency"
            >
              Deactivate Emergency
            </v-btn>
          </v-card-text>
        </v-card>
      </v-window-item>

      <v-window-item value="professionals">
        <ProfessionalConfigAdmin />
      </v-window-item>

      <v-window-item value="strikes">
        <v-card>
          <v-card-title>Strike Management</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="strikeHeaders"
              :items="strikes"
              :loading="loading"
            >
              <template v-slot:item.isActive="{ item }">
                <v-chip :color="item.isActive ? 'error' : 'success'" size="small">
                  {{ item.isActive ? 'Active' : 'Resolved' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.isActive"
                  size="small"
                  color="success"
                  @click="resolveStrike(item.id)"
                >
                  Resolve
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { appointmentsService, emergencyService, strikesService, slotsService } from '@/services/appointments'
import ProfessionalConfigAdmin from '@/components/ProfessionalConfigAdmin.vue'

const tab = ref('appointments')
const loading = ref(false)

// Appointments state
const appointments = ref<any[]>([])
const appointmentsLoading = ref(false)
const appointmentsMeta = ref({ total: 0, page: 1, limit: 10, totalPages: 0 })
const appointmentFilters = reactive({
  startDate: '',
  endDate: '',
  status: '',
  patientId: '',
  professionalId: ''
})
const statusOptions = [
  { text: 'Pending', value: 'PENDING' },
  { text: 'Confirmed', value: 'CONFIRMED' },
  { text: 'Completed', value: 'COMPLETED' },
  { text: 'Cancelled', value: 'CANCELLED' },
  { text: 'No Show', value: 'NO_SHOW' }
]
const appointmentHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Time', key: 'startTime' },
  { title: 'Patient', key: 'patient' },
  { title: 'Professional', key: 'professional' },
  { title: 'Status', key: 'status' },
  { title: 'Payment', key: 'paymentStatus' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Dialogs
const viewDialog = ref(false)
const cancelDialog = ref(false)
const selectedAppointment = ref<any>(null)
const cancelReason = ref('')
const cancelling = ref(false)

// Slots state
const slots = ref<any[]>([])
const slotsLoading = ref(false)
const slotsMeta = ref({ total: 0, page: 1, limit: 10, totalPages: 0 })
const slotFilters = reactive({
  date: '',
  isBooked: undefined as boolean | undefined
})
const slotStatusOptions = [
  { text: 'Available', value: false },
  { text: 'Booked', value: true }
]
const slotHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Start', key: 'startTime' },
  { title: 'End', key: 'endTime' },
  { title: 'Status', key: 'isBooked' },
  { title: 'Blocked', key: 'isBlocked' },
  { title: 'Professional', key: 'professional.email' },
  { title: 'Actions', key: 'actions', sortable: false }
]

// Generate dialog
const generateDialog = ref(false)
const generatingSlots = ref(false)
const generateData = reactive({
  professionalId: '2c9ab7c4-5d4f-4edc-b93c-08bc3daa1b55',
  startDate: '',
  endDate: ''
})

// Legacy state
const slotStartDate = ref('')
const slotEndDate = ref('')

const strikes = ref<any[]>([])
const emergencyStatus = reactive({ isActive: false, message: '' })

const strikeHeaders = [
  { title: 'Date', key: 'strikeDate' },
  { title: 'Patient', key: 'patient.profile.firstName' },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'isActive' },
  { title: 'Actions', key: 'actions', sortable: false }
]

onMounted(async () => {
  await loadData()
  await loadAppointments()
  await loadSlots()
})

async function loadData() {
  loading.value = true
  try {
    strikes.value = await strikesService.getProfessionalStrikes()
    const status = await emergencyService.getStatus()
    emergencyStatus.isActive = status.isActive
    emergencyStatus.message = status.message || ''
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    loading.value = false
  }
}

// Appointments functions
async function loadAppointments() {
  appointmentsLoading.value = true
  try {
    const params: any = { page: 1, limit: 20 }
    if (appointmentFilters.startDate) params.startDate = appointmentFilters.startDate
    if (appointmentFilters.endDate) params.endDate = appointmentFilters.endDate
    if (appointmentFilters.status) params.status = appointmentFilters.status
    if (appointmentFilters.patientId) params.patientId = appointmentFilters.patientId
    if (appointmentFilters.professionalId) params.professionalId = appointmentFilters.professionalId
    
    const response = await appointmentsService.getAll(params)
    appointments.value = response.data || response
    appointmentsMeta.value = response.meta || { total: appointments.value.length, page: 1, limit: 20, totalPages: 1 }
  } catch (error) {
    console.error('Failed to load appointments:', error)
  } finally {
    appointmentsLoading.value = false
  }
}

async function refreshAppointments() {
  await loadAppointments()
}

function viewAppointment(item: any) {
  selectedAppointment.value = item
  viewDialog.value = true
}

async function confirmAppointment(item: any) {
  try {
    await appointmentsService.updateStatus(item.id, 'CONFIRMED')
    await loadAppointments()
  } catch (error) {
    alert('Failed to confirm appointment')
  }
}

async function completeAppointment(item: any) {
  try {
    await appointmentsService.updateStatus(item.id, 'COMPLETED')
    await loadAppointments()
  } catch (error) {
    alert('Failed to complete appointment')
  }
}

async function noShowAppointment(item: any) {
  if (confirm('Mark this appointment as No Show?')) {
    try {
      await appointmentsService.updateStatus(item.id, 'NO_SHOW')
      await loadAppointments()
    } catch (error) {
      alert('Failed to mark as no show')
    }
  }
}

function cancelAppointmentDialog(item: any) {
  selectedAppointment.value = item
  cancelReason.value = ''
  cancelDialog.value = true
}

async function confirmCancelAppointment() {
  if (!cancelReason.value.trim()) {
    alert('Please enter a cancellation reason')
    return
  }
  cancelling.value = true
  try {
    await appointmentsService.cancel(selectedAppointment.value.id, cancelReason.value)
    cancelDialog.value = false
    await loadAppointments()
  } catch (error) {
    alert('Failed to cancel appointment')
  } finally {
    cancelling.value = false
  }
}

async function deleteAppointment(item: any) {
  if (confirm(`Are you sure you want to delete this appointment?`)) {
    try {
      await appointmentsService.delete(item.id)
      await loadAppointments()
    } catch (error) {
      alert('Failed to delete appointment')
    }
  }
}

// Slots functions
async function loadSlots() {
  slotsLoading.value = true
  try {
    const params: any = { page: 1, limit: 20 }
    if (slotFilters.date) params.date = slotFilters.date
    if (slotFilters.isBooked !== undefined) params.isBooked = slotFilters.isBooked
    
    const response = await slotsService.getAll(params)
    slots.value = response.data || response
    slotsMeta.value = response.meta || { total: slots.value.length, page: 1, limit: 20, totalPages: 1 }
  } catch (error) {
    console.error('Failed to load slots:', error)
  } finally {
    slotsLoading.value = false
  }
}

function openGenerateDialog() {
  generateDialog.value = true
}

async function generateSlots() {
  generatingSlots.value = true
  try {
    await slotsService.generate({
      professionalId: generateData.professionalId,
      startDate: generateData.startDate,
      endDate: generateData.endDate
    })
    alert('Slots generated successfully')
    generateDialog.value = false
    await loadSlots()
  } catch (error) {
    alert('Failed to generate slots')
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
    } catch (error) {
      alert('Failed to block slot')
    }
  }
}

async function unblockSlot(slot: any) {
  try {
    await slotsService.unblock(slot.id)
    await loadSlots()
  } catch (error) {
    alert('Failed to unblock slot')
  }
}

async function deleteSlot(slot: any) {
  if (confirm(`Are you sure you want to delete the slot from ${formatDate(slot.date)}?`)) {
    try {
      await slotsService.delete(slot.id)
      await loadSlots()
    } catch (error) {
      alert('Failed to delete slot')
    }
  }
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

function formatTime(timeStr: string) {
  if (!timeStr) return ''
  return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function updateStatus(id: string, status: string) {
  try {
    await appointmentsService.updateStatus(id, status)
    await loadData()
  } catch (error) {
    alert('Failed to update status')
  }
}

async function cancelAppointment(item: any) {
  if (confirm('Cancel this appointment?')) {
    try {
      await appointmentsService.cancel(item.id, 'Cancelled by admin')
      await loadData()
    } catch (error) {
      alert('Failed to cancel')
    }
  }
}

async function activateEmergency() {
  const message = prompt('Enter emergency message:')
  if (message) {
    try {
      await emergencyService.activate(message)
      await loadData()
    } catch (error) {
      alert('Failed to activate emergency')
    }
  }
}

async function deactivateEmergency() {
  const reason = prompt('Enter deactivation reason:')
  if (reason) {
    try {
      await emergencyService.deactivate(reason)
      await loadData()
    } catch (error) {
      alert('Failed to deactivate emergency')
    }
  }
}

async function resolveStrike(id: string) {
  const resolution = prompt('Enter resolution notes:')
  if (resolution) {
    try {
      await strikesService.resolve(id, resolution)
      await loadData()
    } catch (error) {
      alert('Failed to resolve strike')
    }
  }
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    COMPLETED: 'info',
    CANCELLED: 'error',
    NO_SHOW: 'orange'
  }
  return colors[status] || 'grey'
}

function getPaymentColor(status: string | undefined) {
  if (!status) return 'grey'
  const colors: Record<string, string> = {
    PENDING: 'warning',
    UPLOADED: 'info',
    VERIFIED: 'success',
    REJECTED: 'error'
  }
  return colors[status] || 'grey'
}
</script>
