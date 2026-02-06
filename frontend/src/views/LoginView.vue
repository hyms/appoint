<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-4">
          <v-card-title class="text-h5 text-center">
            {{ $t('nav.login') }}
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="form.email"
                :label="$t('auth.email')"
                type="email"
                required
                class="mb-2"
              />
              <v-text-field
                v-model="form.password"
                :label="$t('auth.password')"
                type="password"
                required
                class="mb-2"
              />
              <v-btn
                type="submit"
                color="primary"
                block
                :loading="loading"
              >
                {{ $t('auth.login') }}
              </v-btn>
            </v-form>
            <v-divider class="my-4" />
            <v-btn
              variant="outlined"
              block
              @click="showMagicLink = true"
            >
              {{ $t('auth.enterWithMagic') }}
            </v-btn>
          </v-card-text>
        </v-card>

        <v-dialog v-model="showMagicLink" max-width="400">
          <v-card class="pa-4">
            <v-card-title>{{ $t('auth.enterWithMagic') }}</v-card-title>
            <v-card-text>
              <v-text-field
                v-model="magicPhone"
                :label="$t('auth.phone')"
                required
              />
              <v-btn
                color="primary"
                block
                :loading="sendingMagic"
                @click="sendMagicLink"
              >
                {{ $t('auth.magicLink') }}
              </v-btn>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const showMagicLink = ref(false)
const magicPhone = ref('')
const sendingMagic = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    const redirect = route.query.redirect as string || '/dashboard'
    router.push(redirect)
  } catch (error: any) {
    alert(error.response?.data?.message || 'Login failed')
  } finally {
    loading.value = false
  }
}

async function sendMagicLink() {
  sendingMagic.value = true
  try {
    await authStore.magicLink(magicPhone.value)
    showMagicLink.value = false
    alert('Magic link sent! (simulated)')
  } catch (error: any) {
    alert(error.response?.data?.message || 'Failed to send magic link')
  } finally {
    sendingMagic.value = false
  }
}
</script>
