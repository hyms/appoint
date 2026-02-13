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
    :prepend-inner-icon="prependIcon"
    :append-inner-icon="appendIcon"
    :clearable="clearable"
    :disabled="disabled"
    :loading="loading"
    :placeholder="placeholder"
    class="base-input"
    @input="$emit('update:modelValue', $event.target.value)"
    @blur="$emit('blur', $event)"
    @focus="$emit('focus', $event)"
  />
</template>

<script setup lang="ts">
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

withDefaults(defineProps<Props>(), {
  type: 'text',
  required: false,
  clearable: false,
  disabled: false,
  loading: false,
})

defineEmits(['update:modelValue', 'blur', 'focus'])
</script>

<style scoped>
.base-input :deep(.v-field__input) {
  font-size: 1rem;
}

@media (max-width: 600px) {
  .base-input :deep(.v-field__input) {
    font-size: 16px; /* Prevents zoom on iOS */
  }
}
</style>
