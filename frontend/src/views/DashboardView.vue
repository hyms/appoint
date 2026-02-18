<template>
  <v-container fluid class="pa-2 pa-sm-4">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <div class="d-flex align-center justify-space-between mb-2">
          <h1 class="text-h5 text-sm-h4 font-weight-bold">
            {{ $t('nav.dashboard') }}
          </h1>
          <v-chip
            v-if="user?.role"
            :color="getRoleColor(user.role)"
            size="small"
            variant="tonal"
          >
            {{ user.role }}
          </v-chip>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Welcome back, <span class="font-weight-medium">{{ user?.profile?.firstName || 'User' }}</span>
        </p>
      </v-col>
    </v-row>

    <!-- Quick Actions Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="4">
        <BaseCard
          to="/book"
          icon="mdi-calendar-plus"
          icon-color="success"
          :title="$t('appointments.book')"
          subtitle="Schedule a new appointment"
          class="h-100"
        />
      </v-col>
      <v-col cols="12" sm="6" md="4" class="mt-4 mt-sm-0">
        <BaseCard
          to="/appointments"
          icon="mdi-calendar-check"
          icon-color="primary"
          :title="$t('appointments.title')"
          subtitle="View and manage your appointments"
          class="h-100"
        />
      </v-col>
      <v-col v-if="isAdminOrSecretary" cols="12" sm="6" md="4" class="mt-4 mt-md-0">
        <BaseCard
          to="/admin"
          icon="mdi-shield-account"
          icon-color="warning"
          :title="$t('dashboard.admin')"
          subtitle="Administrative tools"
          class="h-100"
        />
      </v-col>
      <v-col v-if="isProfessional" cols="12" sm="6" md="4" class="mt-4 mt-md-0">
        <BaseCard
          to="/professional-config"
          icon="mdi-account-cog"
          icon-color="info"
          title="Herramientas Administrativas"
          subtitle="Configurar horario y preferencias"
          class="h-100"
        />
      </v-col>
    </v-row>

    <!-- Upcoming Appointments Section -->
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center py-4">
            <v-icon icon="mdi-calendar-clock" class="mr-2" color="primary" />
            Upcoming Appointments
            <v-spacer />
            <v-btn
              variant="text"
              color="primary"
              size="small"
              to="/appointments"
              prepend-icon="mdi-eye"
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
            v-else-if="upcomingAppointments.length === 0"
            icon="mdi-calendar-blank"
            title="No upcoming appointments"
            description="You don't have any scheduled appointments. Book one now!"
            action-label="Book Appointment"
            action-to="/book"
          />

          <!-- Appointments List -->
          <v-list v-else class="pa-0">
            <v-list-item
              v-for="apt in upcomingAppointments.slice(0, 5)"
              :key="apt.id"
              :to="`/appointments/${apt.id}`"
              class="py-3"
            >
              <template v-slot:prepend>
                <v-avatar color="primary" variant="tonal">
                  <v-icon icon="mdi-calendar" />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ formatDate(apt.date) }}
                <span class="text-medium-emphasis">at</span>
                {{ formatTime(apt.startTime) }}
              </v-list-item-title>

              <v-list-item-subtitle class="mt-1">
                <v-icon icon="mdi-doctor" size="small" class="mr-1" />
                Dr. {{ apt.professional?.profile?.lastName || 'Unknown' }}
                <span v-if="apt.location" class="ml-2">
                  <v-icon icon="mdi-map-marker" size="small" />
                  {{ apt.location.name }}
                </span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <v-chip
                  :color="getStatusColor(apt.status)"
                  size="small"
                  variant="tonal"
                  class="text-capitalize"
                >
                  {{ formatStatus(apt.status) }}
                </v-chip>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import BaseCard from '@/components/base/BaseCard.vue'
import EmptyState from '@/components/base/EmptyState.vue'
import SkeletonLoader from '@/components/base/SkeletonLoader.vue'

const authStore = useAuthStore()
const upcomingAppointments = ref<Appointment[]>([])
const loading = ref(true)

const user = computed(() => authStore.user)
const isAdminOrSecretary = computed(() => 
  user.value?.role === 'ADMIN' || 
  user.value?.role === 'SECRETARY'
)
const isProfessional = computed(() => user.value?.role === 'PROFESSIONAL')

onMounted(async () => {
  try {
    upcomingAppointments.value = await appointmentsService.getUpcoming()
  } catch (error) {
    console.error('Failed to load appointments:', error)
  } finally {
    loading.value = false
  }
})

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(time: string) {
  return new Date(time).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit'
  })
}

function formatStatus(status: string) {
  return status.toLowerCase().replace('_', ' ')
}

function getStatusColor(status: string) {
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

function getRoleColor(role: string) {
  const colors: Record<string, string> = {
    ADMIN: 'error',
    SECRETARY: 'warning',
    PROFESSIONAL: 'info',
    PATIENT: 'success'
  }
  return colors[role] || 'grey'
}
</script>
