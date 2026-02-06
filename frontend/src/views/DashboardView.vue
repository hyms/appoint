<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('nav.dashboard') }}</h1>
        <p v-if="user">Welcome, {{ user.profile?.firstName }} {{ user.profile?.lastName }}</p>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4" to="/book">
          <v-card-title>{{ $t('appointments.book') }}</v-card-title>
          <v-card-text>Book a new appointment</v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="4">
        <v-card class="pa-4" to="/appointments">
          <v-card-title>{{ $t('appointments.title') }}</v-card-title>
          <v-card-text>View your appointments</v-card-text>
        </v-card>
      </v-col>
      <v-col v-if="isStaff" cols="12" md="4">
        <v-card class="pa-4" to="/admin">
          <v-card-title>{{ $t('dashboard.admin') }}</v-card-title>
          <v-card-text>Admin panel</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12">
        <v-card>
          <v-card-title>Upcoming Appointments</v-card-title>
          <v-card-text v-if="upcomingAppointments.length === 0">
            No upcoming appointments
          </v-card-text>
          <v-list v-else>
            <v-list-item
              v-for="apt in upcomingAppointments"
              :key="apt.id"
            >
              <v-list-item-title>
                {{ formatDate(apt.date) }} - {{ formatTime(apt.startTime) }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ apt.professional?.profile?.firstName }} {{ apt.professional?.profile?.lastName }}
              </v-list-item-subtitle>
              <template v-slot:append>
                <v-chip :color="getStatusColor(apt.status)" size="small">
                  {{ apt.status }}
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

const authStore = useAuthStore()
const upcomingAppointments = ref<Appointment[]>([])

const user = computed(() => authStore.user)
const isStaff = computed(() => 
  user.value?.role === 'ADMIN' || 
  user.value?.role === 'SECRETARY' || 
  user.value?.role === 'PROFESSIONAL'
)

onMounted(async () => {
  try {
    upcomingAppointments.value = await appointmentsService.getUpcoming()
  } catch (error) {
    console.error('Failed to load appointments:', error)
  }
})

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
</script>
