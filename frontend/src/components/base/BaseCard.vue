<template>
  <v-card
    :to="to"
    :class="['base-card', { 'clickable': !!to, 'hover-effect': hover }]"
    variant="outlined"
    v-bind="$attrs"
  >
    <v-card-item v-if="icon || title" class="pt-6 pb-2">
      <template v-slot:prepend v-if="icon">
        <v-avatar :color="iconColor" :size="iconSize" rounded="0" class="mr-3">
          <v-icon :icon="icon" :color="iconTextColor"></v-icon>
        </v-avatar>
      </template>
      <v-card-title v-if="title" class="text-uppercase font-weight-black letter-spacing-1">{{ title }}</v-card-title>
      <v-card-subtitle v-if="subtitle" class="text-caption font-weight-bold opacity-60">{{ subtitle }}</v-card-subtitle>
    </v-card-item>
    
    <v-card-text v-if="$slots.default" class="pb-6">
      <slot></slot>
    </v-card-text>
    
    <v-card-actions v-if="$slots.actions" class="pa-4 pt-0">
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
  iconTextColor: 'on-primary',
  iconSize: 48,
  hover: true,
})
</script>
 
<style scoped>
.base-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(var(--v-border-color), 0.8) !important;
  border-radius: 0 !important;
  position: relative;
}

.base-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 12px 12px 0;
  border-color: transparent rgb(var(--v-theme-primary)) transparent transparent;
  opacity: 0.5;
}

.base-card.clickable {
  cursor: pointer;
}

.base-card.hover-effect:hover {
  border-color: rgb(var(--v-theme-primary)) !important;
  background-color: rgba(var(--v-theme-primary), 0.02);
}

.letter-spacing-1 {
  letter-spacing: 1px;
}
</style>