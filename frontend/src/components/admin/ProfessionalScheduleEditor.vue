<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">WEEKLY SCHEDULE EDITOR</span>
    </v-card-title>
    <v-card-text>
        <p class="text-body-1 font-weight-bold mb-4">
            Editing Schedule for: <span class="text-primary">{{ professionalId }}</span>
        </p>
        <p class="text-caption mb-6">Define the practitioner's standard weekly working hours. Days not listed are considered unavailable.</p>
        
        <v-row v-for="day in currentSchedule" :key="day.dayOfWeek" class="mb-2 align-center">
            <v-col cols="3" md="2">
                <v-switch
                    v-model="day.enabled"
                    :label="day.dayOfWeek"
                    color="primary"
                    density="compact"
                    hide-details
                />
            </v-col>
            <v-col cols="9" md="10">
                <div v-if="!day.enabled" class="text-error font-weight-bold pa-2 rounded-lg" color="surface">
                    Day is disabled. No slots available for booking.
                </div>
                <v-chip-group v-else v-model="day.selectedSlots" column multiple mandatory>
                    <v-chip 
                        v-for="slot in day.slots" 
                        :key="slot.id" 
                        :value="slot.id" 
                        variant="outlined" 
                        color="primary"
                        size="small"
                        class="text-caption font-weight-bold"
                    >
                        {{ formatTime(slot.startTime) }} - {{ formatTime(slot.endTime) }}
                    </v-chip>
                </v-chip-group>
            </v-col>
        </v-row>

        <v-alert type="info" variant="tonal" rounded="md" class="mt-6">
            Note: This only sets the *standard* schedule. Slots will be generated from this template.
        </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatTime } from '@/utils/date'

interface TimeSlot {
    id: string
    startTime: string
    endTime: string
}

interface ScheduleDay {
    dayOfWeek: string
    enabled: boolean
    slots: TimeSlot[]
    selectedSlots: string[] // Holds IDs of selected slots
}

const props = defineProps<{
    professionalId: string
    initialSchedule: any // Should be array of ScheduleDay structure
}>()

const emit = defineEmits<{
    (e: 'update:schedule', schedule: any): void
}>()

const currentSchedule = ref<ScheduleDay[]>([])

// --- Mock Data Mapping (Simulation) ---
watch(() => props.initialSchedule, (newSchedule) => {
    if (newSchedule) {
        currentSchedule.value = mapBackendScheduleToFrontend(props.initialSchedule)
    }
}, { immediate: true })

function mapBackendScheduleToFrontend(backendData: any): ScheduleDay[] {
    // This structure represents the *desired* state for editing.
    if (!backendData || !Array.isArray(backendData.days)) {
        return [
            { dayOfWeek: 'Monday', enabled: true, slots: [{ id: 'm1', startTime: '09:00', endTime: '10:00' }, { id: 'm2', startTime: '10:00', endTime: '11:00' }, { id: 'm3', startTime: '11:00', endTime: '12:00' }], selectedSlots: ['m1', 'm2'] },
            { dayOfWeek: 'Tuesday', enabled: true, slots: [{ id: 't1', startTime: '09:00', endTime: '10:00' }, { id: 't2', startTime: '10:00', endTime: '11:00' }, { id: 't3', startTime: '11:00', endTime: '12:00' }], selectedSlots: ['t1', 't2', 't3'] },
            { dayOfWeek: 'Wednesday', enabled: false, slots: [{ id: 'w1', startTime: '09:00', endTime: '10:00' }], selectedSlots: [] },
            { dayOfWeek: 'Thursday', enabled: true, slots: [{ id: 'th1', startTime: '14:00', endTime: '15:00' }], selectedSlots: ['th1'] },
            { dayOfWeek: 'Friday', enabled: true, slots: [{ id: 'f1', startTime: '09:00', endTime: '10:00' }, { id: 'f2', startTime: '10:00', endTime: '11:00' }], selectedSlots: ['f1', 'f2'] },
            { dayOfWeek: 'Saturday', enabled: false, slots: [], selectedSlots: [] },
            { dayOfWeek: 'Sunday', enabled: false, slots: [], selectedSlots: [] },
        ]
    }
    
    // Real transformation logic would go here
    return backendData.days || []
}

// Emit data whenever the local schedule changes
watch(currentSchedule, (newSchedule) => {
    emit('update:schedule', newSchedule)
}, { deep: true })

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
.gap-2 { gap: 8px; }

.bg-surface-light {
    background-color: rgba(var(--v-theme-surface), 0.5);
}
</style>