<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-xl mx-auto">
    <!-- Header -->
    <v-row class="mb-8">
      <v-col cols="12">
        <div class="d-flex align-end justify-space-between mb-2">
          <div>
            <span class="text-overline text-primary font-weight-black letter-spacing-2">SYSTEM DASHBOARD</span>
            <h1 class="text-h4 text-sm-h3 font-weight-black text-uppercase mt-n1">
              {{ $t('nav.dashboard') }}
            </h1>
          </div>
          <v-chip
            v-if="user?.role"
            :color="getRoleColor(user.role)"
            size="small"
            variant="flat"
            class="font-weight-black text-uppercase mb-2"
          >
            {{ user.role }}
          </v-chip>
        </div>
        <div class="d-flex align-center mt-2">
          <div class="status-dot mr-2 pulse-success"></div>
          <p class="text-body-1 font-weight-medium">
            USER_ID: <span class="font-family-mono text-primary">{{ user?.profile?.firstName?.toUpperCase() || 'USER_ALPHA' }}</span>
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <DashboardQuickActions 
      :is-admin-or-secretary="isAdminOrSecretary"
      :is-professional="isProfessional"
    />

    <!-- Upcoming Appointments Section -->
    <v-row>
      <v-col cols="12" lg="8">
        <AppointmentList
          :appointments="upcomingAppointments"
          :loading="loading"
          view-all-route="/appointments"
          :has-action="true"
          empty-message="You don't have any scheduled appointments. Book one now!"
          action-label="Book Appointment"
          action-to="/book"
        />
      </v-col>
      
      <!-- Stats Sidebar or Additional Info -->
      <v-col cols="12" lg="4">
        <v-card variant="outlined" class="pa-6 fill-height d-flex flex-column justify-center align-center text-center card-stats">
          <div class="text-h1 font-weight-black text-primary opacity-20 mb-n4">360</div>
          <div class="text-overline font-weight-bold mb-4">PLATFORM STATUS</div>
          <v-icon icon="mdi-shield-check" size="64" color="success" class="mb-4" />
          <div class="text-h6 font-weight-bold">ALL SYSTEMS NOMINAL</div>
          <p class="text-caption text-medium-emphasis px-4 mt-2">
            Secure connection established. All appointment data is encrypted and backed up.
          </p>
          <v-divider class="w-100 my-6" />
          <div class="d-flex w-100 justify-space-around">
            <div class="text-center">
              <div class="text-h6 font-weight-bold">{{ upcomingAppointments.length }}</div>
              <div class="text-caption font-weight-bold opacity-70">ACTIVE</div>
            </div>
            <div class="text-center border-left pl-4 border-right pr-4">
              <div class="text-h6 font-weight-bold">0</div>
              <div class="text-caption font-weight-bold opacity-70">ALERTS</div>
            </div>
            <div class="text-center">
              <div class="text-h6 font-weight-bold">100%</div>
              <div class="text-caption font-weight-bold opacity-70">UPTIME</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions.vue'
import UpcomingAppointments from '@/components/dashboard/UpcomingAppointments.vue'
import { useAppColors } from '@/composables/useAppColors'

const authStore = useAuthStore()
const { getRoleColor } = useAppColors()

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
</script>

<style scoped>
.letter-spacing-2 {
  letter-spacing: 2px;
}

.font-family-mono {
  font-family: 'Roboto Mono', monospace;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pulse-success {
  background-color: #00C853;
  box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(0, 200, 83, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 200, 83, 0);
  }
}

.opacity-20 {
  opacity: 0.1;
}

.opacity-70 {
  opacity: 0.7;
}

.border-left {
    border-left: 1px solid rgba(var(--v-border-color), 0.2);
}
.border-right {
    border-right: 1px solid rgba(var(--v-border-color), 0.2);
}

.card-stats {
    border-radius: 8px !important;
    border: 1px solid rgba(var(--v-border-color), 0.4) !important;
}
</style>