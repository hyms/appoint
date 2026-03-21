<template>
  <v-list-item
    :to="itemTo"
    class="py-3 appointment-list-item"
    :class="{ 'border-bottom': !isLast }"
  >
    <template v-slot:prepend>
      <div class="date-badge mr-4" :class="[`bg-${statusColor}`]">
        <span class="day font-weight-black">{{ getDay(appointment.date) }}</span>
        <span class="month font-weight-bold">{{ getMonth(appointment.date) }}</span>
      </div>
    </template>

    <v-list-item-title class="font-weight-bold text-uppercase letter-spacing-1">
      {{ formatTime(appointment.startTime) }}
      <span class="text-medium-emphasis font-weight-normal ml-2">- {{ formatTime(appointment.endTime) }}</span>
    </v-list-item-title>

    <v-list-item-subtitle class="mt-1 text-body-2">
      <v-icon icon="mdi-doctor" size="small" class="mr-1 opacity-80" />
      {{ professionalLabel }}
      <span v-if="appointment.location" class="ml-3">
        <v-icon icon="mdi-map-marker" size="small" class="mr-1 opacity-80" />
        {{ appointment.location.name }}
      </span>
    </v-list-item-subtitle>

    <template v-slot:append>
      <AppointmentStatusChip
        :status="appointment.status"
        variant="flat"
        size="x-small"
      />
      <v-icon v-if="hasAction" icon="mdi-chevron-right" class="ml-2 opacity-50" />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type Appointment } from '@/services/appointments'
import { formatTime } from '@/utils/date'
import AppointmentStatusChip from './AppointmentStatusChip.vue'

const props = defineProps<{
  appointment: Appointment
  isLast?: boolean
  hasAction?: boolean
  statusColor?: string
}>()

const defaultColor = 'primary'

const getDay = (date: string | Date) => new Date(date).getDate()
const getMonth = (date: string | Date) => new Date(date).toLocaleString('default', { month: 'short' }).toUpperCase()

const statusColorClass = computed(() => props.statusColor || defaultColor)

const professionalLabel = computed(() => {
  return props.appointment.professional?.profile?.lastName 
    ? `Dr. ${props.appointment.professional.profile.lastName}`
    : 'Unknown Professional'
})

const itemTo = computed(() => props.hasAction ? `/appointments/${props.appointment.id}` : undefined)

</script>

<style scoped>
.appointment-list-item {
  transition: background-color 0.2s ease;
  border-bottom: none !important; /* Handled by parent V-List or container spacing */
}

.appointment-list-item:hover {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: rgb(var(--v-theme-on-primary));
  min-width: 50px;
  height: 50px;
  line-height: 1;
  border-radius: 3px; /* Maintain industrial sharpness */
}

.date-badge .day {
  font-size: 1.1rem;
}

.date-badge .month {
  font-size: 0.6rem;
  opacity: 0.9;
}

.opacity-80 {
    opacity: 0.8;
}
</style>
