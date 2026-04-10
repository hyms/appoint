<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">{{ $t('admin.professionalConfiguration') }}</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="warning" variant="tonal" rounded="md" class="mb-6">
            {{ $t('admin.professionalConfigInstruction') }}
        </v-alert>

        <v-row class="mb-4">
            <v-col cols="12" sm="6" md="4">
                <BaseSelect
                    v-model="selectedProfessionalId"
                    :label="$t('admin.selectPractitionerForEditing')"
                    :items="professionalsList"
                    item-title="label"
                    item-value="id"
                    :loading="loadingProfessionals"
                    hide-details
                />
            </v-col>
            <v-col cols="12" sm="6" md="8" class="d-flex align-center justify-end gap-2 pt-3 pt-md-0">
                <BaseButton variant="text" color="primary" prepend-icon="mdi-refresh" @click="$emit('updateList')" />
            </v-col>
        </v-row>

        <div v-if="selectedProfessionalId && !loadingProfessionalData">
            <v-tabs v-model="configTab" color="primary" class="mb-6" grow>
                <v-tab value="schedule">{{ $t('admin.scheduleAndHours') }}</v-tab>
                <v-tab value="settings">{{ $t('admin.preferences') }}</v-tab>
            </v-tabs>

            <v-window v-model="configTab">
                <v-window-item value="schedule">
                    <ScheduleEditor 
                        :professional-id="selectedProfessionalId" 
                        :initial-schedule="scheduleData"
                        @update:schedule="scheduleData = $event"
                    />
                </v-window-item>
                <v-window-item value="settings">
                    <PreferenceEditor 
                        :professional-id="selectedProfessionalId" 
                        :initial-settings="settingsData"
                        @update:settings="settingsData = $event"
                    />
                </v-window-item>
            </v-window>

            <div class="text-right mt-6">
                <BaseButton color="success" @click="saveConfiguration" :loading="savingConfig" append-icon="mdi-content-save">
                    {{ $t('admin.saveAllChanges') }}
                </BaseButton>
            </div>
        </div>

        <div v-else-if="!selectedProfessionalId" class="text-center py-12 border-thin rounded-lg bg-surface-light">
            <v-icon icon="mdi-account-search-outline" size="64" color="grey-lighten-3" class="mb-2" />
            <p class="text-h6 font-weight-bold">{{ $t('admin.selectAPractitioner') }}</p>
            <p class="text-body-2 text-medium-emphasis">{{ $t('admin.useDropdownToLoad') }}</p>
        </div>

        <div v-else-if="loadingProfessionalData" class="text-center py-12">
            <v-progress-circular indeterminate color="primary" size="48" />
            <p class="mt-3 text-medium-emphasis">{{ $t('admin.loadingPractitionerData') }}</p>
        </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from '@/composables/useToast'
import api from '@/services/api'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import ScheduleEditor from './ProfessionalScheduleEditor.vue'
import PreferenceEditor from './ProfessionalPreferenceEditor.vue'

const { t } = useI18n()
const { success, error } = useToast()

const props = defineProps<{
  professionalsList: { id: string; label: string }[]
  loadingProfessionals: boolean
}>()

const emit = defineEmits<{
  (e: 'updateList'): void
}>()

const selectedProfessionalId = ref<string | null>(null)
const loadingProfessionalData = ref(false)
const savingConfig = ref(false)
const configTab = ref('schedule')

const scheduleData = ref<any>(null)
const settingsData = ref<any>(null)

const professionalConfigEndpoint = computed(() => selectedProfessionalId.value ? `/professional-config/${selectedProfessionalId.value}` : null)

watch(selectedProfessionalId, (newId) => {
    if (newId) {
        loadProfessionalConfiguration()
    } else {
        scheduleData.value = null
        settingsData.value = null
    }
})

async function loadProfessionalConfiguration() {
    loadingProfessionalData.value = true
    try {
        const response = await api.get(professionalConfigEndpoint.value!)
        scheduleData.value = { workingHours: response.data.workingHours }
        settingsData.value = { 
            slotDurationMinutes: response.data.slotDurationMinutes, 
            breakBetweenSlotsMinutes: response.data.breakBetweenSlotsMinutes 
        }
    } catch (err) {
        error(t('admin.failedToLoadProfessionalConfig'))
        console.error(err)
    } finally {
        loadingProfessionalData.value = false
    }
}

async function saveConfiguration() {
    if (!selectedProfessionalId.value) return
    savingConfig.value = true
    try {
        const workingHours = scheduleData.value.map((day: any) => ({
            dayOfWeek: day.dayOfWeek.toUpperCase(),
            startTime: day.slots[0]?.startTime || '09:00',
            endTime: day.slots[0]?.endTime || '17:00',
            isActive: day.enabled
        }))
        
        await api.patch(professionalConfigEndpoint.value!, {
            workingHours: workingHours,
            ...settingsData.value
        })
        success(t('admin.configSavedSuccess'))
    } catch (err) {
        error(t('admin.failedToSaveConfig'))
        console.error(err)
    } finally {
        savingConfig.value = false
    }
}
</script>