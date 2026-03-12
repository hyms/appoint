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
          primary: '#673AB7', // Material Deep Purple
          secondary: '#9C27B0', // Material Purple
          accent: '#FF4081', // Material Pink
          error: '#F44336', // Material Red
          info: '#2196F3', // Material Blue
          success: '#4CAF50', // Material Green
          warning: '#FFC107', // Material Amber
          background: '#F5F5F5',
          surface: '#FFFFFF',
        },
      },
      dark: {
        dark: true,
        colors: {
          primary: '#D1C4E9',
          secondary: '#E1BEE7',
          accent: '#FF80AB',
          error: '#CF6679',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
          background: '#121212',
          surface: '#1E1E1E',
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
      rounded: 'xl',
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
