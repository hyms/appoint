<template>
  <v-btn
    :color="color"
    :variant="variant"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled"
    :to="to"
    :min-height="minHeight"
    class="base-button"
    v-bind="$attrs"
  >
    <v-icon v-if="prependIcon" :icon="prependIcon" class="mr-2" />
    <slot></slot>
    <v-icon v-if="appendIcon" :icon="appendIcon" class="ml-2" />
  </v-btn>
</template>

<script setup lang="ts">
interface Props {
  color?: string
  variant?: 'text' | 'flat' | 'elevated' | 'tonal' | 'outlined' | 'plain'
  size?: 'x-small' | 'small' | 'default' | 'large' | 'x-large'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  to?: string
  prependIcon?: string
  appendIcon?: string
  minHeight?: string | number
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'elevated',
  size: 'large',
  block: false,
  loading: false,
  disabled: false,
  minHeight: 48,
})
</script>

<style scoped>
.base-button {
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.025em;
  transition: all 0.2s ease;
}

.base-button:active {
  transform: scale(0.98);
}

@media (max-width: 600px) {
  .base-button {
    font-size: 0.9375rem;
  }
}
</style>
