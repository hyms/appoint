<template>
  <v-app>
    <!-- Desktop Navigation -->
    <v-app-bar 
      v-if="!$vuetify.display.mobile"
      color="primary" 
      density="comfortable"
      elevation="2"
    >
      <v-app-bar-title class="font-weight-bold">
        {{ $t('app.title') }}
      </v-app-bar-title>
      <v-spacer />
      <v-btn v-if="!authStore.isAuthenticated" to="/login" variant="text">
        {{ $t('nav.login') }}
      </v-btn>
      <v-btn v-if="!authStore.isAuthenticated" to="/register" variant="text">
        {{ $t('nav.register') }}
      </v-btn>
      <v-btn v-if="authStore.isAuthenticated" to="/dashboard" variant="text">
        {{ $t('nav.dashboard') }}
      </v-btn>
      <v-btn v-if="authStore.isAuthenticated" @click="logout" variant="text">
        {{ $t('nav.logout') }}
      </v-btn>
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
    </v-app-bar>

    <!-- Mobile Navigation Drawer -->
    <v-navigation-drawer
      v-if="$vuetify.display.mobile && authStore.isAuthenticated"
      v-model="mobileMenuOpen"
      temporary
      location="left"
    >
      <v-list>
        <v-list-item
          v-for="item in mobileMenuItems"
          :key="item.to"
          :to="item.to"
          @click="mobileMenuOpen = false"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <v-list-item-title>{{ item.label }}</v-list-item-title>
        </v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item @click="logout">
          <template v-slot:prepend>
            <v-icon icon="mdi-logout"></v-icon>
          </template>
          <v-list-item-title>{{ $t('nav.logout') }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Mobile App Bar -->
    <v-app-bar
      v-if="$vuetify.display.mobile"
      color="primary"
      density="comfortable"
      elevation="2"
    >
      <v-app-bar-nav-icon
        v-if="authStore.isAuthenticated"
        @click="mobileMenuOpen = true"
      />
      <v-app-bar-title class="font-weight-bold">
        {{ $t('app.title') }}
      </v-app-bar-title>
      <v-spacer />
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
    </v-app-bar>

    <v-main>
      <v-container :fluid="true" class="pa-4 pa-sm-6">
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
        <v-icon :icon="item.icon"></v-icon>
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

const { locale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const vuetify = useVuetify()

const mobileMenuOpen = ref(false)
const activeTab = computed(() => route.path)

const mobileMenuItems = computed(() => [
  { to: '/dashboard', label: $t('nav.dashboard'), icon: 'mdi-view-dashboard' },
  { to: '/appointments', label: $t('appointments.title'), icon: 'mdi-calendar' },
  { to: '/book', label: $t('appointments.book'), icon: 'mdi-calendar-plus' },
])

const bottomNavItems = computed(() => [
  { to: '/dashboard', label: $t('nav.dashboard'), icon: 'mdi-view-dashboard' },
  { to: '/appointments', label: $t('appointments.title'), icon: 'mdi-calendar' },
  { to: '/book', label: $t('appointments.book'), icon: 'mdi-calendar-plus' },
])

function changeLocale(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

function logout() {
  authStore.logout()
  router.push('/login')
}
</script>

<style>
/* Global styles for better touch targets */
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
