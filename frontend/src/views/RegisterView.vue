<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="pa-4">
          <v-card-title class="text-h5 text-center">
            {{ $t('nav.register') }}
          </v-card-title>
          <v-card-text>
            <v-form @submit.prevent="handleRegister">
              <v-row>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.firstName"
                    :label="$t('auth.firstName')"
                    required
                  />
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    v-model="form.lastName"
                    :label="$t('auth.lastName')"
                    required
                  />
                </v-col>
              </v-row>
              <v-text-field
                v-model="form.email"
                :label="$t('auth.email')"
                type="email"
                required
                class="mb-2"
              />
              <v-text-field
                v-model="form.phone"
                :label="$t('auth.phone')"
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
                {{ $t('auth.register') }}
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const { error: showError } = useToast()

const form = reactive({
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: ''
})

const loading = ref(false)

async function handleRegister() {
  loading.value = true
  try {
    await authStore.register(form)
    router.push('/dashboard')
  } catch (err: any) {
    showError(err.response?.data?.message || 'Registration failed')
  } finally {
    loading.value = false
  }
}
</script>
