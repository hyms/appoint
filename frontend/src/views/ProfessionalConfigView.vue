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

      <!-- Telegram Linkage Section -->
      <v-row class="section-gap">
        <v-col cols="12">
          <v-card>
            <v-card-title class="d-flex justify-space-between align-center">
              <span>Integración de Telegram</span>
              <v-btn
                color="info"
                size="small"
                @click="saveTelegramConfig"
                :loading="savingTelegram"
              >
                Guardar Chat ID
              </v-btn>
            </v-card-title>
            <v-card-text>
              <p class="text-body-2 mb-4">
                Para recibir notificaciones y enlaces mágicos por Telegram,
                proporcione el ID de chat que le fue asignado por nuestro bot.
              </p>
              <v-text-field
                v-model="currentTelegramId"
                label="Telegram Chat ID"
                placeholder="Ej: 1234567890"
                prepend-inner-icon="mdi-send-circle"
                density="comfortable"
                hide-details
                :disabled="savingTelegram"
              />
              <p v-if="currentTelegramId" class="text-caption mt-2 text-success">
                 ID cargado. ¡Las notificaciones de prueba se enviarán aquí!
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { professionalConfigService, type ProfessionalConfig } from '@/services/professional-config'
import { useToast } from '@/composables/useToast'
import api from '@/services/api' // Import API service

const { success, error } = useToast()

const loading = ref(true)
const saving = ref(false)
const savingTelegram = ref(false)

// Configuration state (for slot/break times)
const config = ref<ProfessionalConfig>({
  id: '',
  professionalId: '',
  slotDurationMinutes: 30,
  breakBetweenSlotsMinutes: 5,
  workingHours: [],
})

// Telegram state
const currentTelegramId = ref('') 
// ... existing onMounted and saveConfig for slot/break times ...

onMounted(async () => {
  try {
    // Load configuration
    const data = await professionalConfigService.getMyConfig()
    config.value = {
      ...data,
      workingHours: Array.isArray(data.workingHours) 
        ? data.workingHours 
        : JSON.parse(data.workingHours as string)
    }
    // Load existing Telegram ID (assuming it's fetched from /auth/me or similar)
    // Since there is no dedicated service/endpoint for User settings here, 
    // we mock fetching user data or assume a separate call is needed.
    // For now, we'll use a placeholder/dummy service call if one existed, 
    // but since we don't have a UserSettingsService, we'll rely on the user knowing their ID
    // or we'll simulate fetching it from /auth/me if possible.
    
    // --- MOCK for Telegram ID Fetching for this step ---
    // In a real app, we'd call: await authStore.fetchUserData()
    // For now, we rely on the user inputting it or assume it's managed elsewhere.
    // We'll initialize it to empty and rely on manual input/backend save.
    
  } catch (err) {
    console.error('Error loading config:', err)
    error('Error al cargar la configuración')
  } finally {
    loading.value = false
  }
})

async function saveConfig() {
  // ... existing save logic for slot/break times ...
}

async function saveTelegramConfig() {
    savingTelegram.value = true
    try {
        if (!currentTelegramId.value) {
            throw new Error("Telegram Chat ID cannot be empty.");
        }
        // Call backend endpoint PATCH /auth/telegram-chat-id
        await api.patch('/auth/telegram-chat-id', { telegramChatId: currentTelegramId.value })
        success('Telegram Chat ID guardado. Las notificaciones se enviarán vía Telegram.')
    } catch (err: any) {
        console.error('Error saving Telegram config:', err)
        error('Error al guardar Telegram ID: ' + (err.response?.data?.message || err.message || 'Unknown error'))
    } finally {
        savingTelegram.value = false
    }
}

const dayTranslations: Record<string, string> = {
// ... existing translations ...
}

function translateDay(day: string): string {
  return dayTranslations[day] || day
}
</script>
