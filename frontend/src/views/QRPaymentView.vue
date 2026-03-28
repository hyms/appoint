<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-xl mx-auto">
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-2">QR Payment Upload</h1>
        <p class="text-body-1 text-medium-emphasis">
          Generate and upload your payment proof.
        </p>
      </v-col>
    </v-row>

    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>1. Scan or View QR</v-card-title>
          <v-card-text>
            <v-img
              v-if="qrImageUrl"
              :src="qrImageUrl"
              max-height="300"
              class="mb-4"
            />
            <v-btn color="primary" block @click="generateQR">
              Generate Payment QR
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="6">
        <v-card class="pa-4">
          <v-card-title>2. Upload Payment Proof</v-card-title>
          <v-card-text>
            <v-file-input
              v-model="paymentFile"
              label="Upload payment screenshot"
              accept="image/*"
              prepend-icon="mdi-camera"
              @update:modelValue="previewImage"
            />
            <v-img
              v-if="previewUrl"
              :src="previewUrl"
              max-height="200"
              class="mt-4"
            />
          </v-card-text>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="success"
              :loading="uploading"
              :disabled="!paymentFile"
              @click="uploadPayment"
            >
              Submit Payment
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card class="pa-4">
          <v-card-title>Payment History</v-card-title>
          <v-card-text>
            <v-timeline v-if="paymentHistory.length > 0" side="end">
              <v-timeline-item
                v-for="payment in paymentHistory"
                :key="payment.id"
                :dot-color="getPaymentStatusColor(payment.status)"
                size="small"
              >
                <template v-slot:opposite>
                  {{ new Date(payment.updatedAt).toLocaleDateString() }}
                </template>
                <v-card flat>
                  <v-card-title class="text-subtitle-1">
                    {{ payment.status }}
                  </v-card-title>
                  <v-card-text>
                    {{ payment.notes || 'No additional notes' }}
                  </v-card-text>
                </v-card>
              </v-timeline-item>
            </v-timeline>
            <p v-else>No payment history</p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import api from '@/services/api'
import { paymentsService, type QRPayment } from '@/services/payments'
import { useToast } from '@/composables/useToast'
import { useAppColors } from '@/composables/useAppColors'

const { success, error } = useToast()
const { getPaymentStatusColor } = useAppColors()

const route = useRoute()
const appointmentId = computed(() => route.query.appointmentId as string)

const qrImageUrl = ref('')
const paymentFile = ref<File | null>(null)
const previewUrl = ref('')
const paymentHistory = ref<any[]>([])
const uploading = ref(false)

onMounted(async () => {
  if (appointmentId.value) {
    await loadPaymentStatus()
  }
})

async function loadPaymentStatus() {
  try {
    const payment = await paymentsService.getPaymentStatus(appointmentId.value)
    if (payment) {
      qrImageUrl.value = payment.qrImageUrl
      paymentHistory.value.push(payment)
    }
  } catch (error) {
    console.error('Failed to load payment status:', error)
  }
}

async function generateQR() {
  try {
    const response = await api.post('/payments/generate', {
      appointmentId: appointmentId.value
    })
    qrImageUrl.value = response.data.qrImageUrl
  } catch (err) {
    error('Failed to generate QR')
  }
}

function previewImage(files: File | File[] | null) {
  const file = Array.isArray(files) ? files[0] : files
  if (file) {
    previewUrl.value = URL.createObjectURL(file)
  }
}

async function uploadPayment() {
  if (!appointmentId.value || !paymentFile.value) return

  uploading.value = true
  try {
    const payment = await paymentsService.uploadPayment(appointmentId.value, paymentFile.value)
    paymentHistory.value.unshift(payment)
    success('Payment uploaded successfully!')
    paymentFile.value = null
    previewUrl.value = ''
  } catch (err) {
    error('Failed to upload payment')
  } finally {
    uploading.value = false
  }
}
</script>
