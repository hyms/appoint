<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">{{ $t('admin.generalPreferences') }}</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="info" variant="tonal" rounded="md" class="mb-6">
            {{ $t('admin.prefInstruction') }}
        </v-alert>
        
        <div class="mb-6">
            <p class="font-weight-bold mb-2 opacity-80">{{ $t('admin.defaultSlotDuration') }}</p>
            <BaseInput
                v-model.number="currentSettings.defaultDurationMinutes" 
                type="number" 
                min="15" 
                max="120" 
                step="5"
                variant="outlined"
                rounded="md"
                hide-details
                :label="$t('admin.slotDuration')"
                :suffix="$t('admin.minutes')"
            />
            <p class="text-caption mt-1 text-medium-emphasis">{{ $t('admin.slotDurationHint') }}</p>
        </div>
        
        <v-divider class="my-6" />

        <v-switch
            v-model="currentSettings.requiresVoiceVerification"
            color="primary"
            :label="$t('admin.requireVoiceVerification')"
            :hint="voiceVerificationHint"
            persistent-hint
            rounded
        />
        
        <v-divider class="my-6" />

        <v-switch
            v-model="currentSettings.canManageOwnStrikes"
            color="primary"
            :label="$t('admin.allowSelfResolutionStrikes')"
            :hint="$t('admin.allowSelfResolutionStrikesHint')"
            persistent-hint
            rounded
        />
        
        <v-divider class="my-6" />
         <v-alert type="warning" variant="tonal" rounded="md" icon="mdi-alert-octagon-outline" class="mt-6">
            {{ $t('admin.rememberSave') }}
        </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import BaseInput from '@/components/base/BaseInput.vue'

const { t } = useI18n()

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

const voiceVerificationHint = computed(() => 
    currentSettings.value.requiresVoiceVerification 
        ? t('admin.requireVoiceVerificationHint') 
        : t('admin.standardBookingConfirmation')
)

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