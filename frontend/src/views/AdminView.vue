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
          <v-card-title>Slot Management</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="slotStartDate"
                  label="Start Date"
                  type="date"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model="slotEndDate"
                  label="End Date"
                  type="date"
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-btn color="primary" @click="generateSlots" :loading="generating">
                  Generate Slots
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
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
import { ref, onMounted, reactive } from 'vue'
import { appointmentsService, emergencyService, strikesService, slotsService } from '@/services/appointments'

const tab = ref('appointments')
const loading = ref(false)
const generating = ref(false)

const appointments = ref<any[]>([])
const strikes = ref<any[]>([])
const emergencyStatus = reactive({ isActive: false, message: '' })

const slotStartDate = ref('')
const slotEndDate = ref('')

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

async function generateSlots() {
  generating.value = true
  try {
    await slotsService.generate({
      professionalId: 'doctor@appointments360.com',
      startDate: slotStartDate.value,
      endDate: slotEndDate.value
    })
    alert('Slots generated successfully')
  } catch (error) {
    alert('Failed to generate slots')
  } finally {
    generating.value = false
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
