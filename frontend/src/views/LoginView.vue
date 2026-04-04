<template>
  <v-container fluid class="fill-height bg-surface pa-0">
    <v-row align="center" justify="center" class="ma-0">
      <v-col cols="12" sm="10" md="8" lg="5" xl="4">
        <v-card class="pa-6 pa-sm-10" elevation="4">
          <!-- Header -->
          <div class="text-center mb-10">
            <v-avatar color="primary" size="64" class="mb-4 elevation-2">
              <v-icon icon="mdi-shield-lock" size="36" color="white" />
            </v-avatar>
            <h1 class="text-h4 font-weight-bold text-primary">{{ $t('nav.login') }}</h1>
            <p class="text-body-1 text-medium-emphasis mt-1">
              {{ $t('app.title') }} Secure Portal
            </p>
          </div>

          <!-- Login Form -->
          <v-form @submit.prevent="handleLogin" ref="formRef">
            <div class="mb-md">
              <BaseInput
                v-model="form.email"
                type="email"
                autocomplete="username" 
                required
                :label="$t('auth.email')"
                prepend-inner-icon="mdi-email-outline"
                :rules="emailRules"
                placeholder="email@example.com"
              />
            </div>
            
            <div class="mb-md">
              <BaseInput
                v-model="form.password"
                type="password"
                autocomplete="current-password" 
                required
                :label="$t('auth.password')"
                prepend-inner-icon="mdi-lock-outline"
                :rules="passwordRules"
                placeholder="••••••••"
              />
            </div>

            <div class="d-flex justify-end mb-lg">
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
            >
              {{ $t('auth.login') }}
            </BaseButton>
          </v-form>

          <!-- Divider -->
          <div class="d-flex align-center my-lg">
            <v-divider />
            <span class="mx-4 text-caption text-medium-emphasis text-uppercase font-weight-bold">{{ $t('common.or') }}</span>
            <v-divider />
          </div>

          <!-- Alternative Auth -->
          <div class="d-flex flex-column gap-md">
            <v-btn
              variant="outlined"
              color="primary"
              size="large"
              block
              prepend-icon="mdi-cellphone-link"
              @click="showMagicLink = true"
            >
              {{ $t('auth.enterWithMagic') }}
            </v-btn>

            <div class="text-center mt-lg">
              <span class="text-body-2 text-medium-emphasis">{{ $t('auth.dontHaveAccount') }}</span>
              <v-btn
                variant="text"
                color="primary"
                to="/register"
                class="text-none font-weight-bold ml-1"
              >
                {{ $t('nav.register') }}
              </v-btn>
            </div>
          </div>
        </v-card>
        
        <!-- Footer Info -->
        <div class="text-center mt-lg text-caption text-disabled">
          v1.0.5 // SECURE SYSTEM NODE
        </div>
      </v-col>
    </v-row>

    <!-- Magic Link Dialog -->
    <MagicLinkDialog
      v-model="showMagicLink"
      :loading="sendingMagic"
      @send="sendMagicLink"
    />
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { useValidation } from '@/composables/useValidation'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import MagicLinkDialog from '@/components/auth/MagicLinkDialog.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { success, error } = useToast()
const { t } = useI18n()
const { emailRules, passwordRules } = useValidation()

const formRef = ref()
const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const showMagicLink = ref(false)
const sendingMagic = ref(false)

async function handleLogin() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await authStore.login(form.email, form.password)
    console.log('Login successful');
    success(t('auth.loginSuccess'))
    const redirect = route.query.redirect as string || '/dashboard'
    console.log('Redirecting to:', redirect);
    router.push(redirect)
  } catch (err: any) {
    console.error('Login error:', err);
  } finally {
    loading.value = false
  }
}

async function sendMagicLink(phone: string) {
  sendingMagic.value = true
  try {
    await authStore.magicLink(phone)
    success(t('auth.magicLinkSent'))
    showMagicLink.value = false
  } catch (err: any) {
    error(err.response?.data?.message || t('auth.magicLinkFailed'))
  } finally {
    sendingMagic.value = false
  }
}
</script>

<style scoped>
.gap-3 {
  gap: 12px;
}
</style>
