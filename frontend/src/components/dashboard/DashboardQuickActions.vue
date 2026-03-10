<template>
  <v-row class="mb-6">
    <v-col cols="12" sm="6" md="4">
      <BaseCard
        to="/book"
        icon="mdi-calendar-plus"
        icon-color="success"
        :title="$t('appointments.book')"
        subtitle="Schedule a new appointment"
        class="h-100 action-card"
      />
    </v-col>
    <v-col cols="12" sm="6" md="4" class="mt-4 mt-sm-0">
      <BaseCard
        to="/appointments"
        icon="mdi-calendar-check"
        icon-color="primary"
        :title="$t('appointments.title')"
        subtitle="View and manage your appointments"
        class="h-100 action-card"
      />
    </v-col>
    <v-col v-if="isAdminOrSecretary" cols="12" sm="6" md="4" class="mt-4 mt-md-0">
      <BaseCard
        to="/admin"
        icon="mdi-shield-account"
        icon-color="warning"
        :title="$t('dashboard.admin') || 'Admin'"
        subtitle="Administrative tools"
        class="h-100 action-card"
      />
    </v-col>
    <v-col v-if="isProfessional" cols="12" sm="6" md="4" class="mt-4 mt-md-0">
      <BaseCard
        to="/professional-config"
        icon="mdi-account-cog"
        icon-color="info"
        title="Herramientas Administrativas"
        subtitle="Configurar horario y preferencias"
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
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-left: 4px solid currentColor !important;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}
</style>
