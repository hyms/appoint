<template>
  <div class="toast-container">
    <transition-group name="toast">
      <v-alert
        v-for="toast in toasts"
        :key="toast.id"
        :type="toast.type"
        :color="getColor(toast.type)"
        variant="tonal"
        density="comfortable"
        closable
        class="mb-2 toast-item"
        @click:close="remove(toast.id)"
      >
        <div class="d-flex align-center">
          <v-icon :icon="getIcon(toast.type)" class="mr-2" />
          <span class="text-body-2">{{ toast.message }}</span>
        </div>
      </v-alert>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

function getColor(type: string): string {
  const colors: Record<string, string> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  }
  return colors[type] || 'info'
}

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    success: 'mdi-check-circle',
    error: 'mdi-alert-circle',
    warning: 'mdi-alert',
    info: 'mdi-information',
  }
  return icons[type] || 'mdi-information'
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 9999;
  max-width: 400px;
  width: 100%;
}

@media (max-width: 600px) {
  .toast-container {
    top: 8px;
    right: 8px;
    left: 8px;
    max-width: none;
  }
}

.toast-item {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(8px);
}

/* Toast transitions */
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 600px) {
  .toast-enter-from {
    transform: translateY(-100%);
  }
  
  .toast-leave-to {
    transform: translateY(-100%);
  }
}
</style>
