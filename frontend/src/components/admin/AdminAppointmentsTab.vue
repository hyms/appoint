<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">APPOINTMENT LOGS</span>
    </v-card-title>
    <v-card-text>
        <v-row class="mb-6">
             <v-col cols="12" sm="4" md="3">
                <BaseInput
                    v-model="filters.date"
                    label="Filter by Date"
                    type="date"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" sm="4" md="3">
                <BaseSelect
                    v-model="filters.status"
                    label="Filter by Status"
                    :items="statusOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center justify-end gap-2 pt-3 pt-md-0">
                 <BaseButton variant="text" color="primary" prepend-icon="mdi-refresh" @click="$emit('updateList')" />
            </v-col>
        </v-row>
        
        <v-data-table
            :headers="headers"
            :items="appointments"
            :loading="loading"
            :items-per-page="10"
            class="data-table-industrial"
        >
            <template v-slot:item.date="{ item }">
              {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.startTime="{ item }">
              {{ formatTime(item.startTime) }}
            </template>
            <template v-slot:item.patient="{ item }">
              <div v-if="item.patient">
                <div class="font-weight-medium">{{ item.patient.profile?.firstName }} {{ item.patient.profile?.lastName }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.patient.email }}</div>
              </div>
              <div v-else class="text-medium-emphasis">N/A</div>
            </template>
            <template v-slot:item.professional="{ item }">
              <div v-if="item.professional">
                <div class="font-weight-medium">{{ item.professional.profile?.firstName }} {{ item.professional.profile?.lastName }}</div>
                <div class="text-caption text-medium-emphasis">{{ item.professional.email }}</div>
              </div>
              <div v-else class="text-medium-emphasis">N/A</div>
            </template>
            <template v-slot:item.status="{ item }">
              <AppointmentStatusChip :status="item.status" size="small" />
            </template>
            <template v-slot:item.paymentStatus="{ item }">
              <v-chip :color="getPaymentStatusColor(item.paymentStatus)" size="x-small" variant="outlined">
                {{ item.paymentStatus || 'N/A' }}
              </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
              <v-btn
                size="small"
                color="primary"
                variant="text"
                prepend-icon="mdi-eye"
                @click="$emit('viewDetails', item)"
              >
                View
              </v-btn>
            </template>
        </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppointmentStatusChip from '@/components/appointments/AppointmentStatusChip.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatDate, formatTime } from '@/utils/date'
import { type Appointment } from '@/services/appointments'
import { useAppColors } from '@/composables/useAppColors'

const props = defineProps<{
  appointments: any[]
  loading: boolean
  filters: { date: string, status: string }
  statusOptions: { text: string, value: string }[]
  headers: any[]
  patientsList: { id: string; label: string }[]
  professionalsList: { id: string; label: string }[]
  loadingPatients: boolean
  loadingProfessionals: boolean
}>()

const emit = defineEmits<{
  (e: 'update:filters', value: any): void
  (e: 'updateList'): void
  (e: 'viewDetails', appointment: Appointment): void
}>()

const filters = computed({
    get: () => props.filters,
    set: value => emit('update:filters', value)
})

const { getStatusColor, getPaymentStatusColor } = useAppColors()
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

.gap-2 {
    gap: 8px;
}
.data-table-industrial {
    border-radius: 6px !important;
}
</style>