<template>
  <v-container fluid class="pa-4">
    <v-row>
      <v-col cols="12">
        <h1 class="text-h5 font-weight-bold mb-4">
          Configuración de Horario
        </h1>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Configure sus horarios de trabajo y preferencias de citas
        </p>
      </v-col>
    </v-row>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center py-8">
        <v-progress-circular indeterminate color="primary" />
        <p class="mt-2">Cargando configuración...</p>
      </v-col>
    </v-row>

    <template v-else>
      <!-- Slot Duration Settings -->
      <v-row>
        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Duración de Citas</v-card-title>
            <v-card-text>
              <v-slider
                v-model="config.slotDurationMinutes"
                :min="15"
                :max="120"
                :step="5"
                thumb-label
                label="Duración (minutos)"
              />
              <p class="text-caption mt-2">
                Cada cita tendrá {{ config.slotDurationMinutes }} minutos de duración
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="mb-4">
            <v-card-title>Descanso entre Citas</v-card-title>
            <v-card-text>
              <v-slider
                v-model="config.breakBetweenSlotsMinutes"
                :min="0"
                :max="30"
                :step="5"
                thumb-label
                label="Descanso (minutos)"
              />
              <p class="text-caption mt-2">
                {{ config.breakBetweenSlotsMinutes }} minutos de descanso entre citas
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Working Hours -->
      <v-row>
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Horario de Trabajo</span>
              <v-btn
                color="primary"
                size="small"
                @click="saveConfig"
                :loading="saving"
              >
                Guardar Cambios
              </v-btn>
            </v-card-title>
            <v-card-text>
              <v-table>
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Activo</th>
                    <th>Hora Inicio</th>
                    <th>Hora Fin</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(day, index) in config.workingHours" :key="index">
                    <td>{{ translateDay(day.dayOfWeek) }}</td>
                    <td>
                      <v-switch
                        v-model="day.isActive"
                        density="compact"
                        hide-details
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="day.startTime"
                        type="time"
                        density="compact"
                        hide-details
                        :disabled="!day.isActive"
                      />
                    </td>
                    <td>
                      <v-text-field
                        v-model="day.endTime"
                        type="time"
                        density="compact"
                        hide-details
                        :disabled="!day.isActive"
                      />
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { professionalConfigService, type ProfessionalConfig } from '@/services/professional-config'
import { useToast } from '@/composables/useToast'

const { success, error } = useToast()

const loading = ref(true)
const saving = ref(false)

const config = ref<ProfessionalConfig>({
  id: '',
  professionalId: '',
  slotDurationMinutes: 30,
  breakBetweenSlotsMinutes: 5,
  workingHours: [
    { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 'WEDNESDAY', startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 'THURSDAY', startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 'FRIDAY', startTime: '09:00', endTime: '17:00', isActive: true },
    { dayOfWeek: 'SATURDAY', startTime: '09:00', endTime: '13:00', isActive: false },
    { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '13:00', isActive: false },
  ]
})

const dayTranslations: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo'
}

function translateDay(day: string): string {
  return dayTranslations[day] || day
}

onMounted(async () => {
  try {
    const data = await professionalConfigService.getMyConfig()
    config.value = {
      ...data,
      workingHours: Array.isArray(data.workingHours) 
        ? data.workingHours 
        : JSON.parse(data.workingHours as string)
    }
  } catch (err) {
    console.error('Error loading config:', err)
    error('Error al cargar la configuración')
  } finally {
    loading.value = false
  }
})

async function saveConfig() {
  saving.value = true
  try {
    await professionalConfigService.updateMyConfig({
      slotDurationMinutes: config.value.slotDurationMinutes,
      breakBetweenSlotsMinutes: config.value.breakBetweenSlotsMinutes,
      workingHours: config.value.workingHours
    })
    success('Configuración guardada correctamente')
  } catch (err) {
    console.error('Error saving config:', err)
    error('Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}
</script>
