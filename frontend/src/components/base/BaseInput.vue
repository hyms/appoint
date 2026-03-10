<template>
  <v-text-field
    v-model="value"
    :label="label"
    :type="type"
    :required="required"
    :rules="rules"
    :error-messages="errorMessages"
    :hint="hint"
    :persistent-hint="persistentHint"
    :prepend-inner-icon="prependIcon"
    :append-inner-icon="appendIcon"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    class="base-input"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  />
</template>
 
<script setup lang="ts">
import { computed } from 'vue'
 
interface Props {
  modelValue?: string
  label?: string
  type?: string
  required?: boolean
  rules?: any[]
  errorMessages?: string | string[]
  hint?: string
  persistentHint?: boolean
  prependIcon?: string
  appendIcon?: string
  clearable?: boolean
  disabled?: boolean
  loading?: boolean
  placeholder?: string
}
 
const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  clearable: false,
  disabled: false,
  loading: false,
})
 
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'blur': [event: FocusEvent]
  'focus': [event: FocusEvent]
}>()
 
const value = computed({
  get: () => props.modelValue || '',
  set: (val: string) => emit('update:modelValue', val)
})
</script>
 
<style scoped>
/* Industrial/Utilitarian Aesthetic: Sharper lines, focused states */
.base-input :deep(.v-field) {
  border-radius: 3px !important; /* Sharper field corners */
}

.base-input :deep(.v-field--variant-outlined) {
    border-color: rgba(var(--v-border-color), 0.3) !important;
}

.base-input :deep(.v-field--focused) {
    border-color: rgb(var(--v-theme-primary)) !important;
    box-shadow: 0 0 0 1px rgb(var(--v-theme-primary)); /* Sharp focus ring */
}

.base-input :deep(.v-field__input) {
  font-size: 1rem;
}

@media (max-width: 600px) {
  .base-input :deep(.v-field__input) {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
</style>