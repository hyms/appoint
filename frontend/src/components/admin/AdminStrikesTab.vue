<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">STRIKE MANAGEMENT</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="warning" variant="tonal" rounded="md" class="mb-6">
            Strike management allows you to temporarily block patients from booking appointments due to repeated no-shows or policy violations.
        </v-alert>

        <v-data-table
            :headers="headers"
            :items="strikes"
            :loading="loading"
            :items-per-page="10"
            class="data-table-industrial"
        >
            <template v-slot:item.strikeDate="{ item }">
                {{ formatDate(item.strikeDate) }}
            </template>
            <template v-slot:item.patient.profile.firstName="{ item }">
                {{ item.patient?.profile?.firstName }} {{ item.patient?.profile?.lastName }} ({{ item.patient?.email }})
            </template>
            <template v-slot:item.isActive="{ item }">
                <v-chip :color="item.isActive ? 'error' : 'success'" size="small" :variant="item.isActive ? 'flat' : 'tonal'">
                  {{ item.isActive ? 'Active' : 'Resolved' }}
                </v-chip>
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn
                    v-if="item.isActive"
                    size="small"
                    color="success"
                    variant="tonal"
                    @click="resolveStrike(item.id, item.patient?.id)"
                >
                    Resolve
                </v-btn>
                <v-chip v-else size="small" color="grey" variant="flat" class="text-white">Resolved</v-chip>
            </template>
        </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { strikesService } from '@/services/strikes'
import { formatDate } from '@/utils/date'
import BaseButton from '@/components/base/BaseButton.vue'

const { success, error } = useToast()

const props = defineProps<{
    loading: boolean
    strikes: any[]
}>()

const emit = defineEmits<{
    (e: 'updateList'): void
}>()

const headers = [
    { title: 'Date Issued', key: 'strikeDate' },
    { title: 'Patient', key: 'patient.profile.firstName' },
    { title: 'Reason', key: 'reason' },
    { title: 'Status', key: 'isActive' },
    { title: 'Actions', key: 'actions', sortable: false }
]

async function resolveStrike(strikeId: string, patientId?: string) {
    const resolution = prompt('Enter resolution notes for this strike:')
    if (!resolution || !resolution.trim()) {
        error('Resolution notes are required to resolve a strike.')
        return
    }

    try {
        await strikesService.resolve(strikeId, resolution.trim())
        success('Strike resolved successfully.')
        emit('updateList')
    } catch (e) {
        error('Failed to resolve strike.')
        console.error(e)
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
</style>