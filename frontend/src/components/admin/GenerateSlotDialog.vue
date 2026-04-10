<template>
  <v-card>
    <v-card-title class="d-flex justify-space-between align-center">
      <span>Generate Slots</span>
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" aria-label="Close" />
    </v-card-title>
    <v-card-text>
      <v-form ref="formRef" class="d-flex flex-column gap-4">
        <BaseSelect
          v-model="formData.professionalId"
          label="Professional"
          :items="professionalsList"
          item-title="label"
          item-value="id"
          required
          :rules="[(v: string) => !!v || 'Professional is required']"
        />
        <v-text-field
          v-model="formData.startDate"
          label="Start Date"
          type="date"
          required
          :rules="[(v: string) => !!v || 'Start date is required']"
          variant="outlined"
          rounded="md"
        />
        <v-text-field
          v-model="formData.endDate"
          label="End Date"
          type="date"
          required
          :rules="[
            (v: string) => !!v || 'End date is required',
            (v: string) => v >= formData.startDate || 'End date must be after start date'
          ]"
          variant="outlined"
          rounded="md"
        />
      </v-form>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <BaseButton variant="text" @click="$emit('close')">Cancel</BaseButton>
      <BaseButton color="primary" @click="submit" :loading="loading">
        Generate
      </BaseButton>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useToast } from '@/composables/useToast'
import { slotsService } from '@/services/slots'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { success, error } = useToast()

const props = defineProps<{
  professionalsList: { id: string; label: string }[]
  loadingProfessionals: boolean
}>()

const emit = defineEmits<{
  (e: 'generate', data: { professionalId: string; startDate: string; endDate: string }): void
  (e: 'close'): void
}>()

const formRef = ref()
const loading = ref(false)

const formData = reactive({
  professionalId: '',
  startDate: '',
  endDate: ''
})

async function submit() {
  if (!formRef.value?.validate()) return
  
  loading.value = true
  try {
    const payload = {
      professionalId: formData.professionalId,
      startDate: formData.startDate,
      endDate: formData.endDate
    }
    await slotsService.generate(payload)
    success('Slots generated successfully')
    emit('generate', { ...formData })
    emit('close')
  } catch (err: any) {
    console.error('Failed to generate slots:', err)
    error(err.response?.data?.message || err.message || 'Error generating slots')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.gap-4 {
  gap: 16px;
}
</style>
