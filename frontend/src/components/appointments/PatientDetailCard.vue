<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick d-flex align-center">
      <v-icon icon="mdi-account" class="mr-2" color="primary" />
      <span class="text-overline font-weight-black letter-spacing-1">
        {{ $t('admin.patient.detailCardTitle') }}
      </span>
    </v-card-title>

    <v-card-text v-if="loading">
      <div class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
      </div>
    </v-card-text>

    <v-card-text v-else-if="patient">
      <v-row class="mb-4">
        <v-col cols="12" sm="6">
          <div class="text-h6 font-weight-bold">
            {{ patient.user.profile?.firstName }} {{ patient.user.profile?.lastName }}
          </div>
          <div class="text-body-2 text-medium-emphasis">{{ patient.user.email }}</div>
          <div v-if="patient.user.phone" class="text-body-2">
            {{ patient.user.phone }}
          </div>
        </v-col>
        <v-col cols="12" sm="6" class="d-flex justify-end">
          <v-chip :color="patient.user.isActive ? 'success' : 'error'" size="small">
            {{ patient.user.isActive ? $t('common.active') : $t('common.inactive') }}
          </v-chip>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-row class="text-center">
        <v-col cols="3">
          <div class="text-h5 font-weight-bold">{{ patient.stats.totalAppointments }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('admin.patient.totalAppointments') }}</div>
        </v-col>
        <v-col cols="3">
          <div class="text-h5 font-weight-bold text-success">{{ patient.stats.completed }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('admin.patient.completed') }}</div>
        </v-col>
        <v-col cols="3">
          <div class="text-h5 font-weight-bold text-error">{{ patient.stats.cancelled }}</div>
          <div class="text-caption text-medium-emphasis">{{ $t('admin.patient.cancelled') }}</div>
        </v-col>
        <v-col cols="3">
          <div class="text-h5 font-weight-bold" :class="patient.stats.activeStrikes > 0 ? 'text-warning' : ''">
            {{ patient.stats.activeStrikes }}
          </div>
          <div class="text-caption text-medium-emphasis">{{ $t('admin.patient.activeStrikes') }}</div>
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <v-expansion-panels variant="accordion">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon icon="mdi-calendar-clock" class="mr-2" />
            {{ $t('admin.patient.appointmentHistory') }} ({{ patient.appointments.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list v-if="patient.appointments.length > 0" density="compact" class="pa-0">
              <v-list-item v-for="apt in patient.appointments" :key="apt.id" class="px-0">
                <v-list-item-title class="d-flex justify-space-between align-center">
                  <span class="text-body-2">
                    {{ formatDate(apt.date) }}
                  </span>
                  <v-chip :color="getStatusColor(apt.status)" size="x-small">
                    {{ $t(`appointments.status.${apt.status.toLowerCase()}`) }}
                  </v-chip>
                </v-list-item-title>
                <v-list-item-subtitle>
                  Dr. {{ apt.professional.firstName }} {{ apt.professional.lastName }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-4 text-medium-emphasis">
              {{ $t('admin.patient.noAppointments') }}
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel v-if="patient.strikes.length > 0">
          <v-expansion-panel-title>
            <v-icon icon="mdi-alert" class="mr-2" color="warning" />
            {{ $t('admin.patient.activeStrikes') }} ({{ patient.strikes.length }})
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-list density="compact" class="pa-0">
              <v-list-item v-for="strike in patient.strikes" :key="strike.id" class="px-0">
                <v-list-item-title class="text-body-2">
                  {{ strike.reason }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  Dr. {{ strike.professional.firstName }} {{ strike.professional.lastName }} - {{ formatDate(strike.strikeDate) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <v-card-text v-else>
      <v-alert type="warning" variant="tonal">
        {{ $t('admin.patient.notFound') }}
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import api from '@/services/api'
import { formatDate } from '@/utils/date'
import { useAppColors } from '@/composables/useAppColors'

const { getStatusColor } = useAppColors()

const props = defineProps<{
  patientId: string
}>()

const loading = ref(true)
const patient = ref<any>(null)

onMounted(async () => {
  loading.value = true
  try {
    const response = await api.get(`/auth/patients/${props.patientId}`)
    patient.value = response.data
  } catch (err) {
    console.error('Failed to load patient details:', err)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-tab-card {
  border-radius: 8px !important;
  border: 1px solid rgba(var(--v-border-color), 0.4) !important;
}

.border-bottom-thick {
  border-bottom: 2px solid rgba(var(--v-border-color), 0.15) !important;
}

.letter-spacing-1 { letter-spacing: 1px !important; }
</style>