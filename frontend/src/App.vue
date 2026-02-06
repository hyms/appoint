<template>
  <v-app>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>{{ $t('app.title') }}</v-app-bar-title>
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

    <v-main>
      <v-container>
        <router-view />
      </v-container>
    </v-main>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const { locale } = useI18n()
const authStore = useAuthStore()
const router = useRouter()

const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

function changeLocale(lang: string) {
  locale.value = lang
  localStorage.setItem('locale', lang)
}

function logout() {
  authStore.logout()
  router.push('/login')
  snackbar.message = 'Logged out successfully'
  snackbar.color = 'info'
  snackbar.show = true
}
</script>
