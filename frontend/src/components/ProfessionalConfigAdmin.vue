<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Configuración de Profesionales</span>
      <v-btn color="primary" size="small" @click="loadProfessionals" prepend-icon="mdi-refresh">
        Refresh
      </v-btn>
    </v-card-title>
    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-select
            v-model="selectedProfessional"
            :items="professionals"
            item-title="label"
            item-value="id"
            label="Seleccionar Profesional"
            @update:model-value="loadConfig"
          />
        </v-col>
      </v-row>

      <v-divider class="my-4" />

      <div v-if="loading" class="text-center py-4">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <template v-else-if="selectedProfessional && config">
        <v-row>
          <v-col cols="12" md="6">
            <v-card variant="outlined" class="mb-4">
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
                <p class="text-caption">{{ config.slotDurationMinutes }} minutos por cita</p>
              </v-card-text>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card variant="outlined" class="mb-4">
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
                <p class="text-caption">{{ config.breakBetweenSlotsMinutes }} minutos de descanso</p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>

        <v-card variant="outlined">
          <v-card-title class="d-flex justify-space-between align-center">
            <span>Horario de Trabajo</span>
            <v-btn color="success" size="small" @click="saveConfig" :loading="saving">
              Guardar Configuración
            </v-btn>
          </v-card-title>
          <v-card-text>
            <v-table>
              <thead>
                <tr>
                  <th>Día</th>
                  <th>Activo</th>
                  <th>Inicio</th>
                  <th>Fin</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(day, index) in config.workingHours" :key="index">
                  <td>{{ translateDay(day.dayOfWeek) }}</td>
                  <td>
                    <v-switch v-model="day.isActive" density="compact" hide-details />
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
      </template>

      <v-alert v-else type="info" class="mt-4">
        Seleccione un profesional para configurar su horario
      </v-alert>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { professionalConfigService, type ProfessionalConfig } from '@/services/professional-config'
import api from '@/services/api'

const professionals = ref<{ id: string; label: string }[]>([])
const selectedProfessional = ref<string | null>(null)
const config = ref<ProfessionalConfig | null>(null)
const loading = ref(false)
const saving = ref(false)

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
  await loadProfessionals()
})

async function loadProfessionals() {
  try {
    const response = await api.get('/auth/users?role=PROFESSIONAL')
    professionals.value = response.data.map((u: any) => ({
      id: u.id,
      label: `${u.profile?.firstName || ''} ${u.profile?.lastName || ''} (${u.email})`.trim()
    }))
  } catch (error) {
    console.error('Error loading professionals:', error)
  }
}

async function loadConfig() {
  if (!selectedProfessional.value) return
  
  loading.value = true
  try {
    const data = await professionalConfigService.getConfig(selectedProfessional.value)
    config.value = {
      ...data,
      workingHours: Array.isArray(data.workingHours)
        ? data.workingHours
        : JSON.parse(data.workingHours as string)
    }
  } catch (error) {
    console.error('Error loading config:', error)
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  if (!selectedProfessional.value || !config.value) return
  
  saving.value = true
  try {
    await professionalConfigService.updateConfig(selectedProfessional.value, {
      slotDurationMinutes: config.value.slotDurationMinutes,
      breakBetweenSlotsMinutes: config.value.breakBetweenSlotsMinutes,
      workingHours: config.value.workingHours
    })
    alert('Configuración guardada correctamente')
  } catch (error) {
    console.error('Error saving config:', error)
    alert('Error al guardar la configuración')
  } finally {
    saving.value = false
  }
}
</script>
