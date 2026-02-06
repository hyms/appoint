<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h4 mb-4">{{ $t('appointments.book') }}</h1>
      </v-col>
    </v-row>

    <v-stepper v-model="step" :items="steps" show-actions>
      <template v-slot:item.1>
        <v-card flat>
          <v-card-title>Select Professional</v-card-title>
          <v-card-text>
            <v-select
              v-model="selectedProfessional"
              :items="professionals"
              item-title="label"
              item-value="id"
              label="Select a professional"
              @update:modelValue="loadSlots"
            />
          </v-card-text>
        </v-card>
      </template>

      <template v-slot:item.2>
        <v-card flat>
          <v-card-title>Select Date</v-card-title>
          <v-card-text>
            <v-date-picker
              v-model="selectedDate"
              color="primary"
              :min="minDate"
              @update:modelValue="loadAvailableSlots"
            />
          </v-card-text>
        </v-card>
      </template>

      <template v-slot:item.3>
        <v-card flat>
          <v-card-title>{{ $t('appointments.selectSlot') }}</v-card-title>
          <v-card-text v-if="availableSlots.length > 0">
            <v-chip-group v-model="selectedSlot" column>
              <v-chip
                v-for="slot in availableSlots"
                :key="slot.id"
                :value="slot"
                filter
              >
                {{ formatTime(slot.startTime) }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-card-text v-else>
            {{ $t('appointments.noSlots') }}
          </v-card-text>
        </v-card>
      </template>

      <template v-slot:item.4>
        <v-card flat>
          <v-card-title>Confirm Booking</v-card-title>
          <v-card-text>
            <v-list>
              <v-list-item>
                <v-list-item-title>Professional</v-list-item-title>
                <v-list-item-subtitle>{{ selectedProfessionalName }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Date</v-list-item-title>
                <v-list-item-subtitle>{{ formatDate(selectedDate) }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <v-list-item-title>Time</v-list-item-title>
                <v-list-item-subtitle>{{ selectedSlot ? formatTime(selectedSlot.startTime) : '' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
            <v-textarea
              v-model="notes"
              label="Notes (optional)"
              rows="3"
              class="mt-4"
            />
          </v-card-text>
        </v-card>
      </template>
    </v-stepper>

    <v-btn
      v-if="step < 4"
      color="primary"
      class="mt-4"
      @click="nextStep"
      :disabled="!canProceed"
    >
      {{ $t('common.next') }}
    </v-btn>

    <v-btn
      v-if="step === 4"
      color="success"
      class="mt-4"
      :loading="booking"
      @click="confirmBooking"
    >
      {{ $t('appointments.book') }}
    </v-btn>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { appointmentsService, slotsService, type Slot } from '@/services/appointments'

const router = useRouter()
const authStore = useAuthStore()

const step = ref(1)
const steps = [
  { title: 'Professional', value: 1 },
  { title: 'Date', value: 2 },
  { title: 'Time', value: 3 },
  { title: 'Confirm', value: 4 }
]

const professionals = ref<{ id: string; label: string }[]>([])
const availableSlots = ref<Slot[]>([])
const selectedProfessional = ref('')
const selectedDate = ref<Date | null>(null)
const selectedSlot = ref<Slot | null>(null)
const notes = ref('')
const booking = ref(false)

const minDate = computed(() => new Date())

const selectedProfessionalName = computed(() => {
  const found = professionals.value.find(p => p.id === selectedProfessional.value)
  return found?.label || ''
})

const canProceed = computed(() => {
  if (step.value === 1) return !!selectedProfessional.value
  if (step.value === 2) return !!selectedDate.value
  if (step.value === 3) return !!selectedSlot.value
  return true
})

onMounted(async () => {
  professionals.value = [
    { id: 'doctor@appointments360.com', label: 'Dr. John Doe' }
  ]
})

async function loadSlots() {
  if (selectedProfessional.value) {
    step.value = 2
  }
}

async function loadAvailableSlots() {
  if (selectedProfessional.value && selectedDate.value) {
    try {
      const response = await slotsService.getAvailable(selectedProfessional.value, selectedDate.value.toISOString())
      availableSlots.value = response.slots
      step.value = 3
    } catch (error) {
      console.error('Failed to load slots:', error)
    }
  }
}

function nextStep() {
  if (step.value === 3 && selectedSlot.value) {
    step.value = 4
  } else {
    step.value++
  }
}

async function confirmBooking() {
  if (!selectedSlot.value || !selectedProfessional.value) return

  booking.value = true
  try {
    await appointmentsService.create({
      professionalId: selectedProfessional.value,
      slotId: selectedSlot.value.id,
      notes: notes.value
    })
    alert($t('appointments.bookingSuccess'))
    router.push('/appointments')
  } catch (error) {
    alert('Failed to book appointment')
  } finally {
    booking.value = false
  }
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString()
}

function formatTime(time: string | Date) {
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
