<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="pa-4">
          <v-card-title class="text-center">
            {{ $t('auth.magicLinkLogin') }}
          </v-card-title>
          <v-card-text class="text-center">
            <p v-if="!validating && !error">
              {{ $t('auth.enterMagicLinkToken') }}
            </p>
            <v-text-field
              v-model="token"
              :label="$t('auth.token')"
              :disabled="validating"
              class="mb-4"
            />
            <v-btn
              color="primary"
              block
              :loading="validating"
              :disabled="!token"
              @click="validateToken"
            >
              {{ $t('auth.validateToken') }}
            </v-btn>
            <v-alert v-if="error" type="error" class="mt-4">
              {{ error }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { t } = useI18n()

const token = ref('')
const validating = ref(false)
const error = ref('')

onMounted(() => {
  const urlToken = route.query.token as string
  if (urlToken) {
    token.value = urlToken
    validateToken()
  }
})

async function validateToken() {
  validating.value = true
  error.value = ''
  try {
    await authStore.validateMagicLink(token.value)
    router.push('/dashboard')
  } catch (err: any) {
    error.value = err.response?.data?.message || t('auth.invalidOrExpiredToken')
  } finally {
    validating.value = false
  }
}
</script>
