// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth'; // Import your Pinia store

// Importa Dashboard.vue para que todas las rutas temporales apunten aquí
import DashboardView from '@/views/DashboardView.vue';

// Define the routes for the application.
const routes: Array<RouteRecordRaw> = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: DashboardView, // Apunta directamente al DashboardView
    meta: { requiresAuth: true }
  },
  // *** RUTAS PARA LOS MENUS - TODAS APUNTAN TEMPORALMENTE A DASHBOARDVIEW ***
  {
    path: '/settings/general',
    name: 'GeneralSettings',
    component: import('@/views/GeneralSettingsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/staffs',
    name: 'AdminStaffs',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/doctors/dashboard',
    name: 'DoctorDashboard',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/doctors/appointments',
    name: 'DoctorAppointments',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/doctors/holidays',
    name: 'DoctorHolidays',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/dashboard',
    name: 'PatientDashboard',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/patients/appointments',
    name: 'PatientAppointments',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/doctors',
    name: 'AdminDoctors',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/doctor-sessions',
    name: 'AdminDoctorSessions',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/patients',
    name: 'AdminPatients',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/appointments',
    name: 'AdminAppointments',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/services',
    name: 'AdminServices',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/service-categories',
    name: 'AdminServiceCategories',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/clinic-schedules',
    name: 'AdminClinicSchedules',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/holidays', // Duplicado con DoctorHolidays, pero para Admin
    name: 'AdminHolidays',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/settings-contact',
    name: 'AdminSettingsContact',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  {
    path: '/profile/edit', // Ruta de perfil de usuario
    name: 'ProfileEdit',
    component: DashboardView, // Temporalmente a DashboardView
    meta: { requiresAuth: true }
  },
  // *** FIN RUTAS TEMPORALES ***

  {
    path: '/:pathMatch(.*)*',
    redirect: (to) => {
      const authStore = useAuthStore();
      if (authStore.isAuthenticated) {
        return { name: 'Dashboard' };
      } else {
        return { name: 'Login' };
      }
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  const requiresAuth = to.meta.requiresAuth;

  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login' });
  } else if (!requiresAuth && authStore.isAuthenticated && to.name === 'Login') {
    next({ name: 'Dashboard' });
  } else {
    next();
  }
});

export default router;
