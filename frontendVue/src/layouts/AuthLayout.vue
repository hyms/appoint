<template>
  <v-app>
    <!-- Este layout es simple, centrará su contenido (el router-view) -->
    <v-main class="d-flex align-center justify-center h-screen bg-grey-lighten-3">
      <slot />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
</script>

<style scoped>
/* Estilos específicos para AuthLayout si es necesario */
.h-screen {
  height: 100vh; /* Asegura que ocupe toda la altura de la ventana */
}
</style>
