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

    <!-- Step 1: Professional -->
    <v-card class="mb-4">
      <v-card-title>1. Select Professional</v-card-title>
      <v-card-text>
        <v-select
          v-model="selectedProfessional"
          :items="professionals"
          item-title="label"
          item-value="id"
          label="Choose your doctor"
          prepend-inner-icon="mdi-doctor"
          @update:modelValue="onProfessionalSelect"
        />
      </v-card-text>
    </v-card>

    <!-- Step 2: Date -->
    <v-card class="mb-4">
      <v-card-title>2. Select Date</v-card-title>
      <v-card-text>
        <v-date-picker
          v-model="selectedDate"
          color="primary"
          :min="minDate"
          :max="maxDate"
          @update:modelValue="onDateSelect"
          full-width
        />
      </v-card-text>
    </v-card>

    <!-- Step 3: Available Slots -->
    <v-card class="mb-4">
      <v-card-title>3. Select Time</v-card-title>
      <v-card-text>
        <div v-if="loadingSlots" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-2">Loading available slots...</p>
        </div>
        
        <div v-else-if="availableSlots.length === 0" class="text-center py-4">
          <v-icon icon="mdi-calendar-remove" size="48" color="grey" />
          <p class="mt-2">No available slots for this date</p>
          <v-btn color="primary" variant="text" @click="loadAvailableSlots">
            Try another date
          </v-btn>
        </div>
        
        <div v-else>
          <p class="mb-2">Available times:</p>
          <v-chip-group v-model="selectedSlot" column>
            <v-chip
              v-for="slot in availableSlots"
              :key="slot.id"
              :value="slot"
              filter
              variant="outlined"
              size="large"
            >
              {{ formatTime(slot.startTime) }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-card-text>
    </v-card>

    <!-- Step 4: Confirm -->
    <v-card v-if="selectedSlot" class="mb-4">
      <v-card-title>4. Confirm Booking</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item>
            <v-list-item-title>Professional</v-list-item-title>
            <v-list-item-subtitle>{{ selectedProfessionalName }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Date</v-list-item-title>
            <v-list-item-subtitle>{{ formatDateFull(selectedDate) }}</v-list-item-subtitle>
          </v-list-item>
          <v-list-item>
            <v-list-item-title>Time</v-list-item-title>
            <v-list-item-subtitle>{{ selectedSlot ? formatTime(selectedSlot.startTime) : '' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-textarea
          v-model="notes"
          label="Additional notes (optional)"
          rows="2"
          class="mt-2"
        />

        <v-btn
          color="success"
          size="large"
          block
          :loading="booking"
          @click="confirmBooking"
        >
          Book Appointment
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Debug Info -->
    <v-card class="mb-4" v-if="$vuetify.display.mdAndUp">
      <v-card-title class="text-caption">Debug Info</v-card-title>
      <v-card-text>
        <p>Professional: {{ selectedProfessional }}</p>
        <p>Date: {{ selectedDate }}</p>
        <p>Slots loaded: {{ availableSlots.length }}</p>
        <p>Selected slot: {{ selectedSlot?.id }}</p>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { appointmentsService, slotsService, type Slot } from '@/services/appointments'

const router = useRouter()
const authStore = useAuthStore()
const { success, error } = useToast()

const professionals = ref<{ id: string; label: string }[]>([])
const availableSlots = ref<Slot[]>([])
const selectedProfessional = ref<string | null>(null)
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
  // Load professional from database
  professionals.value = [
    { id: '2c9ab7c4-5d4f-4edc-b93c-08bc3daa1b55', label: 'Dr. Test - Professional' }
  ]
  
  // Auto-select first professional
  if (professionals.value.length > 0) {
    selectedProfessional.value = professionals.value[0].id
  }
})

function onProfessionalSelect() {
  console.log('Professional selected:', selectedProfessional.value)
}

function onDateSelect() {
  console.log('Date selected:', selectedDate.value)
  if (selectedProfessional.value && selectedDate.value) {
    loadAvailableSlots()
  }
}

async function loadAvailableSlots() {
  if (!selectedProfessional.value || !selectedDate.value) {
    console.log('Missing professional or date')
    return
  }
  
  loadingSlots.value = true
  console.log('Loading slots for:', selectedProfessional.value, selectedDate.value)
  
  try {
    // Format date as YYYY-MM-DD
    const year = selectedDate.value.getFullYear()
    const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.value.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    
    console.log('Fetching from API:', dateStr)
    
    const response = await slotsService.getAvailable(
      selectedProfessional.value,
      dateStr
    )
    
    console.log('API Response:', response)
    availableSlots.value = response.slots || []
    console.log('Slots loaded:', availableSlots.value.length)
  } catch (err: any) {
    console.error('Failed to load slots:', err)
    error('Failed to load available slots: ' + (err.message || 'Unknown error'))
  } finally {
    loadingSlots.value = false
  }
}

async function confirmBooking() {
  if (!selectedSlot.value || !selectedProfessional.value) {
    error('Please select a time slot')
    return
  }

  booking.value = true
  try {
    await appointmentsService.create({
      patientId: authStore.user?.id,
      professionalId: selectedProfessional.value,
      slotId: selectedSlot.value.id,
      notes: notes.value
    })
    success('Appointment booked successfully!')
    router.push('/appointments')
  } catch (err: any) {
    console.error('Booking error:', err)
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
