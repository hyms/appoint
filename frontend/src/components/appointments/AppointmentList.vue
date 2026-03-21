<template>
  <v-card variant="outlined" class="appointment-list-card">
    <v-card-title class="d-flex align-center py-3 px-4 border-bottom">
      <v-icon icon="mdi-calendar-clock" class="mr-2" color="primary" />
      <span class="text-overline font-weight-black letter-spacing-1">Appointments</span>
      <v-spacer />
      <v-btn
        variant="text"
        color="primary"
        size="small"
        :to="viewAllRoute"
        prepend-icon="mdi-eye"
        class="text-none"
      >
        View All
      </v-btn>
    </v-card-title>

    <!-- Loading State -->
    <SkeletonLoader
      v-if="loading"
      type="list-item-three-line"
      :count="limit"
      class="pa-4"
    />

    <!-- Empty State -->
    <EmptyState
      v-else-if="!appointments || appointments.length === 0"
      icon="mdi-calendar-remove"
      title="No Scheduled Appointments"
      :description="emptyMessage"
      :action-label="actionLabel"
      :action-to="actionTo"
    />

    <!-- Appointments List -->
    <v-list v-else class="pa-0">
      <AppointmentListItem
        v-for="(apt, index) in appointments.slice(0, limit)"
        :key="apt.id"
        :appointment="apt"
        :is-last="index === appointments.slice(0, limit).length - 1"
        :has-action="hasAction"
        :status-color="getStatusChipColor(apt.status)"
      />
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { type Appointment } from '@/services/appointments'
import AppointmentListItem from './AppointmentListItem.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonLoader from '@/components/base/SkeletonLoader.vue'

const props = defineProps<{
  appointments: Appointment[] | null
  loading: boolean
  limit?: number
  viewAllRoute?: string
  hasAction?: boolean
  emptyMessage?: string
  actionLabel?: string
  actionTo?: string
  isFirstComponent?: boolean
}>()

const defaultLimit = 5

const appointments = computed(() => props.appointments || [])
const limit = computed(() => props.limit || defaultLimit)
const viewAllRoute = computed(() => props.viewAllRoute || '/appointments')

function getStatusChipColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: 'warning',
    CONFIRMED: 'success',
    VOICE_VERIFIED: 'info',
    COMPLETED: 'primary',
    CANCELLED: 'error',
    NO_SHOW: 'error'
  }
  return colors[status] || 'grey'
}
</script>

<style scoped>
.appointment-list-card {
  border-radius: 8px !important; 
  border: 1px solid rgba(var(--v-border-color), 0.4) !important;
}

.border-bottom {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}
</style>