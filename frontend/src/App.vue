<template>
  <v-app>
    <!-- Navigation Drawer (Desktop & Mobile when authenticated) -->
    <v-navigation-drawer
      v-if="authStore.isAuthenticated"
      v-model="drawerOpen"
      :rail="rail && !$vuetify.display.mobile"
      :permanent="!$vuetify.display.mobile"
      :temporary="$vuetify.display.mobile"
      class="app-nav-drawer"
    >
      <v-list-item nav class="py-4">
        <template v-slot:prepend>
          <v-icon size="large" color="primary">mdi-hospital-building</v-icon>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold text-primary">
          {{ $t('app.title') }}
        </v-list-item-title>
        <template v-slot:append>
          <v-btn
            v-if="!$vuetify.display.mobile"
            variant="text"
            :icon="rail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click="rail = !rail"
          />
        </template>
      </v-list-item>

      <v-divider class="mb-2" />

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.label"
          color="primary"
          rounded="sm"
        />
      </v-list>

      <template v-slot:append>
        <v-divider />
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-translate"
            :title="rail ? '' : $t('nav.language')"
            @click="toggleLocale"
            color="primary"
            rounded="sm"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="surface" density="comfortable" elevation="1">
      <v-btn
        v-if="authStore.isAuthenticated && !$vuetify.display.mobile"
        icon
        variant="text"
        @click="rail = !rail"
      >
        <v-icon>{{ rail ? 'mdi-chevron-right' : 'mdi-chevron-left' }}</v-icon>
      </v-btn>
      <v-app-bar-nav-icon
        v-if="authStore.isAuthenticated && $vuetify.display.mobile"
        @click="drawerOpen = !drawerOpen"
      />
      <v-app-bar-title class="font-weight-bold">
        {{ $t('app.title') }}
      </v-app-bar-title>
      <v-spacer />
      <template v-if="!authStore.isAuthenticated">
        <v-btn to="/login" variant="text">Login</v-btn>
        <v-btn to="/register" variant="text">Register</v-btn>
      </template>
      <template v-else>
        <!-- User Menu -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="200">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-account</v-icon>
              </template>
              <v-list-item-title class="font-weight-medium">
                {{ authStore.user?.email }}
              </v-list-item-title>
              <v-list-item-subtitle>
                {{ authStore.user?.role }}
              </v-list-item-subtitle>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item @click="changeLocale('en')">
              <template v-slot:prepend>
                <v-icon size="small">mdi-translate</v-icon>
              </template>
              <v-list-item-title>English</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLocale('es')">
              <template v-slot:prepend>
                <v-icon size="small">mdi-translate</v-icon>
              </template>
              <v-list-item-title>Español</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item @click="logout">
              <template v-slot:prepend>
                <v-icon size="small" color="error">mdi-logout</v-icon>
              </template>
              <v-list-item-title class="text-error">
                Logout
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4 pa-sm-8 max-width-xl mx-auto">
        <router-view />
      </v-container>
    </v-main>

    <!-- Mobile Bottom Navigation -->
    <v-bottom-navigation
      v-if="$vuetify.display.mobile && authStore.isAuthenticated"
      v-model="activeTab"
      grow
      color="primary"
    >
      <v-btn
        v-for="item in bottomNavItems"
        :key="item.to"
        :to="item.to"
        :value="item.to"
      >
        <v-icon :icon="item.icon" />
        <span class="text-caption">{{ item.label }}</span>
      </v-btn>
    </v-bottom-navigation>

    <ToastContainer />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useVuetify } from '@/composables/useVuetify'
import { useAuthorization } from '@/composables/useAuthorization'
import { useOneSignal } from '@/composables/useOneSignal'
import ToastContainer from '@/components/ToastContainer.vue'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const vuetify = useVuetify()
const { isProfessional, isAdminOrSecretary } = useAuthorization()
const { initOneSignal } = useOneSignal()

onMounted(async () => {
  await initOneSignal()
})

const drawerOpen = ref(true)
const rail = ref(false)
const activeTab = computed(() => route.path)

const menuItems = computed(() => {
  const items = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'mdi-view-dashboard' },
    { to: '/appointments', label: t('appointments.title'), icon: 'mdi-calendar' },
    { to: '/book', label: t('appointments.book'), icon: 'mdi-calendar-plus' },
  ]
  
  if (isProfessional.value) {
    items.push({ to: '/professional-config', label: 'Herramientas Administrativas', icon: 'mdi-account-cog' })
  }
  
  if (isAdminOrSecretary.value) {
    items.push({ to: '/admin', label: 'Admin', icon: 'mdi-shield-account' })
  }
  
  return items
})

const bottomNavItems = computed(() => {
  const items = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'mdi-view-dashboard' },
    { to: '/appointments', label: t('appointments.title'), icon: 'mdi-calendar' },
    { to: '/book', label: t('appointments.book'), icon: 'mdi-calendar-plus' },
  ]
  
  if (isProfessional.value) {
    items.push({ to: '/professional-config', label: 'Admin', icon: 'mdi-account-cog' })
  }
  
  if (isAdminOrSecretary.value) {
    items.push({ to: '/admin', label: 'Admin', icon: 'mdi-shield-account' })
  }
  
  return items
})

function changeLocale(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

function toggleLocale() {
  const newLang = locale.value === 'en' ? 'es' : 'en'
  changeLocale(newLang)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.app-nav-drawer {
    background-color: #0A0A0A !important;
    border-right: 1px solid rgba(var(--v-border-color), 0.2) !important;
}

.max-width-xl {
  max-width: 1600px;
}

.app-nav-drawer .v-list-item {
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.7);
}

.app-nav-drawer .v-list-item--active {
  color: rgb(var(--v-theme-primary));
  background-color: rgba(var(--v-theme-primary), 0.2);
}

.app-nav-drawer .v-list-item .v-icon {
    color: rgba(255, 255, 255, 0.7) !important;
}

.app-nav-drawer .v-list-item--active .v-icon {
    color: rgb(var(--v-theme-primary)) !important;
}

.v-app-bar {
    border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.v-list-item-title {
  letter-spacing: 0.5px;
}
</style>