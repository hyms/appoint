<template>
  <v-app>
    <!-- Navigation Drawer (Desktop & Mobile when authenticated) -->
    <v-navigation-drawer
      v-if="authStore.isAuthenticated"
      v-model="drawerOpen"
      :rail="rail && !$vuetify.display.mobile"
      :permanent="!$vuetify.display.mobile"
      :temporary="$vuetify.display.mobile"
      color="primary"
    >
      <v-list-item nav class="py-4">
        <template v-slot:prepend>
          <v-icon size="large" color="white">mdi-hospital-building</v-icon>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold text-white">
          {{ $t('app.title') }}
        </v-list-item-title>
        <template v-slot:append>
          <v-btn
            v-if="!$vuetify.display.mobile"
            variant="text"
            icon="mdi-chevron-left"
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
          color="white"
          rounded="lg"
        />
      </v-list>

      <template v-slot:append>
        <v-divider />
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-translate"
            :title="rail ? '' : $t('nav.language')"
            @click="toggleLocale"
            color="white"
            rounded="lg"
          />
          <v-list-item
            prepend-icon="mdi-logout"
            :title="rail ? '' : $t('nav.logout')"
            @click="logout"
            color="white"
            rounded="lg"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="primary" density="comfortable" elevation="2">
      <v-app-bar-nav-icon
        v-if="authStore.isAuthenticated && $vuetify.display.mobile"
        @click="drawerOpen = !drawerOpen"
      />
      <v-app-bar-title class="font-weight-bold">
        {{ $t('app.title') }}
      </v-app-bar-title>
      <v-spacer />
      <template v-if="!authStore.isAuthenticated">
        <v-btn to="/login" variant="text">{{ $t('nav.login') }}</v-btn>
        <v-btn to="/register" variant="text">{{ $t('nav.register') }}</v-btn>
      </template>
      <template v-else>
        <v-btn
          v-if="!$vuetify.display.mobile"
          icon="mdi-menu"
          variant="text"
          @click="rail = !rail"
        />
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-translate</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item @click="changeLocale('en')">
              <v-list-item-title>English</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLocale('es')">
              <v-list-item-title>Español</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4 pa-sm-6">
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRouter, useRoute } from 'vue-router'
import { useVuetify } from '@/composables/useVuetify'
import ToastContainer from '@/components/ToastContainer.vue'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const vuetify = useVuetify()

const drawerOpen = ref(true)
const rail = ref(false)
const activeTab = computed(() => route.path)

const menuItems = computed(() => {
  const items = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: 'mdi-view-dashboard' },
    { to: '/appointments', label: t('appointments.title'), icon: 'mdi-calendar' },
    { to: '/book', label: t('appointments.book'), icon: 'mdi-calendar-plus' },
  ]
  
  // Add administrative tools for professionals
  if (authStore.user?.role === 'PROFESSIONAL') {
    items.push({ to: '/professional-config', label: 'Herramientas Administrativas', icon: 'mdi-account-cog' })
  }
  
  // Add admin panel for admins and secretaries
  if (['ADMIN', 'SECRETARY'].includes(authStore.user?.role || '')) {
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
  
  if (authStore.user?.role === 'PROFESSIONAL') {
    items.push({ to: '/professional-config', label: 'Admin', icon: 'mdi-account-cog' })
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

<style>
.v-btn {
  min-height: 44px;
  min-width: 44px;
}

@media (max-width: 600px) {
  .v-btn {
    font-size: 0.875rem;
  }
  .v-card-title {
    font-size: 1.125rem;
  }
}
</style>
