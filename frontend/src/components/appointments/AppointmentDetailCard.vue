<template>
  <v-list>
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.id') }}</v-list-item-title>
      <v-list-item-subtitle>{{ appointment.id }}</v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.dateAndTime') }}</v-list-item-title>
      <v-list-item-subtitle>{{ formatDate(appointment.date) }} at {{ formatTime(appointment.startTime) }} - {{ formatTime(appointment.endTime) }}</v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.patient') }}</v-list-item-title>
      <v-list-item-subtitle v-if="appointment.patient">
        {{ appointment.patient.profile?.firstName }} {{ appointment.patient.profile?.lastName }} ({{ appointment.patient.email }})
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.professional') }}</v-list-item-title>
      <v-list-item-subtitle v-if="appointment.professional">
        {{ appointment.professional.profile?.firstName }} {{ appointment.professional.profile?.lastName }} ({{ appointment.professional.email }})
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider />
    <v-list-item class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.status') }}</v-list-item-title>
      <v-list-item-subtitle>
        <v-chip :color="getStatusColor(appointment.status)" size="small">
          {{ $t(`appointments.status.${appointment.status.toLowerCase().replace('_', '')}`) }}
        </v-chip>
      </v-list-item-subtitle>
    </v-list-item>
    <v-divider v-if="appointment.notes" />
    <v-list-item v-if="appointment.notes" class="py-3">
      <v-list-item-title class="text-caption text-medium-emphasis">{{ $t('appointments.appointmentDetails.notes') }}</v-list-item-title>
      <v-list-item-subtitle>{{ appointment.notes }}</v-list-item-subtitle>
    </v-list-item>
  </v-list>
</template>

<script setup lang="ts">
import { type Appointment } from '@/services/appointments'
import { formatDate, formatTime } from '@/utils/date'
import { useAppColors } from '@/composables/useAppColors'

const props = defineProps<{
  appointment: Appointment
}>()

const { getStatusColor } = useAppColors()
</script>

<style scoped>
.text-caption {
    font-size: 0.8rem !important;
}
</style>