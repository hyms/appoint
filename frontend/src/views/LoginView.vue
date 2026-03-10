<template>
  <v-row align="center" justify="center" class="fill-height ma-0 bg-neutral-light">
    <v-col cols="12" sm="10" md="8" lg="5" xl="4">
      <!-- Decorative element -->
      <div class="login-decoration mb-n8 ml-4 opacity-20 text-h1 font-weight-black text-primary">360</div>
      
      <v-card class="pa-8 pa-sm-12 border-thick elevation-0 position-relative overflow-visible" color="surface">
        <!-- Logo/Header -->
        <div class="mb-10">
          <div class="d-flex align-center mb-4">
            <v-icon icon="mdi-shield-lock" size="48" color="primary" class="mr-4" />
            <div>
              <span class="text-overline font-weight-black text-primary letter-spacing-2">AUTHENTICATION</span>
              <h1 class="text-h3 font-weight-black text-uppercase mt-n1">{{ $t('nav.login') }}</h1>
            </div>
          </div>
          <p class="text-body-1 text-medium-emphasis font-weight-medium">
            Access the <span class="text-primary font-weight-bold">{{ $t('app.title') }}</span> secure management portal.
          </p>
        </div>

        <!-- Login Form -->
        <v-form @submit.prevent="handleLogin" ref="formRef" class="mt-6">
          <div class="mb-6">
            <label class="text-overline font-weight-black mb-1 d-block">{{ $t('auth.email') }}</label>
            <BaseInput
              v-model="form.email"
              type="email"
              required
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              placeholder="operator@system360.com"
            />
          </div>
          
          <div class="mb-2">
            <label class="text-overline font-weight-black mb-1 d-block">{{ $t('auth.password') }}</label>
            <BaseInput
              v-model="form.password"
              type="password"
              required
              prepend-inner-icon="mdi-lock-outline"
              :rules="passwordRules"
              placeholder="••••••••"
            />
          </div>

          <div class="d-flex justify-end mb-8">
            <v-btn
              variant="text"
              size="small"
              color="primary"
              @click="showMagicLink = true"
              class="text-none font-weight-bold"
            >
              {{ $t('auth.forgotPassword') || 'LOST ACCESS?' }}
            </v-btn>
          </div>

          <BaseButton
            type="submit"
            color="primary"
            size="large"
            block
            :loading="loading"
            append-icon="mdi-arrow-right"
            height="64"
            class="text-h6"
          >
            {{ $t('auth.login').toUpperCase() }}
          </BaseButton>
        </v-form>

        <!-- Divider -->
        <div class="divider-container my-10">
          <div class="divider-line"></div>
          <span class="divider-text mx-4 text-overline font-weight-black opacity-50">{{ $t('common.or') }}</span>
          <div class="divider-line"></div>
        </div>

        <!-- Alternative Auth -->
        <div class="d-flex flex-column gap-4">
          <v-btn
            variant="outlined"
            color="primary"
            size="large"
            block
            prepend-icon="mdi-cellphone-link"
            @click="showMagicLink = true"
            height="56"
          >
            {{ $t('auth.enterWithMagic').toUpperCase() }}
          </v-btn>

          <v-btn
            variant="text"
            color="medium-emphasis"
            size="large"
            block
            to="/register"
            height="56"
            class="mt-4"
          >
            {{ $t('auth.dontHaveAccount') }} <span class="text-primary font-weight-black ml-2">{{ $t('nav.register').toUpperCase() }}</span>
          </v-btn>
        </div>
      </v-card>
      
      <!-- System Info Footer -->
      <div class="text-center mt-8 text-overline font-weight-black opacity-30 letter-spacing-1">
        v1.0.4-PROD // SECURE NODE: {{ systemId }}
      </div>
    </v-col>
  </v-row>

  <!-- Magic Link Dialog -->
  <MagicLinkDialog
    v-model="showMagicLink"
    :loading="sendingMagic"
    @send="sendMagicLink"
  />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import MagicLinkDialog from '@/components/auth/MagicLinkDialog.vue'

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
const sendingMagic = ref(false)
const systemId = ref('AP-360-' + Math.random().toString(36).substring(2, 7).toUpperCase())

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

async function sendMagicLink(phone: string) {
  sendingMagic.value = true
  try {
    await authStore.magicLink(phone)
    success('Magic link sent! Check your phone.')
    showMagicLink.value = false
  } catch (err: any) {
    error(err.response?.data?.message || 'Failed to send magic link')
  } finally {
    sendingMagic.value = false
  }
}
</script>

<style scoped>
.bg-neutral-light {
  background-color: #f0f2f5;
}

.border-thick {
  border: 4px solid #1A1A1A !important;
}

.login-decoration {
  user-select: none;
  pointer-events: none;
  z-index: 0;
}

.letter-spacing-2 {
  letter-spacing: 2px;
}

.letter-spacing-1 {
  letter-spacing: 1px;
}

.divider-container {
  display: flex;
  align-items: center;
  width: 100%;
}

.divider-line {
  flex: 1;
  height: 2px;
  background-color: rgba(0, 0, 0, 0.1);
}

.gap-4 {
  gap: 16px;
}
</style>

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
