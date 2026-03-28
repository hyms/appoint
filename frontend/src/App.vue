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
      class="app-nav-drawer"
    >
      <v-list-item nav class="py-4">
        <template v-slot:prepend>
          <v-icon size="large" color="white">mdi-hospital-building</v-icon>
        </template>
        <v-list-item-title class="text-h6 font-weight-bold text-white">
          {{ $t('app.title') }}
        </v-list-item-title>
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
          rounded="sm"
          class="text-white"
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
            rounded="sm"
            class="text-white"
          />
        </v-list>
      </template>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="surface" density="comfortable" elevation="1">
      <v-app-bar-nav-icon v-if="authStore.isAuthenticated" @click="drawerOpen = !drawerOpen" />
      <v-app-bar-title class="font-weight-bold">
        {{ $t('app.title') }}
      </v-app-bar-title>
      <v-spacer />
      <template v-if="!authStore.isAuthenticated">
        <v-btn to="/login" variant="text">{{ $t('nav.login') }}</v-btn>
        <v-btn to="/register" variant="text">{{ $t('nav.register') }}</v-btn>
      </template>
      <template v-else>
        <!-- User Menu -->
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-btn v-bind="props" icon variant="text" :aria-label="$t('app.userMenu')">
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
              <v-list-item-title>{{ $t('nav.english') }}</v-list-item-title>
            </v-list-item>
            <v-list-item @click="changeLocale('es')">
              <template v-slot:prepend>
                <v-icon size="small">mdi-translate</v-icon>
              </template>
              <v-list-item-title>{{ $t('nav.spanish') }}</v-list-item-title>
            </v-list-item>
            <v-divider class="my-1" />
            <v-list-item @click="logout">
              <template v-slot:prepend>
                <v-icon size="small" color="error">mdi-logout</v-icon>
              </template>
              <v-list-item-title class="text-error">
                {{ $t('nav.logout') }}
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
const { initOneSignal, loginToOneSignal } = useOneSignal()

onMounted(async () => {
  await authStore.initializeSession()
  await initOneSignal()

  if (authStore.isAuthenticated && authStore.user) {
    // If session is already active (e.g., returning user with token), link OneSignal ID
    await loginToOneSignal(authStore.user.id)
  }
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
    items.push({
      to: '/professional-config',
      label: t('nav.administrativeTools'),
      icon: 'mdi-account-cog',
    })
  }

  if (isAdminOrSecretary.value) {
    items.push({ to: '/admin', label: t('nav.adminPanel'), icon: 'mdi-shield-account' })
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
    items.push({ to: '/professional-config', label: t('nav.adminPanel'), icon: 'mdi-account-cog' })
  }

  if (isAdminOrSecretary.value) {
    items.push({ to: '/admin', label: t('nav.adminPanel'), icon: 'mdi-shield-account' })
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
