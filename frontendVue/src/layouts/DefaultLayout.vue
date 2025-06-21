<template>
  <!-- Overlay para el estado de carga -->
  <v-overlay :model-value="loading" class="align-center justify-center" persistent>
    <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
  </v-overlay>

  <v-layout full-height>
    <!-- Diálogo para Doctor (si el usuario es doctor) -->
    <!-- Asegúrate de que la ruta a DialogDoctor es correcta -->
<!--    <DialogDoctor v-if="authStore.hasRole('Doctor')" v-model="dialogDoctor"></DialogDoctor>-->

    <!-- Navigation Drawer (Sidebar) -->
    <v-navigation-drawer
      v-model="isDrawerOpen"
      class="app-navigation-menu"
      :elevation="2"
      color="background"
    >
      <!-- Navigation Header -->
      <template v-slot:prepend>
        <v-list-item lines="two"
                     class="vertical-nav-header d-flex text-center justify-content-center">
          <h2 class="d-flex align-center app-title text-primary">APPOINT CLINIC</h2>
        </v-list-item>
      </template>

      <v-divider></v-divider>

      <!-- Menú de Navegación -->
      <v-list density="comfortable" :opened="open" base-color="primary" color="primary" nav>
        <template v-for="(link, key) in menuItems" :key="key">
          <template v-if="link.subItems && link.subItems.length > 0">
            <v-list-group :value="link.label">
              <template v-slot:activator="{ props: groupProps }">
                <v-list-item v-bind="groupProps" :prepend-icon="link.icon || 'mdi-folder-outline'">
                  <v-list-item-title class="text-capitalize">{{ link.label }}</v-list-item-title>
                </v-list-item>
              </template>
              <v-list-item
                v-for="(subLink, subKey) in link.subItems"
                :key="`${key}-${subKey}`"
                :to="subLink.url"
                :active="currentRoutePath === subLink.url"
                :value="subLink.label"
                link
              >
                <v-list-item-title class="text-capitalize">{{ subLink.label }}</v-list-item-title>
              </v-list-item>
            </v-list-group>
          </template>
          <template v-else>
            <v-list-item
              :to="link.url"
              :active="link.url === currentRoutePath || (link.activate && link.activate.includes(currentRoutePath))"
              :value="link.label"
              :prepend-icon="link.icon || 'mdi-circle-small'"
              link
              @click="link.onClick ? link.onClick() : null"
            >
              <v-list-item-title class="text-capitalize">{{ link.label }}</v-list-item-title>
            </v-list-item>
          </template>
        </template>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar (Top Navbar) -->
    <v-app-bar :elevation="2" color="white">
      <v-app-bar-nav-icon @click.stop="isDrawerOpen = !isDrawerOpen"></v-app-bar-nav-icon>
      <v-toolbar-title>{{ titlePage || labels.menu.dashboard }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <Notifications></Notifications>
      <MenuUser></MenuUser>
    </v-app-bar>

    <!-- Main Content Area -->
    <v-main>
      <v-container fluid class="py-6 px-6">
        <v-sheet class="d-flex flex-row align-center bg-transparent mb-4">
          <h1 v-if="titlePage !== ''" class="font-weight-medium text-h5">{{ titlePage }}</h1>
          <v-spacer></v-spacer>
          <v-btn v-if="back" variant="outlined" color="primary" @click="router.back()">
            {{ labels.common.back }}
          </v-btn>
        </v-sheet>
        <v-row>
          <v-col>
            <!-- Slot para el contenido de la página actual -->
            <slot></slot>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <!-- Footer -->
    <v-footer app border class="bg-white">
      <v-container fluid class="py-1">
        <span>
          &copy; {{ new Date().getFullYear() }}
          <v-chip size="small" variant="text" color="primary" class="text-uppercase">copito</v-chip>
        </span>
      </v-container>
    </v-footer>
  </v-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import MenuUser from '@/components/MenuUser.vue'
import Notifications from '@/components/Notifications.vue'
// import DialogDoctor from '@/views/doctor_sessions/form.vue';
import type { MenuItem } from '@/Types'
import { Role } from '@/Types'

// Definición de la interfaz para los elementos del menú

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const props = defineProps({
  loading: { type: Boolean, default: false },
  titlePage: { type: String, default: '' },
  back: { type: Boolean, default: false }
})

const isDrawerOpen = ref(true)
const open = ref<string[]>([])
const dialogDoctor = ref(false)

const currentRoutePath = computed(() => route.path)

const labels = {
  menu: {
    dashboard: 'Dashboard',
    staffs: 'Personal',
    appointments: 'Citas',
    doctors: 'Doctores',
    doctor_sessions: 'Sesiones Doctor',
    patients: 'Pacientes',
    services: 'Servicios',
    service_categories: 'Categorías Servicio',
    settings: 'Configuración',
    clinic_schedules: 'Horarios Clínica'
  },
  setting: {
    general_details: 'Detalles Generales',
    general: 'General',
    contact_information: 'Información de Contacto'
  },
  doctor_session: {
    my_schedule: 'Mi Horario'
  },
  holiday: {
    holiday: 'Días Feriados',
    doctor_holiday: 'Días Feriados Doctor'
  },
  common: {
    back: 'Volver'
  },
  btn: {
    save_changes: 'Guardar Cambios'
  }
}

const menuItems = ref<MenuItem[]>([])

function loadMenu() {
// Admin Dashboard
  if (authStore.hasRole(Role.admin.toString())) {
    menuItems.value.push({
      label: labels.menu.dashboard,
      url: '/',
      activate: ['/', '/admin/dashboard'],
      icon: 'mdi-view-dashboard', // MDI Icon
      subItems: []
    })
  }

// Staffs
  if (authStore.hasPermission('manage_staff')) {
    menuItems.value.push({
      label: labels.menu.staffs,
      url: '/admin/staffs',
      activate: ['/admin/staffs'],
      icon: 'mdi-account-group', // MDI Icon
      subItems: []
    })
  }


// Doctor-specific menu
  if (authStore.hasRole('Doctor')) {
    menuItems.value.push({
      label: labels.menu.dashboard,
      url: '/doctors/dashboard',
      activate: ['/doctors/dashboard'],
      icon: 'mdi-view-dashboard', // MDI Icon
      subItems: []
    })
    if (authStore.hasPermission('manage_appointments')) {
      menuItems.value.push({
        label: labels.menu.appointments,
        url: '/doctors/appointments',
        activate: ['/doctors/appointments'],
        icon: 'mdi-calendar-check', // MDI Icon
        subItems: []
      })
    }
    menuItems.value.push({
      label: labels.doctor_session.my_schedule,
      url: '',
      activate: ['/doctors/doctor-schedule-edit'],
      icon: 'mdi-calendar', // MDI Icon
      subItems: [],
      onClick: () => {
        dialogDoctor.value = true
      }
    })
    menuItems.value.push({
      label: labels.holiday.holiday,
      url: '/doctors/holidays',
      activate: ['/doctors/holidays'],
      icon: 'mdi-beach', // MDI Icon
      subItems: []
    })
  }

// Patient-specific menu

  if (authStore.hasRole('Patient')) {
    menuItems.value.push({
      label: labels.menu.dashboard,
      url: '/patients/dashboard',
      activate: ['/patients/dashboard'],
      icon: 'mdi-view-dashboard', // MDI Icon
      subItems: []
    })
    menuItems.value.push({
      label: labels.menu.appointments,
      url: '/patients/appointments',
      activate: ['/patients/appointments', '/patients/patient-appointments-calendar', '/patients/doctors'],
      icon: 'mdi-calendar', // MDI Icon
      subItems: []
    })
  }

// Doctors (Admin side)
  if (authStore.hasPermission('manage_doctors')) {
    menuItems.value.push({
      label: labels.menu.doctors,
      url: '',
      activate: ['/admin/doctors', '/doctors/doctor-sessions', '/admin/doctor-sessions'],
      icon: 'mdi-doctor', // MDI Icon
      subItems: [
        { label: labels.menu.doctors, url: '/admin/doctors' },
        { label: labels.menu.doctor_sessions, url: '/admin/doctor-sessions' }
      ]
    })
  }

// Patients (Admin side)

  if (authStore.hasPermission('manage_patients')) {
    menuItems.value.push({
      label: labels.menu.patients,
      url: '/admin/patients',
      activate: ['/admin/patients'],
      icon: 'mdi-account-heart', // MDI Icon
      subItems: []
    })
  }

// Appointments (Admin side - if not Doctor/Patient)
  if (!authStore.hasRole('Doctor') && !authStore.hasRole('Patient') && authStore.hasPermission('manage_appointments')) {
    menuItems.value.push({
      label: labels.menu.appointments,
      url: '/admin/appointments',
      activate: ['/admin/appointments', '/admin/admin-appointments-calendar', '/admin/prescriptions', '/admin/prescription-medicine-show'],
      icon: 'mdi-calendar-check', // MDI Icon
      subItems: []
    })
  }

// Services (Admin side)
  if (authStore.hasPermission('manage_services')) {
    menuItems.value.push({
      label: labels.menu.services,
      url: '',
      activate: ['/admin/services', '/admin/service-categories'],
      icon: 'mdi-medical-bag', // MDI Icon
      subItems: [
        { label: labels.menu.services, url: '/admin/services' },
        { label: labels.menu.service_categories, url: '/admin/service-categories' }
      ]
    })
  }

// Settings (Admin side)
  if (authStore.hasPermission('manage_settings')) {
    menuItems.value.push({
      label: labels.menu.settings,
      url: '/settings/general',
      activate: ['/admin/settings', '/admin/clinic-schedules', '/admin/holidays', '/settings/general'],
      icon: 'mdi-cog', // MDI Icon
      subItems: [
        { label: labels.setting.general, url: '/settings/general' },
        { label: labels.setting.contact_information, url: '/admin/settings-contact' },
        { label: labels.menu.clinic_schedules, url: '/admin/clinic-schedules' },
        { label: labels.holiday.doctor_holiday, url: '/admin/holidays' }
      ]
    })
  }
}

watch(currentRoutePath, (newPath) => {
  menuItems.value.forEach((item: MenuItem) => {
    if (item.subItems && item.subItems.length > 0) {
      if (item.subItems.some(subItem => subItem.url === newPath)) {
        open.value = [item.label]
      }
    }
  })
}, { immediate: true })

onMounted(() => {
  loadMenu()
})
</script>

<style lang="scss" scoped>
.app-title {
  font-size: 1.25rem;
  font-weight: 700;
  font-stretch: expanded;
  font-style: normal;
  line-height: normal;
  letter-spacing: 0.3px;
}

.vertical-nav-header {
  height: 64px;
}

.fs-1 {
  font-size: calc(1.2625rem + .15vw) !important
}

.fs-2 {
  font-size: 1.25rem !important
}

.fs-3 {
  font-size: 1.125rem !important
}

.fs-4 {
  font-size: 1rem !important
}

.fs-5 {
  font-size: .938rem !important
}

.fs-6 {
  font-size: .875rem !important
}
</style>
