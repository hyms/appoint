<template>
  <div class="app-loader text-center py-12">
    <v-progress-circular
      indeterminate
      color="primary"
      size="48"
      width="4"
      class="mb-4"
    ></v-progress-circular>
    <p class="text-h6 font-weight-medium text-primary">{{ message || 'Loading...' }}</p>
    <p class="text-caption text-medium-emphasis opacity-70">Please wait a moment</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message?: string
}>()
</script>

<style scoped>
.app-loader {
    user-select: none;
}
.opacity-70 {
    opacity: 0.7;
}
</style>
