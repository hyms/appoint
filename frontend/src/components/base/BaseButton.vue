<template>
  <v-btn
    :color="color"
    :variant="variant"
    :size="size"
    :block="block"
    :loading="loading"
    :disabled="disabled"
    :to="to"
    :height="height || minHeight"
    class="base-button text-uppercase"
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
  height?: string | number
}

withDefaults(defineProps<Props>(), {
  color: 'primary',
  variant: 'flat',
  size: 'large',
  block: false,
  loading: false,
  disabled: false,
  minHeight: 48,
})
</script>

<style scoped>
.base-button {
  font-weight: 900;
  letter-spacing: 0.1em;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0 !important;
}

.base-button:hover:not(:disabled) {
  opacity: 0.9;
  box-shadow: 4px 4px 0px currentColor !important;
}

.base-button:active:not(:disabled) {
  transform: translate(2px, 2px);
  box-shadow: 0px 0px 0px currentColor !important;
}

@media (max-width: 600px) {
  .base-button {
    font-size: 0.875rem;
  }
}
</style>
