<template>
  <v-row align="center" justify="center" class="fill-height ma-0 bg-background">
    <v-col cols="12" sm="10" md="8" lg="6" xl="5">
      <div class="login-decoration ml-4 opacity-20 text-h1 font-weight-black text-primary">REG</div>
      
      <v-card class="pa-8 pa-sm-12 border-thick elevation-0 position-relative overflow-visible" color="surface">
        <div class="mb-10">
          <div class="d-flex align-center mb-4">
            <v-icon icon="mdi-account-plus" size="48" color="primary" class="mr-4" />
            <div>
              <span class="text-overline font-weight-black text-primary letter-spacing-2">NEW OPERATOR</span>
              <h1 class="text-h3 font-weight-black text-uppercase mt-n1">{{ $t('nav.register') }}</h1>
            </div>
          </div>
          <p class="text-body-1 text-medium-emphasis font-weight-medium">
            Create a new account to join the <span class="text-primary font-weight-bold">{{ $t('app.title') }}</span> network.
          </p>
        </div>

        <v-form @submit.prevent="handleRegister" ref="formRef" class="mt-6">
          <v-row>
            <v-col cols="12" sm="6">
              <BaseInput
                v-model="form.firstName"
                required
                :label="$t('auth.firstName')"
                prepend-inner-icon="mdi-account-outline"
                placeholder="Jane"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <BaseInput
                v-model="form.lastName"
                required
                :label="$t('auth.lastName')"
                prepend-inner-icon="mdi-account-outline"
                placeholder="Doe"
              />
            </v-col>
          </v-row>

          <div class="mb-md mt-md">
            <BaseInput
              v-model="form.email"
              type="email"
              required
              :label="$t('auth.email')"
              prepend-inner-icon="mdi-email-outline"
              :rules="emailRules"
              placeholder="jane.doe@system360.com"
            />
          </div>

          <div class="mb-md">
            <BaseInput
              v-model="form.phone"
              type="tel"
              :label="$t('auth.phone')"
              prepend-inner-icon="mdi-phone-outline"
              placeholder="+1 (555) 000-0000"
            />
          </div>

          <div class="mb-lg">
            <BaseInput
              v-model="form.password"
              type="password"
              required
              :label="$t('auth.password')"
              prepend-inner-icon="mdi-lock-outline"
              :rules="passwordRules"
              placeholder="••••••••"
            />
          </div>

          <BaseButton
            type="submit"
            color="primary"
            size="large"
            block
            :loading="loading"
            append-icon="mdi-chevron-right"
            height="64"
            class="text-h6"
          >
            {{ $t('auth.register').toUpperCase() }}
          </BaseButton>
        </v-form>

        <div class="text-center mt-lg">
          <v-btn
            variant="text"
            color="medium-emphasis"
            to="/login"
            class="text-none"
          >
            Already have an account? <span class="text-primary font-weight-black ml-1">LOGIN HERE</span>
          </v-btn>
        </div>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useValidation } from '@/composables/useValidation'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success, error: showError } = useToast()
const { emailRules, passwordRules } = useValidation()

const formRef = ref()
const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: ''
})

const loading = ref(false)

async function handleRegister() {
  if (!formRef.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  loading.value = true
  try {
    await authStore.register(form)
    success('Registration successful!')
    router.push('/dashboard')
  } catch (err: any) {
    showError(err.response?.data?.message || 'Registration failed')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.border-thick {
  border: 4px solid rgb(var(--v-theme-on-surface));
}

.login-decoration {
  user-select: none;
  pointer-events: none;
  z-index: 0;
}

.letter-spacing-2 {
  letter-spacing: 2px;
}
</style>
