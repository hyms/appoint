<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('appointments.title') }}</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tab" color="primary">
          <v-tab value="upcoming">Upcoming</v-tab>
          <v-tab value="past">Past</v-tab>
          <v-tab value="payments" v-if="showPaymentTab">Payments</v-tab>
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
                    {{ formatDate(apt.date) }} at {{ formatTime(apt.startTime) }}
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
                      Pay
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
                No upcoming appointments
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
                No past appointments
              </v-card-text>
            </v-card>
          </v-window-item>

          <v-window-item value="payments">
            <v-card flat>
              <v-card-title>Payment Status Tracker</v-card-title>
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
                      Upload Payment
                    </v-btn>
                    <v-btn
                      v-if="item.status === 'UPLOADED'"
                      size="small"
                      color="info"
                      @click="viewPayment(item)"
                    >
                      View
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
        <v-card-title>Upload Payment</v-card-title>
        <v-card-text>
          <p class="mb-4">
            Appointment: {{ selectedAppointment ? formatDate(selectedAppointment.date) : '' }}
          </p>
          <v-file-input
            v-model="paymentFile"
            label="Upload payment screenshot"
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
          <v-btn @click="paymentDialog = false">Cancel</v-btn>
          <v-btn
            color="primary"
            :loading="uploading"
            :disabled="!paymentFile"
            @click="uploadPayment"
          >
            Upload
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="viewDialog" max-width="500">
      <v-card class="pa-4">
        <v-card-title>Payment Details</v-card-title>
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
            Uploaded: {{ new Date(selectedPayment.uploadedAt).toLocaleString() }}
          </p>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import { paymentsService, type QRPayment } from '@/services/payments'

const authStore = useAuthStore()
const tab = ref('upcoming')
const upcomingAppointments = ref<Appointment[]>([])
const pastAppointments = ref<Appointment[]>([])
const paymentRecords = ref<any[]>([])
const loadingPayments = ref(false)

const paymentDialog = ref(false)
const viewDialog = ref(false)
const selectedAppointment = ref<Appointment | null>(null)
const selectedPayment = ref<QRPayment | null>(null)
const paymentFile = ref<File | null>(null)
const previewUrl = ref('')
const uploading = ref(false)

const showPaymentTab = computed(() => authStore.user?.role === 'PATIENT')

const paymentHeaders = [
  { title: 'Date', key: 'appointment.date' },
  { title: 'Professional', key: 'appointment.professional.profile.firstName' },
  { title: 'Status', key: 'status' },
  { title: 'Actions', key: 'actions', sortable: false }
]

onMounted(async () => {
  await loadAppointments()
})

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
  viewDialog.value = true
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

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function formatTime(time: string) {
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
