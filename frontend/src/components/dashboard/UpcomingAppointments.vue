<template>
  <v-card variant="outlined" class="upcoming-appointments-card">
    <v-card-title class="d-flex align-center py-4 border-bottom">
      <v-icon icon="mdi-calendar-clock" class="mr-2" color="primary" />
      <span class="text-overline font-weight-bold">Upcoming Appointments</span>
      <v-spacer />
      <v-btn
        variant="text"
        color="primary"
        size="small"
        to="/appointments"
        prepend-icon="mdi-eye"
        class="text-none"
      >
        View All
      </v-btn>
    </v-card-title>

    <!-- Loading State -->
    <SkeletonLoader
      v-if="loading"
      type="list-item-avatar"
      :count="3"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="appointments.length === 0"
      icon="mdi-calendar-blank"
      title="No upcoming appointments"
      description="You don't have any scheduled appointments. Book one now!"
      action-label="Book Appointment"
      action-to="/book"
    />

    <!-- Appointments List -->
    <v-list v-else class="pa-0">
      <v-list-item
        v-for="apt in appointments.slice(0, 5)"
        :key="apt.id"
        :to="`/appointments/${apt.id}`"
        class="py-4 border-bottom-light"
      >
        <template v-slot:prepend>
          <div class="date-badge mr-4">
            <span class="day">{{ getDay(apt.date) }}</span>
            <span class="month">{{ getMonth(apt.date) }}</span>
          </div>
        </template>

        <v-list-item-title class="font-weight-bold text-uppercase letter-spacing-1">
          {{ formatTime(apt.startTime) }}
        </v-list-item-title>

        <v-list-item-subtitle class="mt-1 font-family-mono text-caption">
          <v-icon icon="mdi-doctor" size="x-small" class="mr-1" />
          {{ apt.professional?.profile?.lastName || 'Unknown' }}
          <span v-if="apt.location" class="ml-2">
            <v-icon icon="mdi-map-marker" size="x-small" />
            {{ apt.location.name }}
          </span>
        </v-list-item-subtitle>

        <template v-slot:append>
          <v-chip
            :color="getStatusColor(apt.status)"
            size="x-small"
            variant="flat"
            class="text-uppercase font-weight-black"
          >
            {{ formatStatus(apt.status) }}
          </v-chip>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { type Appointment } from '@/services/appointments'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonLoader from '@/components/base/SkeletonLoader.vue'
import { formatTime } from '@/utils/date'
import { useAppColors } from '@/composables/useAppColors'

defineProps<{
  appointments: Appointment[]
  loading: boolean
}>()

const { getStatusColor, formatStatus } = useAppColors()

function getDay(date: string | Date) {
  return new Date(date).getDate()
}

function getMonth(date: string | Date) {
  return new Date(date).toLocaleString('default', { month: 'short' }).toUpperCase()
}
</script>

<style scoped>
.upcoming-appointments-card {
  border: 1px solid rgba(var(--v-border-color), 0.8) !important;
}

.border-bottom {
  border-bottom: 2px solid rgba(var(--v-border-color), 0.8) !important;
}

.border-bottom-light {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.date-badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  min-width: 50px;
  height: 50px;
  line-height: 1;
}

.date-badge .day {
  font-size: 1.25rem;
  font-weight: 900;
}

.date-badge .month {
  font-size: 0.65rem;
  font-weight: 700;
  opacity: 0.9;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.font-family-mono {
  font-family: 'Roboto Mono', monospace;
}
</style>
