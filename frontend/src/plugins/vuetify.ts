import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
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
        colors: {
          primary: '#6C4EE7',
          'on-primary': '#FFFFFF',
          secondary: '#FF8AC8',
          'on-secondary': '#000000',
          accent: '#AB96FF',
          error: '#D32F2F',
          'on-error': '#FFFFFF',
          info: '#1E88E5',
          success: '#43A047',
          warning: '#FB8C00',
          background: '#FFFFFF',
          surface: '#F5F5F5',
          'on-surface': '#212121',
          'on-background': '#212121',
        },
      },
      dark: {
        colors: {
          primary: '#AB96FF',
          'on-primary': '#000000',
          secondary: '#FF8AC8',
          'on-secondary': '#000000',
          accent: '#6C4EE7',
          error: '#EF5350',
          'on-error': '#FFFFFF',
          info: '#42A5F5',
          success: '#66BB6A',
          warning: '#FFCA28',
          background: '#121212',
          surface: '#1E1E1E',
          'on-surface': '#FFFFFF',
          'on-background': '#FFFFFF',
        },
      },
    },
  },
  defaults: {
    global: {
      ripple: true,
      font: {
        family: 'Inter',
      },
    },
    VTab: {
      color: 'primary',
    },
    VTabs: {
      color: 'primary',
      sliderColor: 'primary',
    },
    VTextField: {
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VSelect: {
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VCard: {
      variant: 'elevated',
    },
    VBtn: {
      variant: 'elevated',
      class: 'text-none',
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
