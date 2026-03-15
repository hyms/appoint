import {createVuetify} from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import {aliases, mdi} from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          primary: '#6200EE', // Material Purple
          secondary: '#03DAC6', // Material Teal
          accent: '#03DAC6', // Material Teal (using secondary for accent as well for consistency)
          error: '#B00020', // Material Red
          info: '#2196F3', // Material Blue
          success: '#4CAF50', // Material Green
          warning: '#FB8C00', // Material Orange
          background: '#F5F5F5', // Light Gray
          surface: '#FFFFFF', // White
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#BB86FC', // Material Light Purple
          secondary: '#03DAC6', // Material Teal
          accent: '#03DAC6', // Material Teal
          error: '#CF6679', // Material Red
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#121212', // Dark background
          surface: '#1E1E1E', // Dark surface
        },
      },
    },
  },
  defaults: {
    global: {
      ripple: true,
    },
    VBtn: {
      variant: 'elevated',
      rounded: 'lg',
      elevation: 1,
      class: 'text-none',
    },
    VCard: {
      variant: 'elevated',
      rounded: 'md',
      elevation: 2,
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VListItem: {
      rounded: 'lg',
    },
    VChip: {
      rounded: 'pill',
    },
  },
  display: {
    mobileBreakpoint: 'sm',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
})
