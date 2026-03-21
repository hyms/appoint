<template>
  <v-text-field
    v-model="modelValue"
    :label="label"
    :type="type"
    :required="required"
    :rules="rules"
    :error-messages="errorMessages"
    :hint="hint"
    :persistent-hint="persistentHint"
    :prepend-inner-icon="prependInnerIcon"
    :append-inner-icon="appendInnerIcon"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    :variant="variant"
    :rounded="rounded"
    :hide-details="hideDetails"
    :density="density"
    :rows="rows"
    class="base-input-field"
    v-bind="$attrs"
  />
</template>

<script setup lang="ts">

defineProps<{
  label?: string
  type?: string
  required?: boolean
  placeholder?: string
  rules?: any
  errorMessages?: string | string[]
  hint?: string
  persistentHint?: boolean
  prependInnerIcon?: string
  appendInnerIcon?: string
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  variant?: 'outlined' | 'filled' | 'plain'
  rounded?: string | number
  hideDetails?: boolean | 'auto'
  density?: 'compact' | 'comfortable' | 'default'
  rows?: number
}>()

// Use defineModel for two-way binding compatibility with v-model
const modelValue = defineModel<any>()
</script>

<style scoped>
.base-input-field {
  transition: all 0.2s ease-in-out;
}
</style>
