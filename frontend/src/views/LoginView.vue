<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="pa-4 pa-sm-6" elevation="4">
          <!-- Logo/Icon -->
          <div class="text-center mb-6">
            <v-avatar color="primary" size="64" class="mb-4">
              <v-icon icon="mdi-calendar-check" size="36" color="white" />
            </v-avatar>
            <h1 class="text-h5 font-weight-bold mb-1">{{ $t('nav.login') }}</h1>
            <p class="text-body-2 text-medium-emphasis">
              {{ $t('app.title') }}
            </p>
          </div>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin" ref="formRef">
            <BaseInput
              v-model="form.email"
              :label="$t('auth.email')"
              type="email"
              required
              prepend-icon="mdi-email"
              :rules="emailRules"
              class="mb-4"
            />
            <BaseInput
              v-model="form.password"
              :label="$t('auth.password')"
              type="password"
              required
              prepend-icon="mdi-lock"
              :rules="passwordRules"
              class="mb-2"
            />
            
            <div class="d-flex justify-end mb-6">
              <v-btn
                variant="text"
                size="small"
                color="primary"
                @click="showMagicLink = true"
                class="text-none"
              >
                {{ $t('auth.forgotPassword') || 'Forgot password?' }}
              </v-btn>
            </div>

            <BaseButton
              type="submit"
              color="primary"
              size="large"
              block
              :loading="loading"
              append-icon="mdi-arrow-right"
              min-height="52"
            >
              {{ $t('auth.login') }}
            </BaseButton>
          </v-form>

          <!-- Divider -->
          <v-divider class="my-6">
            <span class="text-caption text-medium-emphasis px-2">OR</span>
          </v-divider>

          <!-- Magic Link Button -->
          <BaseButton
            variant="outlined"
            color="primary"
            size="large"
            block
            prepend-icon="mdi-cellphone-link"
            @click="showMagicLink = true"
            min-height="52"
          >
            {{ $t('auth.enterWithMagic') }}
          </BaseButton>

          <!-- Register Link -->
          <div class="text-center mt-6">
            <span class="text-body-2 text-medium-emphasis">
              Don't have an account?
            </span>
            <v-btn
              variant="text"
              color="primary"
              to="/register"
              class="text-none font-weight-bold"
            >
              {{ $t('nav.register') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Magic Link Dialog -->
    <v-dialog v-model="showMagicLink" max-width="420" persistent>
      <v-card class="pa-4">
        <v-card-title class="text-h6 mb-4">
          <v-icon icon="mdi-cellphone-link" class="mr-2" color="primary" />
          {{ $t('auth.enterWithMagic') }}
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Enter your phone number and we'll send you a magic link to login instantly.
          </p>
          <BaseInput
            v-model="magicPhone"
            :label="$t('auth.phone')"
            type="tel"
            required
            prepend-icon="mdi-phone"
            placeholder="+1 (555) 000-0000"
          />
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer />
          <v-btn
            variant="text"
            @click="showMagicLink = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
          <BaseButton
            color="primary"
            :loading="sendingMagic"
            :disabled="!magicPhone"
            @click="sendMagicLink"
          >
            {{ $t('auth.magicLink') }}
          </BaseButton>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error } = useToast()

const formRef = ref()
const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const showMagicLink = ref(false)
const magicPhone = ref('')
const sendingMagic = ref(false)

const emailRules = [
  (v: string) => !!v || 'Email is required',
  (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Email must be valid',
]

const passwordRules = [
  (v: string) => !!v || 'Password is required',
  (v: string) => v.length >= 6 || 'Password must be at least 6 characters',
]

async function handleLogin() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    success('Login successful!')
    const redirect = route.query.redirect as string || '/dashboard'
    router.push(redirect)
  } catch (err: any) {
    error(err.response?.data?.message || 'Login failed. Please check your credentials.')
  } finally {
    loading.value = false
  }
}

async function sendMagicLink() {
  if (!magicPhone.value) return
  
  sendingMagic.value = true
  try {
    await authStore.magicLink(magicPhone.value)
    success('Magic link sent! Check your phone.')
    showMagicLink.value = false
    magicPhone.value = ''
  } catch (err: any) {
    error(err.response?.data?.message || 'Failed to send magic link')
  } finally {
    sendingMagic.value = false
  }
}
</script>

<style scoped>
:deep(.v-divider) {
  display: flex;
  align-items: center;
}

:deep(.v-divider::before),
:deep(.v-divider::after) {
  flex: 1;
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  content: '';
}
</style>
