<template>
  <v-card
    :to="to"
    :class="['base-card', { 'clickable': !!to }]"
    :variant="variant"
    v-bind="$attrs"
  >
    <v-card-item v-if="icon || title" class="pt-4">
      <template v-slot:prepend v-if="icon">
        <v-avatar :color="iconColor" :size="iconSize" class="mr-3">
          <v-icon :icon="icon" :color="iconTextColor"></v-icon>
        </v-avatar>
      </template>
      <v-card-title v-if="title" class="font-weight-bold">{{ title }}</v-card-title>
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
  variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'plain'
}
 
withDefaults(defineProps<Props>(), {
  iconColor: 'primary',
  iconTextColor: 'white',
  iconSize: 40,
  variant: 'elevated',
})
</script>
 
<style scoped>
.base-card {
  transition: box-shadow 0.2s ease-in-out;
}
 
.base-card.clickable:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important; /* Lighter hover shadow */
}
</style>
