<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">GENERAL PREFERENCES</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="info" variant="tonal" rounded="md" class="mb-6">
            Configure user-facing settings and internal logic toggles for this practitioner. These affect slot generation and patient interactions.
        </v-alert>
        
        <div class="mb-6">
            <p class="font-weight-bold mb-2 opacity-80">Default Slot Duration (Minutes)</p>
            <BaseInput
                v-model.number="currentSettings.defaultDurationMinutes" 
                type="number" 
                min="15" 
                max="120" 
                step="5"
                variant="outlined"
                rounded="md"
                hide-details
                label="Slot Duration"
                suffix="minutes"
            />
            <p class="text-caption mt-1 text-medium-emphasis">The standard length for appointments generated for this professional.</p>
        </div>
        
        <v-divider class="my-6" />

        <v-switch
            v-model="currentSettings.requiresVoiceVerification"
            color="primary"
            label="Require Voice Verification for Patients"
            :hint="currentSettings.requiresVoiceVerification ? 'New appointments require patient voice confirmation via WhatsApp/SMS.' : 'Standard booking confirmation applies.'"
            persistent-hint
            rounded
        />
        
        <v-divider class="my-6" />

        <v-switch
            v-model="currentSettings.canManageOwnStrikes"
            color="primary"
            label="Allow Self-Resolution of Strikes"
            hint="If true, the professional can manually clear their own strikes (use with caution)."
            persistent-hint
            rounded
        />
        
        <v-divider class="my-6" />
         <v-alert type="warning" variant="tonal" rounded="md" icon="mdi-alert-octagon-outline" class="mt-6">
            Remember to click 'Save All Changes' in the parent tab to apply modifications.
        </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

interface Settings {
    defaultDurationMinutes: number
    requiresVoiceVerification: boolean
    canManageOwnStrikes: boolean
}

const props = defineProps<{
    professionalId: string
    initialSettings: Settings
}>()

const emit = defineEmits<{
    (e: 'update:settings', settings: Settings): void
}>()

const currentSettings = ref<Settings>({
    defaultDurationMinutes: 30,
    requiresVoiceVerification: false,
    canManageOwnStrikes: false,
})

watch(() => props.initialSettings, (newSettings) => {
    if (newSettings) {
        currentSettings.value = { ...newSettings }
    }
}, { immediate: true })

watch(currentSettings, (newSettings) => {
    emit('update:settings', newSettings)
}, { deep: true })
</script>

<style scoped>
.admin-tab-card {
  border-radius: 8px !important;
  border: 1px solid rgba(var(--v-border-color), 0.4) !important;
}
</style>