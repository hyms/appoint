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
      <v-tab value="emergency">{{ $t('dashboard.emergencies') }}</v-tab>
      <v-tab value="strikes">Strikes</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="appointments">
        <v-card>
          <v-card-title>Appointment Management</v-card-title>
          <v-card-text>
            <v-data-table
              :headers="appointmentHeaders"
              :items="appointments"
              :loading="loading"
            >
              <template v-slot:item.status="{ item }">
                <v-chip :color="getStatusColor(item.status)" size="small">
                  {{ item.status }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status === 'PENDING'"
                  size="small"
                  color="success"
                  @click="updateStatus(item.id, 'CONFIRMED')"
                >
                  {{ $t('appointments.confirm') }}
                </v-btn>
                <v-btn
                  size="small"
                  color="error"
                  @click="cancelAppointment(item)"
                >
                  {{ $t('appointments.cancel') }}
                </v-btn>
              </template>
            </v-data-table>
          </v-card-text>
        </v-card>
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

const tab = ref('appointments')
const loading = ref(false)
const generating = ref(false)

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

const appointments = ref<any[]>([])
const strikes = ref<any[]>([])
const emergencyStatus = reactive({ isActive: false, message: '' })

const appointmentHeaders = [
  { title: 'Date', key: 'date' },
  { title: 'Patient', key: 'patient.profile.firstName' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
]

const strikeHeaders = [
  { title: 'Date', key: 'strikeDate' },
  { title: 'Patient', key: 'patient.profile.firstName' },
  { title: 'Reason', key: 'reason' },
  { title: 'Status', key: 'isActive' },
  { title: 'Actions', key: 'actions', sortable: false }
]

onMounted(async () => {
  await loadData()
  await loadSlots()
})

async function loadData() {
  loading.value = true
  try {
    appointments.value = await appointmentsService.getUpcoming()
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
    NO_SHOW: 'error'
  }
  return colors[status] || 'grey'
}
</script>
