<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="420" persistent>
    <v-card class="pa-6 border-thin">
      <v-card-title class="text-h6 mb-2 px-0 d-flex align-center">
        <v-icon icon="mdi-cellphone-link" class="mr-3" color="primary" />
        <span class="text-uppercase font-weight-black">{{ $t('auth.enterWithMagic') }}</span>
      </v-card-title>
      
      <v-card-text class="px-0">
        <p class="text-body-2 text-medium-emphasis mb-6">
          Enter your phone number and we'll send you a magic link to login instantly. No password required.
        </p>
        
        <BaseInput
          v-model="phone"
          :label="$t('auth.phone')"
          type="tel"
          required
          prepend-inner-icon="mdi-phone"
          placeholder="+1 (555) 000-0000"
          @keyup.enter="handleSend"
          class="mb-2"
        />
      </v-card-text>
      
      <v-card-actions class="px-0 pt-4">
        <v-btn
          variant="text"
          @click="$emit('update:modelValue', false)"
          class="text-none"
        >
          {{ $t('common.cancel') }}
        </v-btn>
        <v-spacer />
        <BaseButton
          color="primary"
          :loading="loading"
          :disabled="!phone"
          @click="handleSend"
          class="px-8"
        >
          {{ $t('auth.magicLink') }}
        </BaseButton>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'

const props = defineProps<{
  modelValue: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'send', phone: string): void
}>()

const phone = ref('')

function handleSend() {
  if (phone.value) {
    emit('send', phone.value)
  }
}
</script>
