<template>
  <v-container fluid class="pa-2 pa-sm-4">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h5 text-sm-h4 font-weight-bold">
          {{ $t('appointments.book') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          Follow the steps below to schedule your appointment
        </p>
      </v-col>
    </v-row>

    <!-- Mobile Stepper (Vertical) -->
    <template v-if="$vuetify.display.mobile">
      <v-stepper v-model="step" vertical>
        <!-- Step 1: Professional -->
        <v-stepper-step
          :complete="step > 1"
          step="1"
          :editable="step > 1"
        >
          Select Professional
        </v-stepper-step>
        <v-stepper-content step="1">
          <v-card flat class="pa-2">
            <v-select
              v-model="selectedProfessional"
              :items="professionals"
              item-title="label"
              item-value="id"
              label="Choose your doctor"
              prepend-inner-icon="mdi-doctor"
              @update:modelValue="onProfessionalSelect"
              class="mb-4"
            />
            <BaseButton
              color="primary"
              :disabled="!selectedProfessional"
              @click="step = 2"
              block
            >
              Continue
            </BaseButton>
          </v-card>
        </v-stepper-content>

        <!-- Step 2: Date -->
        <v-stepper-step
          :complete="step > 2"
          step="2"
          :editable="step > 2"
        >
          Select Date
        </v-stepper-step>
        <v-stepper-content step="2">
          <v-card flat class="pa-2">
            <v-date-picker
              v-model="selectedDate"
              color="primary"
              :min="minDate"
              :max="maxDate"
              @update:modelValue="onDateSelect"
              class="mb-4"
              full-width
            />
            <div class="d-flex gap-2">
              <BaseButton
                variant="outlined"
                @click="step = 1"
                class="flex-1"
              >
                Back
              </BaseButton>
              <BaseButton
                color="primary"
                :disabled="!selectedDate"
                @click="step = 3"
                class="flex-1"
              >
                Continue
              </BaseButton>
            </div>
          </v-card>
        </v-stepper-content>

        <!-- Step 3: Time -->
        <v-stepper-step
          :complete="step > 3"
          step="3"
          :editable="step > 3"
        >
          Select Time
        </v-stepper-step>
        <v-stepper-content step="3">
          <v-card flat class="pa-2">
            <div v-if="loadingSlots" class="text-center py-4">
              <v-progress-circular indeterminate color="primary" />
              <p class="mt-2 text-body-2">Loading available slots...</p>
            </div>
            
            <EmptyState
              v-else-if="availableSlots.length === 0"
              icon="mdi-clock-outline"
              title="No slots available"
              description="Please select another date or professional"
              class="py-4"
            />

            <div v-else class="time-slots-grid">
              <v-btn
                v-for="slot in availableSlots"
                :key="slot.id"
                :variant="selectedSlot?.id === slot.id ? 'elevated' : 'outlined'"
                :color="selectedSlot?.id === slot.id ? 'primary' : undefined"
                @click="selectedSlot = slot"
                class="time-slot-btn mb-2"
                size="large"
              >
                {{ formatTime(slot.startTime) }}
              </v-btn>
            </div>

            <div class="d-flex gap-2 mt-4">
              <BaseButton
                variant="outlined"
                @click="step = 2"
                class="flex-1"
              >
                Back
              </BaseButton>
              <BaseButton
                color="primary"
                :disabled="!selectedSlot"
                @click="step = 4"
                class="flex-1"
              >
                Continue
              </BaseButton>
            </div>
          </v-card>
        </v-stepper-content>

        <!-- Step 4: Confirm -->
        <v-stepper-step step="4">
          Confirm
        </v-stepper-step>
        <v-stepper-content step="4">
          <v-card flat class="pa-2">
            <v-list class="bg-transparent">
              <v-list-item class="px-0">
                <template v-slot:prepend>
                  <v-icon icon="mdi-doctor" color="primary" />
                </template>
                <v-list-item-title>Professional</v-list-item-title>
                <v-list-item-subtitle>{{ selectedProfessionalName }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0">
                <template v-slot:prepend>
                  <v-icon icon="mdi-calendar" color="primary" />
                </template>
                <v-list-item-title>Date</v-list-item-title>
                <v-list-item-subtitle>{{ formatDateFull(selectedDate) }}</v-list-item-subtitle>
              </v-list-item>

              <v-list-item class="px-0">
                <template v-slot:prepend>
                  <v-icon icon="mdi-clock" color="primary" />
                </template>
                <v-list-item-title>Time</v-list-item-title>
                <v-list-item-subtitle>{{ selectedSlot ? formatTime(selectedSlot.startTime) : '' }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <v-textarea
              v-model="notes"
              label="Additional notes (optional)"
              rows="3"
              class="mt-4"
              placeholder="Any special requirements or concerns..."
            />

            <div class="d-flex gap-2 mt-4">
              <BaseButton
                variant="outlined"
                @click="step = 3"
                class="flex-1"
              >
                Back
              </BaseButton>
              <BaseButton
                color="success"
                :loading="booking"
                @click="confirmBooking"
                class="flex-1"
                append-icon="mdi-check"
              >
                Book Now
              </BaseButton>
            </div>
          </v-card>
        </v-stepper-content>
      </v-stepper>
    </template>

    <!-- Desktop Stepper (Horizontal) -->
    <template v-else>
      <v-stepper v-model="step" alt-labels class="elevation-2">
        <v-stepper-header>
          <v-stepper-step :complete="step > 1" step="1">
            Professional
          </v-stepper-step>
          <v-divider />
          <v-stepper-step :complete="step > 2" step="2">
            Date
          </v-stepper-step>
          <v-divider />
          <v-stepper-step :complete="step > 3" step="3">
            Time
          </v-stepper-step>
          <v-divider />
          <v-stepper-step step="4">
            Confirm
          </v-stepper-step>
        </v-stepper-header>

        <v-stepper-window>
          <!-- Step 1 -->
          <v-stepper-window-item :value="1">
            <v-card flat class="pa-6">
              <v-select
                v-model="selectedProfessional"
                :items="professionals"
                item-title="label"
                item-value="id"
                label="Select a professional"
                prepend-inner-icon="mdi-doctor"
                class="mb-4"
              />
              <div class="d-flex justify-end">
                <BaseButton
                  color="primary"
                  :disabled="!selectedProfessional"
                  @click="step = 2"
                >
                  Continue
                  <v-icon end icon="mdi-arrow-right" />
                </BaseButton>
              </div>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 2 -->
          <v-stepper-window-item :value="2">
            <v-card flat class="pa-6">
              <v-row justify="center">
                <v-col cols="12" md="6">
                  <v-date-picker
                    v-model="selectedDate"
                    color="primary"
                    :min="minDate"
                    :max="maxDate"
                    @update:modelValue="loadAvailableSlots"
                    full-width
                  />
                </v-col>
              </v-row>
              <div class="d-flex justify-space-between mt-4">
                <BaseButton variant="outlined" @click="step = 1">
                  Back
                </BaseButton>
                <BaseButton
                  color="primary"
                  :disabled="!selectedDate"
                  @click="step = 3"
                >
                  Continue
                </BaseButton>
              </div>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 3 -->
          <v-stepper-window-item :value="3">
            <v-card flat class="pa-6">
              <div v-if="loadingSlots" class="text-center py-8">
                <v-progress-circular indeterminate size="48" color="primary" />
                <p class="mt-4 text-body-1">Loading available slots...</p>
              </div>

              <EmptyState
                v-else-if="availableSlots.length === 0"
                icon="mdi-clock-outline"
                title="No slots available"
                description="Please select another date"
              />

              <div v-else>
                <p class="text-body-1 mb-4">Select a time slot:</p>
                <div class="time-slots-grid-desktop">
                  <v-btn
                    v-for="slot in availableSlots"
                    :key="slot.id"
                    :variant="selectedSlot?.id === slot.id ? 'elevated' : 'outlined'"
                    :color="selectedSlot?.id === slot.id ? 'primary' : undefined"
                    @click="selectedSlot = slot"
                    class="ma-1"
                    size="large"
                  >
                    {{ formatTime(slot.startTime) }}
                  </v-btn>
                </div>
              </div>

              <div class="d-flex justify-space-between mt-6">
                <BaseButton variant="outlined" @click="step = 2">
                  Back
                </BaseButton>
                <BaseButton
                  color="primary"
                  :disabled="!selectedSlot"
                  @click="step = 4"
                >
                  Continue
                </BaseButton>
              </div>
            </v-card>
          </v-stepper-window-item>

          <!-- Step 4 -->
          <v-stepper-window-item :value="4">
            <v-card flat class="pa-6">
              <v-row justify="center">
                <v-col cols="12" md="8">
                  <v-list>
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-doctor" color="primary" />
                      </template>
                      <v-list-item-title>Professional</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedProfessionalName }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-calendar" color="primary" />
                      </template>
                      <v-list-item-title>Date</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDateFull(selectedDate) }}</v-list-item-subtitle>
                    </v-list-item>

                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-clock" color="primary" />
                      </template>
                      <v-list-item-title>Time</v-list-item-title>
                      <v-list-item-subtitle>{{ selectedSlot ? formatTime(selectedSlot.startTime) : '' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <v-textarea
                    v-model="notes"
                    label="Additional notes (optional)"
                    rows="3"
                    class="mt-4"
                  />

                  <div class="d-flex justify-space-between mt-6">
                    <BaseButton variant="outlined" @click="step = 3">
                      Back
                    </BaseButton>
                    <BaseButton
                      color="success"
                      :loading="booking"
                      @click="confirmBooking"
                      append-icon="mdi-check"
                    >
                      Confirm Booking
                    </BaseButton>
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { appointmentsService, slotsService, type Slot } from '@/services/appointments'
import BaseButton from '@/components/base/BaseButton.vue'
import EmptyState from '@/components/base/EmptyState.vue'

const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const step = ref(1)
const professionals = ref<{ id: string; label: string }[]>([])
const availableSlots = ref<Slot[]>([])
const selectedProfessional = ref('')
const selectedDate = ref<Date | null>(null)
const selectedSlot = ref<Slot | null>(null)
const notes = ref('')
const booking = ref(false)
const loadingSlots = ref(false)

const minDate = computed(() => new Date())
const maxDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return date
})

const selectedProfessionalName = computed(() => {
  const found = professionals.value.find(p => p.id === selectedProfessional.value)
  return found?.label || ''
})

onMounted(async () => {
  // For demo, use the professional from database
  // In production, fetch professionals from API
  professionals.value = [
    { id: '2c9ab7c4-5d4f-4edc-b93c-08bc3daa1b55', label: 'Dr. Test - Professional' }
  ]
})

async function onProfessionalSelect() {
  if (selectedProfessional.value && selectedDate.value) {
    await loadAvailableSlots()
  }
}

async function onDateSelect() {
  if (selectedProfessional.value && selectedDate.value) {
    await loadAvailableSlots()
  }
}

async function loadAvailableSlots() {
  if (!selectedProfessional.value || !selectedDate.value) return
  
  loadingSlots.value = true
  try {
    // Format date as YYYY-MM-DD
    const dateStr = selectedDate.value.toISOString().split('T')[0]
    const response = await slotsService.getAvailable(
      selectedProfessional.value,
      dateStr
    )
    availableSlots.value = response.slots || []
  } catch (err) {
    error('Failed to load available slots')
    console.error(err)
  } finally {
    loadingSlots.value = false
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
    success('Appointment booked successfully!')
    router.push('/appointments')
  } catch (err: any) {
    error(err.response?.data?.message || 'Failed to book appointment')
  } finally {
    booking.value = false
  }
}

function formatDateFull(date: Date | null) {
  if (!date) return ''
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(time: string | Date) {
  return new Date(time).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.time-slots-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.time-slots-grid-desktop {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.time-slot-btn {
  min-height: 48px;
}

.flex-1 {
  flex: 1;
}

.gap-2 {
  gap: 8px;
}

@media (min-width: 600px) {
  .time-slots-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 960px) {
  .time-slots-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
