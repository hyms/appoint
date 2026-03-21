<template>
  <div class="app-container" v-bind="$attrs">
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// Este componente aplica el padding base definido en el sistema de espaciado
</script>

<style scoped>
.app-container {
  padding: var(--container-padding);
}
</style>