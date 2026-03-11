<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-md mx-auto">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-1">
          {{ $t('appointments.book') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          Follow the {{ stepperItems.length }} steps below to secure your appointment slot.
        </p>
      </v-col>
    </v-row>

    <v-card variant="outlined" class="bg-surface border-thin">
      <v-stepper
        v-model="step"
        :items="stepperItems"
        editable
        alt-labels
        color="primary"
        class="bg-transparent elevation-0"
      >
        <template v-slot:default="{ prevStep, nextStep }">
          <v-stepper-window>
            <!-- Step 1: Professional Selection -->
            <v-stepper-content :step="1" class="pa-0">
              <v-card variant="flat" class="py-4 px-4 px-sm-6">
                <h2 class="text-h5 font-weight-bold mb-4">1. Select Practitioner</h2>
                <v-card-text class="pa-0">
                  <BaseSelect
                    v-model="selectedProfessional"
                    :items="professionals"
                    item-title="label"
                    item-value="id"
                    label="Choose Practitioner"
                    prepend-inner-icon="mdi-doctor"
                    :loading="loadingProfessionals"
                    variant="outlined"
                    rounded="md"
                    hide-details
                    @update:model-value="onProfessionalSelect"
                  />
                  <v-alert type="info" variant="tonal" class="mt-4" rounded="md" icon="mdi-account-group-outline">
                    <span class="font-weight-bold">Tip:</span> Selecting a practitioner initiates the scheduling process.
                  </v-alert>
                </v-card-text>
                <v-card-actions class="pt-4 px-0 justify-end">
                  <BaseButton
                    color="primary"
                    append-icon="mdi-arrow-right"
                    :disabled="!selectedProfessional"
                    @click="nextStep"
                  >
                    Next Step
                  </BaseButton>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Step 2: Date Selection -->
            <v-stepper-content :step="2" class="pa-0">
              <v-card variant="flat" class="py-4 px-4 px-sm-6">
                <h2 class="text-h5 font-weight-bold mb-4">2. Select Date</h2>
                <v-card-text class="pa-0">
                  <v-date-picker
                    v-model="selectedDate"
                    color="primary"
                    :min="minDate"
                    :max="maxDate"
                    @update:modelValue="onDateSelect"
                    full-width
                    show-adjacent-months
                    rounded="lg"
                  />
                  <v-alert type="info" variant="tonal" class="mt-4" rounded="md" icon="mdi-calendar" v-if="selectedDate">
                    Selected: <span class="font-weight-bold">{{ formatLongDate(selectedDate) }}</span>
                  </v-alert>
                </v-card-text>
                <v-card-actions class="pt-4 px-0 justify-space-between">
                  <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="prevStep">
                    Back
                  </BaseButton>
                  <BaseButton
                    color="primary"
                    append-icon="mdi-arrow-right"
                    :disabled="!selectedDate"
                    @click="nextStep"
                  >
                    Next Step
                  </BaseButton>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Step 3: Time Slot Selection -->
            <v-stepper-content :step="3" class="pa-0">
              <v-card variant="flat" class="py-4 px-4 px-sm-6 min-h-80">
                <h2 class="text-h5 font-weight-bold mb-4">3. Select Time Slot</h2>

                <v-card-text class="pa-0">
                  <div v-if="loadingSlots" class="text-center py-12">
                    <IndustrialLoader message="CALCULATING SLOTS" />
                  </div>

                  <div v-else-if="!selectedDate" class="text-center py-12">
                    <v-icon icon="mdi-calendar-question" size="64" color="grey-lighten-3" class="mb-2" />
                    <p class="mt-2 text-h6 font-weight-bold">Date Not Set</p>
                    <p class="text-body-2 text-medium-emphasis">Please return to Step 2 to select a date.</p>
                  </div>

                  <div v-else-if="availableSlots.length === 0" class="text-center py-12">
                    <v-icon icon="mdi-calendar-remove" size="64" color="error" class="mb-2" />
                    <p class="mt-2 text-h6 font-weight-bold">No Slots Found</p>
                    <p class="text-body-2 text-medium-emphasis">This practitioner has no available openings on this day.</p>
                    <BaseButton color="primary" variant="text" @click="loadAvailableSlots" class="mt-3">
                      Refresh Availability
                    </BaseButton>
                  </div>

                  <div v-else>
                    <p class="text-overline font-weight-bold mb-3 opacity-80">Available Times</p>
                    <v-chip-group mandatory v-model="selectedSlotId" column>
                      <v-chip
                        v-for="slot in availableSlots"
                        :key="slot.id"
                        :value="slot.id"
                        filter
                        variant="outlined"
                        color="primary"
                        size="large"
                        class="chip-time"
                      >
                        <v-icon start icon="mdi-clock-outline" />
                        {{ formatTime(slot.startTime) }}
                      </v-chip>
                    </v-chip-group>
                    <v-alert type="info" variant="tonal" class="mt-4" rounded="md" icon="mdi-clock-check-outline" v-if="selectedSlot">
                      Selected Time: {{ formatTime(selectedSlot.startTime) }}
                    </v-alert>
                  </div>
                </v-card-text>
                <v-card-actions class="pt-4 px-0 justify-space-between">
                  <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="prevStep">
                    Back
                  </BaseButton>
                  <BaseButton
                    color="primary"
                    append-icon="mdi-arrow-right"
                    :disabled="!selectedSlotId"
                    @click="nextStep"
                  >
                    Next Step
                  </BaseButton>
                </v-card-actions>
              </v-card>
            </v-stepper-content>

            <!-- Step 4: Confirmation -->
            <v-stepper-content :step="4" class="pa-0">
              <v-card variant="flat" class="py-4 px-4 px-sm-6">
                <h2 class="text-h5 font-weight-bold mb-4">4. Review & Book</h2>

                <v-card-text class="pa-0">
                  <v-alert type="success" variant="tonal" class="mb-6" rounded="md" icon="mdi-calendar-check-outline">
                    All information confirmed. Final review before booking.
                  </v-alert>

                  <v-list density="comfortable" class="bg-grey-lighten-5 rounded-lg mb-6 border-thin">
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-doctor" color="primary" class="mr-2" />
                      </template>
                      <v-list-item-title class="text-caption">Practitioner</v-list-item-title>
                      <v-list-item-subtitle class="text-body-1 font-weight-bold">{{ selectedProfessionalName }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-divider />
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-calendar" color="primary" class="mr-2" />
                      </template>
                      <v-list-item-title class="text-caption">Date</v-list-item-title>
                      <v-list-item-subtitle class="text-body-1 font-weight-bold">{{ formatLongDate(selectedDate) }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-divider />
                    <v-list-item>
                      <template v-slot:prepend>
                        <v-icon icon="mdi-clock" color="primary" class="mr-2" />
                      </template>
                      <v-list-item-title class="text-caption">Time Slot</v-list-item-title>
                      <v-list-item-subtitle class="text-body-1 font-weight-bold">{{ selectedSlot ? formatTime(selectedSlot.startTime) : 'N/A' }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>

                  <BaseInput
                    v-model="notes"
                    label="Notes (Optional)"
                    placeholder="Any specific instructions for the practitioner..."
                    rows="2"
                    variant="outlined"
                    rounded="md"
                  />
                </v-card-text>
                <v-card-actions class="pt-4 px-0 justify-space-between">
                  <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="prevStep">
                    Back
                  </BaseButton>
                  <BaseButton
                    color="success"
                    size="large"
                    :loading="booking"
                    :disabled="!selectedSlotId"
                    append-icon="mdi-calendar-check-outline"
                    @click="confirmBooking"
                  >
                    CONFIRM & BOOK
                  </BaseButton>
                </v-card-actions>
              </v-card>
            </v-stepper-content>
          </v-stepper-window>
        </template>
      </v-stepper>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { appointmentsService } from '@/services/appointments'
import { slotsService, type Slot } from '@/services/slots'
import api from '@/services/api'
import { formatLongDate, formatTime } from '@/utils/date'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import IndustrialLoader from '@/components/base/IndustrialLoader.vue'

const router = useRouter()
const { success, error } = useToast()

const step = ref(1)
const professionals = ref<{ id: string; label: string }[]>([])
const availableSlots = ref<Slot[]>([])
const selectedProfessional = ref<string | null>(null)
const selectedDate = ref<Date | null>(null)
const selectedSlotId = ref<string | null>(null)
const notes = ref('')
const booking = ref(false)
const loadingSlots = ref(false)
const loadingProfessionals = ref(false)

// --- Computed Properties ---
const selectedSlot = computed(() => availableSlots.value.find(slot => slot.id === selectedSlotId.value) || null)

const selectedProfessionalName = computed(() => {
  const found = professionals.value.find(p => p.id === selectedProfessional.value)
  return found?.label || 'Not Selected'
})

const stepperItems = [
    { title: 'Practitioner', icon: 'mdi-account-check-outline' },
    { title: 'Date', icon: 'mdi-calendar-check-outline' },
    { title: 'Time Slot', icon: 'mdi-clock-time-four-outline' },
    { title: 'Confirm', icon: 'mdi-check-all' },
]

const minDate = computed(() => new Date())
const maxDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return date
})

onMounted(async () => {
  await loadProfessionals()
})

// --- API Calls ---
async function loadProfessionals() {
  loadingProfessionals.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionals.value = response.data.map((u: any) => ({
      id: u.id,
      label: `Dr. ${u.firstName || ''} ${u.lastName || ''} (${u.specialty || 'General'})`
    }))
  } catch (err) {
    console.error('Failed to load professionals:', err)
    error('Failed to load practitioners')
  } finally {
    loadingProfessionals.value = false
  }
}

async function loadAvailableSlots() {
  if (!selectedProfessional.value || !selectedDate.value) {
    return
  }
  
  loadingSlots.value = true
  
  try {
    const year = selectedDate.value.getFullYear()
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.value.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    const response = await slotsService.getAvailable(
      selectedProfessional.value,
      dateStr
    )
    
    availableSlots.value = response.slots || []
  } catch (err: any) {
    console.error('Failed to load slots:', err)
    error('Failed to load available slots')
  } finally {
    loadingSlots.value = false
  }
}

// --- User Actions ---
function onProfessionalSelect() {
  availableSlots.value = []
  selectedSlotId.value = null
  selectedDate.value = null
}

function onDateSelect() {
  if (selectedProfessional.value && selectedDate.value) {
    loadAvailableSlots()
  } else {
    availableSlots.value = []
    selectedSlotId.value = null
  }
}

async function confirmBooking() {
  if (!selectedSlotId.value || !selectedProfessional.value || !selectedDate.value) {
    error('Please complete all steps before confirming.')
    return
  }

  booking.value = true
  try {
    await appointmentsService.create({
      professionalId: selectedProfessional.value,
      slotId: selectedSlotId.value,
      notes: notes.value
    })
    success('Appointment booked successfully! Check your appointments tab.')
    router.push('/appointments')
  } catch (err: any) {
    console.error('Booking error:', err)
    error(err.response?.data?.message || 'Failed to book appointment. Slot might be taken.')
  } finally {
    booking.value = false
  }
}
</script>

<style scoped>
.min-h-80 {
    min-height: 320px; /* Ensure consistent card height when loading/empty */
}

.opacity-80 {
    opacity: 0.8;
}

.chip-time {
    /* Industrial style chip with slight lift */
    transition: all 0.15s ease;
    border-radius: 4px !important;
}

.chip-time:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}
</style>
