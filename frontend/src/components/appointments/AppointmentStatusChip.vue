<template>
  <v-chip
    :color="getStatusColor(status)"
    :size="size"
    :variant="variant"
    class="text-uppercase font-weight-black"
  >
    {{ formatStatus(status) }}
  </v-chip>
</template>

<script setup lang="ts">
import { useAppColors } from '@/composables/useAppColors'

withDefaults(defineProps<{
  status: string
  size?: string
  variant?: 'flat' | 'tonal' | 'outlined'
}>(), {
  size: 'x-small',
  variant: 'flat'
})

const { getStatusColor, formatStatus } = useAppColors()
</script>
