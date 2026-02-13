<template>
  <v-card
    :to="to"
    :class="['base-card', { 'clickable': !!to, 'hover': hover }]"
    v-bind="$attrs"
  >
    <v-card-item v-if="icon || title">
      <template v-slot:prepend v-if="icon">
        <v-avatar :color="iconColor" :size="iconSize">
          <v-icon :icon="icon" :color="iconTextColor"></v-icon>
        </v-avatar>
      </template>
      <v-card-title v-if="title">{{ title }}</v-card-title>
      <v-card-subtitle v-if="subtitle">{{ subtitle }}</v-card-subtitle>
    </v-card-item>
    
    <v-card-text v-if="$slots.default">
      <slot></slot>
    </v-card-text>
    
    <v-card-actions v-if="$slots.actions">
      <slot name="actions"></slot>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
interface Props {
  to?: string
  title?: string
  subtitle?: string
  icon?: string
  iconColor?: string
  iconTextColor?: string
  iconSize?: string | number
  hover?: boolean
}

withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  iconTextColor: 'white',
  iconSize: 48,
  hover: true,
})
</script>

<style scoped>
.base-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
}

.base-card.clickable {
  cursor: pointer;
}

.base-card.hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.15) !important;
  border-color: rgba(var(--v-theme-primary), 0.2);
}

@media (max-width: 600px) {
  .base-card.hover:hover {
    transform: translateY(-2px);
  }
}
</style>
