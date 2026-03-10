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
        dark: false,
        colors: {
          primary: '#673AB7',
          secondary: '#512DA8',
          accent: '#FF4081',
          error: '#F44336',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#F5F7FA',
          surface: '#FFFFFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#9575CD',
          secondary: '#7E57C2',
          accent: '#FF4081',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FB8C00',
          background: '#0F0F0F',
          surface: '#1A1A1A',
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
      rounded: 'md',
      elevation: 2,
      class: 'text-none font-weight-bold',
    },
    VCard: {
      variant: 'flat',
      rounded: 'lg',
      elevation: 0,
      class: 'border-thin',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'md',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      rounded: 'md',
      hideDetails: 'auto',
    },
    VListItem: {
      rounded: 'md',
    },
    VChip: {
      rounded: 'md',
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
