// src/router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/store/auth'; // Importa tu store de Pinia

// Define las rutas para la aplicación.
// RouteRecordRaw es el tipo para las definiciones de ruta en Vue Router.
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    // Carga perezosa del componente Login.vue.
    // Esto crea un chunk JavaScript separado para esta ruta, que solo se carga cuando se visita la ruta.
    component: () => import('@/views/Login.vue'),
    // Metadatos de la ruta: indica que esta ruta NO requiere autenticación.
    meta: { requiresAuth: false }
  },
  {
    path: '/', // Esta será la ruta de tu dashboard principal
    name: 'Dashboard',
    // Carga perezosa del componente Dashboard.vue.
    component: () => import('@/views/Dashboard.vue'),
    // Metadatos de la ruta: indica que esta ruta SÍ requiere autenticación.
    meta: { requiresAuth: true }
  },
  // Captura cualquier otra ruta no definida y redirige.
  // Si el usuario está autenticado, redirige al dashboard.
  // Si no está autenticado, redirige a la página de login.
  {
    path: '/:pathMatch(.*)*', // Patrón para capturar todas las rutas no coincidentes
    redirect: (to) => {
      const authStore = useAuthStore(); // Obtiene la instancia del store de autenticación
      if (authStore.isAuthenticated) {
        return { name: 'Dashboard' }; // Redirige al dashboard si está autenticado
      } else {
        return { name: 'Login' }; // Redirige al login si no está autenticado
      }
    }
  }
];

// Crea la instancia del router.
const router = createRouter({
  history: createWebHistory(), // Utiliza la historia del navegador HTML5 (sin '#' en la URL)
  routes, // Asigna las rutas definidas
});

// Guardia de navegación global (middleware)
// Se ejecuta antes de cada navegación de ruta.
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore(); // Accede al store de autenticación
  const requiresAuth = to.meta.requiresAuth; // Verifica si la ruta a la que se intenta acceder requiere autenticación

  if (requiresAuth && !authStore.isAuthenticated) {
    // Caso 1: La ruta requiere autenticación Y el usuario NO está autenticado.
    // Redirige a la página de login.
    next({ name: 'Login' });
  } else if (!requiresAuth && authStore.isAuthenticated && to.name === 'Login') {
    // Caso 2: La ruta NO requiere autenticación (ej. Login) Y el usuario SÍ está autenticado.
    // Redirige al dashboard para evitar que un usuario logueado acceda de nuevo a la página de login.
    next({ name: 'Dashboard' });
  } else {
    // Caso 3: Todas las demás situaciones (ruta pública, o ruta protegida con usuario autenticado).
    // Permite la navegación normal.
    next();
  }
});

export default router; // Exporta el router para ser utilizado en src/main.ts
