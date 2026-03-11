<template>
  <AppointmentList
    :appointments="appointments"
    :loading="loading"
    view-all-route="/appointments"
    :has-action="true"
    empty-message="You don't have any scheduled appointments. Book one now!"
    action-label="Book Appointment"
    action-to="/book"
    :is-first-component="true"
  />
</template>

<script setup lang="ts">
import { type Appointment } from '@/services/appointments'
import AppointmentList from './AppointmentList.vue'

defineProps<{
  appointments: Appointment[]
  loading: boolean
}>()
</script>