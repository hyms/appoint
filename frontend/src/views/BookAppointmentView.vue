<template>
  <v-container fluid class="pa-2 pa-sm-4">
    <!-- Header -->
    <v-row class="mb-4">
      <v-col cols="12">
        <h1 class="text-h5 text-sm-h4 font-weight-bold">
          {{ $t('appointments.book') }}
        </h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ $t('appointments.bookingInstructions') }}
        </p>
      </v-col>
    </v-row>

    <!-- Step 1: Professional -->
    <v-card class="mb-4" :elevation="2">
      <v-card-item>
        <template v-slot:prepend>
          <v-avatar color="primary" size="32">
            <span class="text-white">1</span>
          </v-avatar>
        </template>
        <v-card-title>{{ $t('appointments.selectProfessional') }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-select
          v-model="selectedProfessional"
          :items="professionals"
          item-title="label"
          item-value="id"
          :label="$t('appointments.chooseDoctor')"
          prepend-inner-icon="mdi-doctor"
          :loading="loadingProfessionals"
          variant="outlined"
          @update:modelValue="onProfessionalSelect"
        />
      </v-card-text>
    </v-card>

    <!-- Step 2: Date -->
    <v-card class="mb-4" :elevation="2">
      <v-card-item>
        <template v-slot:prepend>
          <v-avatar color="primary" size="32">
            <span class="text-white">2</span>
          </v-avatar>
        </template>
        <v-card-title>{{ $t('appointments.selectDate') }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-date-picker
          v-model="selectedDate"
          color="primary"
          :min="minDate"
          :max="maxDate"
          @update:modelValue="onDateSelect"
          full-width
          show-adjacent-months
        />
      </v-card-text>
    </v-card>

    <!-- Step 3: Available Slots -->
    <v-card class="mb-4" :elevation="2">
      <v-card-item>
        <template v-slot:prepend>
          <v-avatar color="primary" size="32">
            <span class="text-white">3</span>
          </v-avatar>
        </template>
        <v-card-title>{{ $t('appointments.selectTime') }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <div v-if="loadingSlots" class="text-center py-4">
          <v-progress-circular indeterminate color="primary" />
          <p class="mt-2">{{ $t('appointments.loadingSlots') }}</p>
        </div>
        
        <div v-else-if="!selectedDate" class="text-center py-4">
          <v-icon icon="mdi-calendar-question" size="48" color="grey" />
          <p class="mt-2 text-medium-emphasis">{{ $t('appointments.selectDate') }}</p>
        </div>
        
        <div v-else-if="availableSlots.length === 0" class="text-center py-4">
          <v-icon icon="mdi-calendar-remove" size="48" color="grey" />
          <p class="mt-2">{{ $t('appointments.noSlotsAvailable') }}</p>
          <v-btn color="primary" variant="text" @click="loadAvailableSlots">
            {{ $t('appointments.tryAnotherDate') }}
          </v-btn>
        </div>
        
        <div v-else>
          <p class="mb-2 font-weight-medium">{{ $t('appointments.availableSlots') }}</p>
          <v-chip-group v-model="selectedSlot" column>
            <v-chip
              v-for="slot in availableSlots"
              :key="slot.id"
              :value="slot"
              filter
              variant="outlined"
              size="large"
              color="primary"
            >
              <v-icon start icon="mdi-clock-outline" />
              {{ formatTime(slot.startTime) }}
            </v-chip>
          </v-chip-group>
        </div>
      </v-card-text>
    </v-card>

    <!-- Step 4: Confirm -->
    <v-card v-if="selectedSlot" class="mb-4" :elevation="2">
      <v-card-item>
        <template v-slot:prepend>
          <v-avatar color="success" size="32">
            <v-icon icon="mdi-check" color="white" />
          </v-avatar>
        </template>
        <v-card-title>{{ $t('appointments.confirmAppointment') }}</v-card-title>
      </v-card-item>
      <v-card-text>
        <v-list density="compact" class="bg-grey-lighten-4 rounded-lg mb-3">
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-doctor" color="primary" />
            </template>
            <v-list-item-title class="text-caption">{{ $t('appointments.professional') }}</v-list-item-title>
            <v-list-item-subtitle class="text-body-2">{{ selectedProfessionalName }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-calendar" color="primary" />
            </template>
            <v-list-item-title class="text-caption">{{ $t('appointments.date') }}</v-list-item-title>
            <v-list-item-subtitle class="text-body-2">{{ formatLongDate(selectedDate) }}</v-list-item-subtitle>
          </v-list-item>
          <v-divider />
          <v-list-item>
            <template v-slot:prepend>
              <v-icon icon="mdi-clock" color="primary" />
            </template>
            <v-list-item-title class="text-caption">{{ $t('appointments.time') }}</v-list-item-title>
            <v-list-item-subtitle class="text-body-2">{{ selectedSlot ? formatTime(selectedSlot.startTime) : '' }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>

        <v-textarea
          v-model="notes"
          :label="$t('appointments.notes')"
          :placeholder="$t('appointments.notesPlaceholder')"
          rows="2"
          variant="outlined"
          class="mt-2"
        />

        <v-btn
          color="success"
          size="large"
          block
          :loading="booking"
          :disabled="!selectedSlot"
          @click="confirmBooking"
        >
          <v-icon start icon="mdi-check-circle" />
          {{ $t('appointments.bookAppointment') }}
        </v-btn>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { appointmentsService } from '@/services/appointments'
import { slotsService, type Slot } from '@/services/slots'
import api from '@/services/api'
import { formatLongDate, formatTime } from '@/utils/date'

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
const loadingProfessionals = ref(false)

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
  await loadProfessionals()
})

async function loadProfessionals() {
  loadingProfessionals.value = true
  try {
    const response = await api.get('/auth/professionals')
    professionals.value = response.data.map((u: any) => ({
      id: u.id,
      label: `Dr. ${u.firstName || ''} ${u.lastName || ''}`.trim()
    }))
    
    if (professionals.value.length > 0) {
      selectedProfessional.value = professionals.value[0]!.id
    }
  } catch (err) {
    console.error('Failed to load professionals:', err)
    error('Failed to load professionals')
  } finally {
    loadingProfessionals.value = false
  }
}

function onProfessionalSelect() {
  availableSlots.value = []
  selectedSlot.value = null
}

function onDateSelect() {
  if (selectedProfessional.value && selectedDate.value) {
    loadAvailableSlots()
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

async function confirmBooking() {
  if (!selectedSlot.value || !selectedProfessional.value) {
    error('Please select a time slot')
    return
  }

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
    console.error('Booking error:', err)
    error(err.response?.data?.message || 'Failed to book appointment')
  } finally {
    booking.value = false
  }
}
</script>
