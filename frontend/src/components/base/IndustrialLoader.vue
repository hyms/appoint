<template>
  <div class="industrial-loader text-center py-12">
    <div class="loader-bar mx-auto mb-4"></div>
    <p class="text-h6 font-weight-bold text-primary opacity-90 mt-3">{{ message || 'PROCESSING DATA' }}</p>
    <p class="text-caption text-medium-emphasis opacity-70">Ensuring system integrity...</p>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

defineProps<{
  message?: string
}>()
</script>

<style scoped>
.industrial-loader {
    user-select: none;
}

.loader-bar {
    width: 64px;
    height: 6px;
    background-color: rgb(var(--v-theme-primary));
    animation: pulse-bar 1.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
    border-radius: 1px;
}

@keyframes pulse-bar {
    0%, 100% {
        transform: scaleX(1);
        opacity: 0.8;
    }
    50% {
        transform: scaleX(1.5);
        opacity: 1;
    }
}

.opacity-70 {
    opacity: 0.7;
}
</style>