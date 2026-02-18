import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue')
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue')
  },
  {
    path: '/auth/magic',
    name: 'magic',
    component: () => import('@/views/MagicLinkView.vue')
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/appointments',
    name: 'appointments',
    component: () => import('@/views/AppointmentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/book',
    name: 'book',
    component: () => import('@/views/BookAppointmentView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/admin',
    name: 'admin',
    component: () => import('@/views/AdminView.vue'),
    meta: { requiresAuth: true, roles: ['ADMIN', 'SECRETARY'] }
  },
  {
    path: '/professional-config',
    name: 'professional-config',
    component: () => import('@/views/ProfessionalConfigView.vue'),
    meta: { requiresAuth: true, roles: ['PROFESSIONAL'] }
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.roles && authStore.user) {
    const hasRole = (to.meta.roles as string[]).includes(authStore.user.role)
    if (!hasRole) {
      next({ name: 'dashboard' })
      return
    }
  }

  next()
})

export default router
