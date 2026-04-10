<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="4" class="mb-4 mb-md-0">
      <BaseCard
        to="/book"
        icon="mdi-calendar-plus"
        icon-color="success"
        :title="$t('appointments.book')"
        :subtitle="$t('dashboard.scheduleNewAppointment')"
        class="h-100 action-card"
      />
    </v-col>
    <v-col cols="12" sm="6" md="4" class="mb-4 mb-md-0">
      <BaseCard
        to="/appointments"
        icon="mdi-calendar-check"
        icon-color="primary"
        :title="$t('appointments.title')"
        :subtitle="$t('dashboard.viewManageAppointments')"
        class="h-100 action-card"
      />
    </v-col>
    <v-col v-if="isAdminOrSecretary" cols="12" sm="6" md="4" class="mb-4 mb-md-0">
      <BaseCard
        to="/admin"
        icon="mdi-shield-account"
        icon-color="warning"
        :title="$t('dashboard.admin') || 'Admin'"
        :subtitle="$t('dashboard.adminTools')"
        class="h-100 action-card"
      />
    </v-col>
    <v-col v-if="isProfessional" cols="12" sm="6" md="4" class="mb-4 mb-md-0">
      <BaseCard
        to="/professional-config"
        icon="mdi-account-cog"
        icon-color="info"
        :title="$t('nav.administrativeTools')"
        :subtitle="$t('dashboard.configSchedulePrefs')"
        class="h-100 action-card"
      />
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import BaseCard from '@/components/base/BaseCard.vue'

defineProps<{
  isAdminOrSecretary: boolean
  isProfessional: boolean
}>()
</script>

<style scoped>
.action-card {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  /* Industrial style: sharp border-left */
  border-left: 4px solid currentColor !important; 
  border-radius: 4px !important; /* Sharper corners */
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important; /* Stronger, defined shadow */
}
</style>
