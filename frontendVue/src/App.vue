<template>
  <v-responsive>
    <!-- Renderiza el layout dinámicamente según la ruta -->
    <component :is="currentLayout">
      <!-- router-view renderizará el componente de la ruta actual (ej. LoginView, Dashboard)
           dentro del slot del layout seleccionado. -->
      <router-view />
    </component>
  </v-responsive>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// Define los componentes de layout de forma asíncrona para carga perezosa
// Esto es opcional, pero ayuda a la optimización.
const AuthLayout = defineAsyncComponent(() => import('@/layouts/AuthLayout.vue'))
const DefaultLayout = defineAsyncComponent(() => import('@/layouts/DefaultLayout.vue'))

// Propiedad computada para determinar qué layout usar
const currentLayout = computed(() => {
  // Si la ruta requiere autenticación, usa DefaultLayout (para páginas protegidas)
  // De lo contrario, usa AuthLayout (para login, registro, etc.)
  return route.meta.requiresAuth ? DefaultLayout : AuthLayout
})
</script>

<style>
/* Estilos globales para la aplicación */
html, body, #app {
  height: 100%;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: 'Roboto', sans-serif; /* Puedes cambiar la fuente si lo deseas */
}
</style>
