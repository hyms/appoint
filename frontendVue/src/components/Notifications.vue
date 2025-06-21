<template>
  <template v-if="authStore.hasRole('Doctor') || authStore.hasRole('Patient')">
    <v-menu
      v-model="menu"
      :close-on-content-click="false"
      location="bottom right"
      offset-y
    >
      <template v-slot:activator="{ props }">
        <v-btn class="ma-1" icon v-bind="props">
          <v-badge v-if="unreadNotificationsCount > 0" :content="unreadNotificationsCount" color="error">
            <v-icon color="primary">mdi-bell-outline</v-icon>
          </v-badge>
          <v-icon v-else color="primary">mdi-bell-outline</v-icon>
        </v-btn>
      </template>
      <v-card max-width="380" max-height="350" density="comfortable" class="rounded-lg">
        <v-card-title class="text-h6 font-weight-bold">{{ labels.notification.notification }}</v-card-title>
        <v-divider></v-divider>
        <v-list density="compact" class="py-0">
          <template v-if="notifications.length > 0">
            <v-list-item
              v-for="notification in notifications"
              :key="notification.id"
              @click="readNotification(notification.id)"
              :class="{'bg-blue-lighten-5': !notification.isRead}"
              link
            >
              <v-list-item-title class="font-weight-medium">{{ notification.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption text-grey-darken-1">{{ notification.date }}</v-list-item-subtitle>
            </v-list-item>
          </template>
          <v-list-item v-else>
            <v-list-item-title class="text-center text-body-2 text-grey-darken-1 py-4">
              {{ labels.notification.you_dont_have_any_new_notification }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
        <v-divider></v-divider>
        <v-card-actions v-if="notifications.length > 0" class="justify-end py-2">
          <v-btn color="primary" variant="text" @click="markAllAsRead" :loading="markingAllRead">
            {{ labels.notification.mark_all_as_read }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-menu>
  </template>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth'; // Importa tu store de Pinia
import api from '@/api'; // Importa tu instancia de Axios

const authStore = useAuthStore();

const menu = ref(false);
const notifications = ref<any[]>([]); // Array para almacenar las notificaciones
const markingAllRead = ref(false);

// Conteo de notificaciones no leídas
const unreadNotificationsCount = computed(() => notifications.value.filter(n => !n.isRead).length);

// --- PLACEHOLDERS para 'labels' ---
const labels = {
  notification: {
    notification: 'Notificaciones',
    you_dont_have_any_new_notification: 'No tienes nuevas notificaciones.',
    mark_all_as_read: 'Marcar todas como leídas',
  },
};
// --- FIN PLACEHOLDERS ---

// Función para cargar notificaciones desde la API
async function fetchNotifications() {
  // Solo cargar notificaciones si el usuario es Doctor o Paciente
  if (!authStore.hasRole('Doctor') && !authStore.hasRole('Patient')) {
    return;
  }
  try {
    // La URL de tu API para obtener notificaciones debe ser ajustada
    // Asumiendo un endpoint como /users/{userId}/notifications o /notifications
    // Necesitarás el ID del usuario logueado para esto.
    const userId = authStore.userInfo?.userId;
    if (!userId) {
      console.warn("User ID not available for fetching notifications.");
      return;
    }
    const response = await api.get(`/notifications/${userId}`); // Ajusta esta URL

    // Las notificaciones deben tener propiedades como id, title, date, isRead
    notifications.value = response.data.data.map((n: any) => ({
      id: n.id,
      title: n.title,
      date: new Date(n.createdAt).toLocaleDateString(), // Formato de fecha
      isRead: n.isRead,
      // Añade cualquier otra propiedad necesaria
    }));

  } catch (error) {
    console.error('Error al cargar notificaciones:', error);
  }
}

// Función para marcar una notificación como leída
async function readNotification(id: string) {
  try {
    await api.put(`/notifications/${id}/read`); // Ajusta esta URL
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.isRead = true; // Actualiza el estado local
    }
    // Opcional: Recargar todas las notificaciones para asegurar consistencia
    // fetchNotifications();
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
  }
}

// Función para marcar todas las notificaciones como leídas
async function markAllAsRead() {
  markingAllRead.value = true;
  try {
    const userId = authStore.userInfo?.userId;
    if (!userId) {
      console.warn("User ID not available for marking all notifications as read.");
      return;
    }
    await api.put(`/notifications/mark-all-read/${userId}`); // Ajusta esta URL
    notifications.value.forEach(n => n.isRead = true); // Actualiza el estado local
  } catch (error) {
    console.error('Error al marcar todas como leídas:', error);
  } finally {
    markingAllRead.value = false;
  }
}

onMounted(() => {
  fetchNotifications();
  // Puedes configurar un polling para actualizar notificaciones cada X tiempo
  // setInterval(fetchNotifications, 60000); // Cada 60 segundos
});
</script>

<style scoped>
/* Puedes añadir estilos específicos aquí */
</style>
