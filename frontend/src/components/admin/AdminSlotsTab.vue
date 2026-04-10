<template>
  <v-card variant="outlined" class="admin-tab-card">
    <v-card-title class="py-3 px-4 border-bottom-thick">
        <span class="text-overline font-weight-black letter-spacing-1">{{ $t('admin.slotAvailabilityManagement') }}</span>
    </v-card-title>
    <v-card-text>
        <v-alert type="info" variant="tonal" rounded="md" class="mb-6">
            {{ $t('admin.manageSlotsInstruction') }}
        </v-alert>

        <v-row class="mb-4">
            <v-col cols="12" sm="4" md="3">
                <BaseInput
                    v-model="filters.date"
                    :label="$t('admin.filterByDate')"
                    type="date"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" sm="4" md="3">
                <BaseSelect
                    v-model="filters.isBooked"
                    :label="$t('admin.filterByStatus')"
                    :items="slotStatusOptions"
                    item-title="text"
                    item-value="value"
                    hide-details
                    @update:model-value="$emit('updateList')"
                />
            </v-col>
            <v-col cols="12" md="6" class="d-flex align-center justify-end gap-2 pt-3 pt-md-0">
                 <BaseButton variant="text" color="primary" prepend-icon="mdi-plus" @click="$emit('openGenerateDialog')">
                    {{ $t('admin.generate') }}
                 </BaseButton>
                 <BaseButton variant="text" color="primary" prepend-icon="mdi-refresh" @click="$emit('updateList')" />
            </v-col>
        </v-row>

        <v-data-table
            :headers="headers"
            :items="slots"
            :loading="loading"
            :items-per-page="10"
            :items-per-page-text="$t('common.itemsPerPage')"
            class="data-table-industrial"
        >
            <template v-slot:item.date="{ item }">
                {{ formatDate(item.date) }}
            </template>
            <template v-slot:item.startTime="{ item }">
                {{ formatTime(item.startTime) }}
            </template>
            <template v-slot:item.endTime="{ item }">
                {{ formatTime(item.endTime) }}
            </template>
            <template v-slot:item.isBooked="{ item }">
                <v-chip :color="item.isBooked ? 'warning' : 'success'" size="small" :variant="item.isBooked ? 'flat' : 'tonal'">
                    {{ item.isBooked ? $t('admin.booked') : $t('admin.available') }}
                </v-chip>
            </template>
            <template v-slot:item.isBlocked="{ item }">
                <v-chip :color="item.isBlocked ? 'error' : 'success'" size="small" :variant="item.isBlocked ? 'flat' : 'tonal'">
                    {{ item.isBlocked ? $t('admin.blocked') : $t('admin.open') }}
                </v-chip>
            </template>
            <template v-slot:item.professional.profile.lastName="{ item }">
                 {{ item.professional?.profile?.lastName || 'N/A' }}
            </template>
            <template v-slot:item.actions="{ item }">
                <v-btn
                    v-if="!item.isBlocked && !item.isBooked"
                    size="small"
                    color="error"
                    variant="tonal"
                    @click="$emit('blockSlot', item)"
                >
                    {{ $t('admin.block') }}
                </v-btn>
                <v-btn
                    v-else-if="item.isBlocked"
                    size="small"
                    color="success"
                    variant="tonal"
                    @click="$emit('unblockSlot', item)"
                >
                    {{ $t('admin.unblock') }}
                </v-btn>
                <v-btn
                    size="small"
                    color="error"
                    variant="text"
                    icon="mdi-delete"
                    @click="$emit('deleteSlot', item)"
                    :disabled="item.isBooked"
                />
            </template>
        </v-data-table>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatTime, formatDate } from '@/utils/date'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()

const props = defineProps<{
  slots: any[]
  loading: boolean
  filters: { date: string, isBooked: boolean | undefined }
  slotStatusOptions: { text: string, value: boolean | undefined }[]
  headers: any[]
  loadingProfessionals: boolean
  professionalsList: { id: string; label: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:filters', value: any): void
  (e: 'updateList'): void
  (e: 'openGenerateDialog'): void
  (e: 'blockSlot', slot: any): void
  (e: 'unblockSlot', slot: any): void
  (e: 'deleteSlot', slot: any): void
}>()

const filters = computed({
    get: () => props.filters,
    set: value => emit('update:filters', value)
})

const slotStatusOptions = computed(() => [
    { text: t('admin.available'), value: false },
    { text: t('admin.booked'), value: true }
])

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
</style>