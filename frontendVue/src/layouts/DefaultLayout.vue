<template>
  <v-layout class="rounded rounded-md">
    <!-- Barra de aplicación (Navbar) -->
    <v-app-bar color="primary" density="compact">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>Appoint Dashboard</v-app-bar-title>

      <v-spacer></v-spacer>

      <v-btn icon>
        <v-icon>mdi-magnify</v-icon>
      </v-btn>

      <v-btn icon>
        <v-icon>mdi-dots-vertical</v-icon>
      </v-btn>

      <!-- Botón de Logout (ejemplo) -->
      <v-btn color="white" variant="flat" @click="handleLogout">
        <v-icon left>mdi-logout</v-icon>
        Cerrar Sesión
      </v-btn>
    </v-app-bar>

    <!-- Cajón de navegación (Sidebar) -->
    <v-navigation-drawer v-model="drawer">
      <v-list-item title="Appoint" subtitle="Menú Principal"></v-list-item>
      <v-divider></v-divider>
      <v-list-item link title="Dashboard" prepend-icon="mdi-view-dashboard" @click="goToDashboard"></v-list-item>
      <v-list-item link title="Pacientes" prepend-icon="mdi-account-group"></v-list-item>
      <v-list-item link title="Doctores" prepend-icon="mdi-doctor"></v-list-item>
      <v-list-item link title="Servicios" prepend-icon="mdi-medical-bag"></v-list-item>
      <!-- Puedes añadir más elementos de menú aquí -->
    </v-navigation-drawer>

    <!-- Área de contenido principal del layout -->
    <v-main class="d-flex flex-column" style="min-height: 300px;">
      <!-- Slot para el contenido de la ruta (ej. Dashboard.vue) -->
      <slot />
    </v-main>
  </v-layout>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Importa tu store de Pinia

const router = useRouter();
const authStore = useAuthStore();

const drawer = ref(true); // Controla la visibilidad del sidebar

const handleLogout = () => {
  authStore.logout(); // Llama a la acción de logout de Pinia
};

const goToDashboard = () => {
  router.push('/'); // Asumiendo que '/' es el Dashboard
};

// Puedes añadir más funciones para navegar a otras rutas
</script>

<style scoped>
/* Estilos específicos para DefaultLayout si es necesario */
</style>
