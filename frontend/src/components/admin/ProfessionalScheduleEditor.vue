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
                    :model-value="day.enabled"
                    :label="day.dayOfWeek"
                    color="primary"
                    density="compact"
                    hide-details
                    @update:model-value="(val) => { day.enabled = val ?? false; emitChange() }"
                />
            </v-col>
            <v-col cols="9" md="10">
                <div v-if="!day.enabled" class="text-error font-weight-bold pa-2 rounded-lg" color="surface">
                    Day is disabled. No slots available for booking.
                </div>
                <v-chip-group v-else :model-value="day.selectedSlots" column multiple mandatory @update:model-value="day.selectedSlots = $event; emitChange()">
                    <v-chip 
                        v-for="slot in day.slots" 
                        :key="slot.id" 
                        :value="slot.id" 
                        variant="outlined" 
                        color="primary"
                        size="small"
                        class="text-caption font-weight-bold"
                    >
                        {{ slot.startTime }} - {{ slot.endTime }}
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

interface TimeSlot {
    id: string
    startTime: string
    endTime: string
}

interface ScheduleDay {
    dayOfWeek: string
    enabled: boolean
    slots: TimeSlot[]
    selectedSlots: string[]
}

const props = defineProps<{
    professionalId: string
    initialSchedule: any
}>()

const emit = defineEmits<{
    (e: 'update:schedule', schedule: any): void
}>()

const currentSchedule = ref<ScheduleDay[]>([])

// Only initialize schedule if professional ID changes, not on every prop update
watch(() => props.professionalId, () => {
    currentSchedule.value = mapBackendScheduleToFrontend(props.initialSchedule)
}, { immediate: true })

function mapBackendScheduleToFrontend(backendData: any): ScheduleDay[] {
    const rawWorkingHours = (backendData && backendData.workingHours) ? backendData.workingHours : [
        { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isActive: true },
        { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00', isActive: false },
        { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '13:00', isActive: false },
    ]

    return rawWorkingHours.map((wh: any) => ({
        dayOfWeek: wh.dayOfWeek.charAt(0) + wh.dayOfWeek.slice(1).toLowerCase(),
        enabled: wh.isActive,
        slots: [{ id: `${wh.dayOfWeek.toLowerCase()}_1`, startTime: wh.startTime, endTime: wh.endTime }],
        selectedSlots: wh.isActive ? [`${wh.dayOfWeek.toLowerCase()}_1`] : []
    }))
}

function emitChange() {
    // Clone to prevent direct mutation references from reaching the parent/prop
    const payload = JSON.parse(JSON.stringify(currentSchedule.value))
    emit('update:schedule', payload)
}
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