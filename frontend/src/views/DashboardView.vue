<template>
  <BaseContainer class="pb-0">
    <!-- Header -->
    <v-row class="mb-lg">
      <v-col cols="12">
        <div class="d-flex align-end justify-space-between mb-sm">
          <div>
            <span class="text-overline text-primary font-weight-medium">{{ $t('dashboard.systemStatus') }}</span>
            <h1 class="text-h4 font-weight-bold mt-n1">
              {{ $t('nav.dashboard') }}
            </h1>
          </div>
          <v-chip
            v-if="user?.role"
            :color="getRoleColor(user.role)"
            size="small"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ user.role }}
          </v-chip>
        </div>
        <div class="d-flex align-center mt-2">
          <div class="status-dot mr-2 pulse-success"></div>
          <p class="text-body-1 text-medium-emphasis">
            {{ $t('common.user') }}: <span class="font-weight-bold text-primary">{{ user?.profile?.firstName || $t('common.user') }}</span>
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Quick Actions -->
    <div class="card-gap">
      <DashboardQuickActions 
        :is-admin-or-secretary="isAdminOrSecretary"
        :is-professional="isProfessional"
      />
    </div>

    <!-- Upcoming Appointments Section -->
    <v-row class="section-gap">
      <v-col cols="12" lg="8">
        <AppointmentList
          :appointments="upcomingAppointments"
          :loading="loading"
          view-all-route="/appointments"
          :has-action="true"
          :empty-message="$t('dashboard.noScheduledAppointments')"
          :action-label="$t('dashboard.bookAppointment')"
          action-to="/book"
        />
      </v-col>
      
      <!-- Stats Sidebar or Additional Info -->
      <v-col cols="12" lg="4">
        <v-card class="fill-height d-flex flex-column justify-center align-center text-center rounded-xl" elevation="2" :style="{ padding: 'var(--space-xl)' }">
          <div class="text-h1 font-weight-black text-primary opacity-10 mb-n4">360</div>
          <div class="text-overline font-weight-bold mb-md">{{ $t('dashboard.platformMonitor') }}</div>
          <v-icon icon="mdi-shield-check" size="64" color="success" class="mb-4" />
          <div class="text-h6 font-weight-bold">{{ $t('dashboard.allSystemsNominal') }}</div>
          <p class="text-body-2 text-medium-emphasis px-4 mt-2">
            {{ $t('dashboard.secureConnection') }}
          </p>
          <v-divider class="w-100 my-lg" />
          <div class="d-flex w-100 justify-space-around">
            <div class="text-center">
              <div class="text-h5 font-weight-bold">{{ upcomingAppointments.length }}</div>
              <div class="text-caption font-weight-medium text-medium-emphasis">{{ $t('dashboard.active') }}</div>
            </div>
            <v-divider vertical inset />
            <div class="text-center">
              <div class="text-h5 font-weight-bold">0</div>
              <div class="text-caption font-weight-medium text-medium-emphasis">{{ $t('dashboard.alerts') }}</div>
            </div>
            <v-divider vertical inset />
            <div class="text-center">
              <div class="text-h5 font-weight-bold">100%</div>
              <div class="text-caption font-weight-medium text-medium-emphasis">{{ $t('dashboard.uptime') }}</div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </BaseContainer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, type Appointment } from '@/services/appointments'
import DashboardQuickActions from '@/components/dashboard/DashboardQuickActions.vue'
import AppointmentList from '@/components/appointments/AppointmentList.vue'
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
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.pulse-success {
  background-color: rgb(var(--v-theme-success));
  box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.7);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(var(--v-theme-success), 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(var(--v-theme-success), 0);
  }
}

.opacity-10 {
  opacity: 0.1;
}
</style>
