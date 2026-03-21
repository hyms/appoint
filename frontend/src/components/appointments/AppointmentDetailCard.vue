<template>
  <v-list>
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">ID</v-list-item-title>
      <v-list-item-subtitle>{{ appointment.id }}</v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Date & Time</v-list-item-title>
      <v-list-item-subtitle>{{ formatDate(appointment.date) }} at {{ formatTime(appointment.startTime) }} - {{ formatTime(appointment.endTime) }}</v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Patient</v-list-item-title>
      <v-list-item-subtitle v-if="appointment.patient">
        {{ appointment.patient.profile?.firstName }} {{ appointment.patient.profile?.lastName }} ({{ appointment.patient.email }})
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Professional</v-list-item-title>
      <v-list-item-subtitle v-if="appointment.professional">
        {{ appointment.professional.profile?.firstName }} {{ appointment.professional.profile?.lastName }} ({{ appointment.professional.email }})
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Status</v-list-item-title>
      <v-list-item-subtitle>
        <v-chip :color="getStatusColor(appointment.status)" size="small">
          {{ appointment.status }}
        </v-chip>
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Payment Status</v-list-item-title>
      <v-list-item-subtitle>
        <v-chip :color="getPaymentStatusColor(appointment.paymentStatus || '')" size="small">
          {{ appointment.paymentStatus || 'N/A' }}
        </v-chip>
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider v-if="appointment.notes" />
    <v-list-item v-if="appointment.notes" class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">Notes</v-list-item-title>
      <v-list-item-subtitle>{{ appointment.notes }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
// // import { defineProps } from 'vue'
import { type Appointment } from '@/services/appointments'
import { formatDate, formatTime } from '@/utils/date'

const props = defineProps<{
  appointment: Appointment
}>()

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

<style scoped>
.text-caption {
    font-size: 0.8rem !important;
}
</style>