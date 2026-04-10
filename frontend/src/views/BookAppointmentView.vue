<template>
  <v-container fluid class="pa-4 pa-sm-8 max-width-md mx-auto">
    <!-- Header -->
    <v-row class="mb-6">
      <v-col cols="12">
        <h1 class="text-h3 font-weight-black text-uppercase letter-spacing-1 mb-1">
          {{ $t('appointments.book') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis">
          {{ $t('book.selectDetails') }}
        </p>
      </v-col>
    </v-row>

    <v-card variant="outlined" class="bg-surface border-thin">
      <v-tabs v-model="tab" color="primary" bg-color="transparent" grow>
        <v-tab v-if="locations.length > 1" value="location">
          <v-icon start>mdi-map-marker</v-icon>
          {{ $t('book.location') }}
        </v-tab>
        <v-tab value="professional" :disabled="!selectedLocation && locations.length > 1">
          <v-icon start>mdi-doctor</v-icon>
          {{ $t('book.practitioner') }}
        </v-tab>
        <v-tab value="date" :disabled="!selectedProfessional && professionals.length > 1">
          <v-icon start>mdi-calendar</v-icon>
          {{ $t('book.date') }}
        </v-tab>
        <v-tab value="time" :disabled="!selectedDate">
          <v-icon start>mdi-clock</v-icon>
          {{ $t('book.time') }}
        </v-tab>
        <v-tab value="confirm" :disabled="!selectedSlotId">
          <v-icon start>mdi-check-all</v-icon>
          {{ $t('book.confirm') }}
        </v-tab>
      </v-tabs>

      <v-divider />

      <v-card variant="flat" class="pa-4 pa-sm-6">
        <v-window v-model="tab">
          <!-- Tab 1: Location Selection -->
          <v-window-item v-if="locations.length > 1" value="location">
            <h2 class="text-h5 font-weight-bold mb-4">{{ $t('book.selectLocation') }}</h2>
            <BaseSelect
              v-model="selectedLocation"
              :items="locations"
              item-title="name"
              item-value="id"
              :label="$t('book.chooseLocation')"
              prepend-inner-icon="mdi-map-marker"
              :loading="loadingLocations"
              variant="outlined"
              rounded="md"
              hide-details
              @update:model-value="onLocationSelect"
            />
            <div class="mt-6 d-flex justify-end">
              <BaseButton
                color="primary"
                append-icon="mdi-arrow-right"
                :disabled="!selectedLocation"
                @click="tab = 'professional'"
              >
                {{ $t('common.next') }}
              </BaseButton>
            </div>
          </v-window-item>

          <!-- Tab 2: Professional Selection -->
          <v-window-item v-if="locations.length > 1 || selectedLocation" value="professional">
            <h2 class="text-h5 font-weight-bold mb-4">{{ $t('book.selectPractitioner') }}</h2>
            <BaseSelect
              v-model="selectedProfessional"
              :items="professionals"
              item-title="label"
              item-value="id"
              :label="$t('book.choosePractitioner')"
              prepend-inner-icon="mdi-doctor"
              :loading="loadingProfessionals"
              variant="outlined"
              rounded="md"
              hide-details
              @update:model-value="onProfessionalSelect"
            />
            <div class="mt-6 d-flex justify-space-between">
              <BaseButton v-if="locations.length > 1" color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="tab = 'location'">
                {{ $t('common.back') }}
              </BaseButton>
              <div v-else />
              <BaseButton
                color="primary"
                append-icon="mdi-arrow-right"
                :disabled="!selectedProfessional"
                @click="tab = 'date'"
              >
                {{ $t('common.next') }}
              </BaseButton>
            </div>
          </v-window-item>

          <!-- Tab 3: Date Selection -->
          <v-window-item v-if="selectedProfessional" value="date">
            <h2 class="text-h5 font-weight-bold mb-4">{{ $t('book.selectDate') }}</h2>
            <v-date-picker
              v-model="selectedDate"
              color="primary"
              :min="minDate"
              :max="maxDate"
              locale="es"
              @update:modelValue="onDateSelect"
              full-width
              show-adjacent-months
              rounded="lg"
              :title="$t('book.selectDate')"
            />
            <div class="mt-6 d-flex justify-space-between">
              <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="tab = 'professional'">
                {{ $t('common.back') }}
              </BaseButton>
              <BaseButton
                color="primary"
                append-icon="mdi-arrow-right"
                :disabled="!selectedDate"
                @click="tab = 'time'"
              >
                {{ $t('common.next') }}
              </BaseButton>
            </div>
          </v-window-item>
          
          <!-- Tab 4: Time Slot Selection -->
          <v-window-item value="time">
            <h2 class="text-h5 font-weight-bold mb-4">{{ $t('book.selectTimeSlot') }}</h2>
            <div v-if="loadingSlots" class="text-center py-12">
              <IndustrialLoader :message="$t('book.calculatingSlots')" />
            </div>
            <div v-else-if="availableSlots.length === 0" class="text-center py-12">
              <v-icon icon="mdi-calendar-remove" size="64" color="error" class="mb-2" />
              <p class="mt-2 text-h6 font-weight-bold">{{ $t('book.noSlotsFound') }}</p>
            </div>
              <div v-else>
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
                  {{ slot.startTime }}
                </v-chip>
              </v-chip-group>
            </div>
            <div class="mt-6 d-flex justify-space-between">
              <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="tab = 'date'">
                {{ $t('common.back') }}
              </BaseButton>
              <BaseButton
                color="primary"
                append-icon="mdi-arrow-right"
                :disabled="!selectedSlotId"
                @click="tab = 'confirm'"
              >
                {{ $t('common.next') }}
              </BaseButton>
            </div>
          </v-window-item>

          <!-- Tab 5: Confirmation -->
          <v-window-item value="confirm">
            <h2 class="text-h5 font-weight-bold mb-4">{{ $t('book.reviewAndBook') }}</h2>
            <v-list density="comfortable" class="rounded-lg mb-6 border-thin" color="surface">
              <v-list-item :title="$t('book.location')" :subtitle="selectedLocationName" prepend-icon="mdi-map-marker" />
              <v-list-item :title="$t('book.practitioner')" :subtitle="selectedProfessionalName" prepend-icon="mdi-doctor" />
              <v-list-item :title="$t('book.date')" :subtitle="selectedDate ? formatDate(selectedDate) : 'N/A'" prepend-icon="mdi-calendar" />
              <v-list-item :title="$t('book.time')" :subtitle="selectedSlot?.startTime || 'N/A'" prepend-icon="mdi-clock" />
            </v-list>
            <div class="mt-6 d-flex justify-space-between">
              <BaseButton color="medium-emphasis" variant="text" prepend-icon="mdi-arrow-left" @click="tab = 'time'">
                {{ $t('common.back') }}
              </BaseButton>
              <BaseButton color="success" size="large" @click="confirmBooking" :loading="booking">
                {{ $t('book.confirmAndBook') }}
              </BaseButton>
            </div>
          </v-window-item>
        </v-window>
      </v-card>
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
import { formatDate } from '@/utils/date'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import IndustrialLoader from '@/components/base/IndustrialLoader.vue'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { success, error } = useToast()
const { t } = useI18n()

const tab = ref('location')

const locations = ref<{ id: string; name: string }[]>([])
const selectedLocation = ref<string | null>(null)
const professionals = ref<{ id: string; label: string }[]>([])
const availableSlots = ref<Slot[]>([])
const selectedProfessional = ref<string | null>(null)
const selectedDate = ref<Date | null>(null)
const selectedSlotId = ref<string | null>(null)
const notes = ref('')
const booking = ref(false)
const loadingSlots = ref(false)
const loadingProfessionals = ref(false)
const loadingLocations = ref(false)

// --- Computed Properties ---
const selectedSlot = computed(() => availableSlots.value.find(slot => slot.id === selectedSlotId.value) || null)

const selectedProfessionalName = computed(() => {
  const found = professionals.value.find(p => p.id === selectedProfessional.value)
  return found?.label || 'No seleccionado'
})

const selectedLocationName = computed(() => {
    const found = locations.value.find(l => l.id === selectedLocation.value)
    return found?.name || 'No seleccionado'
})

const minDate = computed(() => new Date())
const maxDate = computed(() => {
  const date = new Date()
  date.setMonth(date.getMonth() + 3)
  return date
})

onMounted(async () => {
  await loadLocations()
})

// --- API Calls ---
async function loadLocations() {
  loadingLocations.value = true
  try {
    const response = await api.get('/locations')
    locations.value = response.data
    
    if (locations.value.length === 1) {
      selectedLocation.value = locations.value[0].id
      await loadProfessionals()
    }
  } catch (err) {
    error(t('book.failedToLoadLocations'))
  } finally {
    loadingLocations.value = false
  }
}

async function loadProfessionals() {
  loadingProfessionals.value = true
  try {
    const response = await api.get('/auth/professionals') 
    professionals.value = response.data.map((u: any) => ({
      id: u.id,
      label: `Dr. ${u.firstName || ''} ${u.lastName || ''} (${u.specialty || 'General'})`
    }))

    if (locations.value.length === 1 && professionals.value.length === 1) {
      selectedLocation.value = locations.value[0].id
      selectedProfessional.value = professionals.value[0].id
      tab.value = 'date'
    } else if (locations.value.length === 1) {
      tab.value = 'professional'
    }
  } catch (err) {
    error(t('book.failedToLoadPractitioners'))
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
    error(t('book.failedToLoadSlots'))
  } finally {
    loadingSlots.value = false
  }
}

// --- User Actions ---
function onLocationSelect() {
  loadProfessionals() 
  selectedProfessional.value = null
  availableSlots.value = []
  selectedSlotId.value = null
  selectedDate.value = null
  
  if (locations.value.length === 1) {
    selectedLocation.value = locations.value[0].id
  }
}

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
  if (!selectedSlotId.value || !selectedProfessional.value || !selectedDate.value || !selectedLocation.value) {
    error(t('book.completeAllSteps'))
    return
  }

  booking.value = true
  try {
    await appointmentsService.create({
      professionalId: selectedProfessional.value,
      slotId: selectedSlotId.value,
      locationId: selectedLocation.value,
      notes: notes.value
    })
    success(t('book.bookingSuccess'))
    router.push('/appointments')
  } catch (err: any) {
    console.error('Booking error:', err)
    error(err.response?.data?.message || t('book.bookingFailed'))
  } finally {
    booking.value = false
  }
}
</script>

<style scoped>
.min-h-80 {
    min-height: 320px;
}

.opacity-80 {
    opacity: 0.8;
}

.chip-time {
    transition: all 0.15s ease;
    border-radius: 4px !important;
}

.chip-time:hover {
    transform: translateY(-2px);
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.1);
}
</style>
