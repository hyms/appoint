<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">EMERGENCY SYSTEM CONTROL</span>
    </v-card-title>
    <v-card-text>
        <v-alert
            type="error"
            variant="tonal"
            rounded="md"
            class="mb-6"
            :closable="emergencyStatus.isActive"
            @click:close="deactivateEmergencyWithPrompt"
        >
            <div class="d-flex align-center">
                <v-icon :icon="emergencyStatus.isActive ? 'mdi-siren' : 'mdi-shield-check'" class="mr-3" size="large" />
                <div>
                    <div class="text-h6 font-weight-black" :class="emergencyStatus.isActive ? 'text-error' : 'text-success'">
                        SYSTEM STATUS: {{ emergencyStatus.isActive ? 'ACTIVE EMERGENCY' : 'NOMINAL' }}
                    </div>
                    <p class="text-caption mt-1" v-if="emergencyStatus.message">
                        Reason: <strong>{{ emergencyStatus.message }}</strong>
                    </p>
                </div>
            </div>
        </v-alert>

        <v-divider class="my-6" />

        <v-row>
            <v-col cols="12" md="6">
                <BaseButton
                    v-if="!emergencyStatus.isActive"
                    color="error"
                    size="large"
                    block
                    variant="elevated"
                    @click="activateEmergencyWithPrompt"
                    append-icon="mdi-siren"
                    class="text-h6 font-weight-black"
                >
                    Activate Emergency Mode
                </BaseButton>
            </v-col>
            <v-col cols="12" md="6">
                <BaseButton
                    v-if="emergencyStatus.isActive"
                    color="success"
                    size="large"
                    block
                    variant="elevated"
                    @click="deactivateEmergencyWithPrompt"
                    append-icon="mdi-shield-check"
                    class="text-h6 font-weight-black"
                >
                    Deactivate Emergency Mode
                </BaseButton>
            </v-col>
        </v-row>
        
        <v-alert type="info" variant="tonal" rounded="md" class="mt-6" v-if="!emergencyStatus.isActive">
            Emergency mode locks down all booking capabilities and redirects users to the login screen. Use only for critical system maintenance or security incidents.
        </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { emergencyService } from '@/services/emergency'
import BaseButton from '@/components/base/BaseButton.vue'

const { success, error } = useToast()

const emergencyStatus = reactive({ isActive: false, message: '' })
const loading = ref(false)

onMounted(async () => {
    await loadEmergencyStatus()
})

async function loadEmergencyStatus() {
    loading.value = true
    try {
        const status = await emergencyService.getStatus()
        emergencyStatus.isActive = status.isActive
        emergencyStatus.message = status.message || ''
    } catch (e) {
        error('Could not retrieve emergency status.')
        console.error(e)
    } finally {
        loading.value = false
    }
}

async function activateEmergencyWithPrompt() {
    const message = prompt('Enter the reason for activating emergency mode:')
    if (message && message.trim()) {
        loading.value = true
        try {
            await emergencyService.activate(message.trim())
            await loadEmergencyStatus()
            success('Emergency mode activated successfully.')
        } catch (e) {
            error('Failed to activate emergency mode.')
            console.error(e)
        } finally {
            loading.value = false
        }
    }
}

async function deactivateEmergencyWithPrompt() {
    if (!emergencyStatus.isActive) return;

    const reason = prompt('Enter the reason for deactivating emergency mode:')
    if (reason && reason.trim()) {
        loading.value = true
        try {
            await emergencyService.deactivate(reason.trim())
            await loadEmergencyStatus()
            success('Emergency mode deactivated successfully.')
        } catch (e) {
            error('Failed to deactivate emergency mode.')
            console.error(e)
        } finally {
            loading.value = false
        }
    }
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
</style>