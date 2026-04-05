<template>
  <v-select
    v-model="modelValue"
    :items="items"
    :label="label"
    :loading="loading"
    :variant="variant"
    :rounded="rounded"
    :hide-details="hideDetails"
    :item-title="itemTitle"
    :item-value="itemValue"
    :rules="rules"
    density="comfortable"
    clearable
    class="mt-1"
  />
</template>

<script setup lang="ts">
// // import { defineProps, defineModel } from 'vue'

defineProps<{
  items: any[]
  label: string
  loading?: boolean
  variant?: 'outlined' | 'plain'
  rounded?: string | number
  hideDetails?: boolean
  itemTitle?: string
  itemValue?: string
  rules?: any
}>()

// Use defineModel for two-way binding compatibility with v-model
const modelValue = defineModel<any>() 
</script>