import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles' // Importa los estilos de Vuetify
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App)

const vuetify = createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi'
  },
  theme: {
    defaultTheme: 'light', // Puedes definir un tema 'dark' también si lo deseas
    themes: {
      light: {
        colors: {
          background: '#FFFFFF',
          surface: '#F8F8F8', // Blanco para las tarjetas (v-card, v-sheet)
          primary: '#2e836d',
          'primary-darken-1': '#275e59', // Un tono más oscuro de verde agua para hover/active
          secondary: '#424242', // Color secundario (puedes ajustarlo)
          error: '#FF5252',     // Rojo estándar para errores
          info: '#2196F3',      // Azul estándar para información
          success: '#4CAF50',   // Verde estándar para éxito
          warning: '#FB8C00'   // Naranja estándar para advertencias
        }
      }
      // dark: {
      //   colors: {
      //     background: '#121212',
      //     surface: '#212121',
      //     primary: '#80CBC4',
      //     'primary-darken-1': '#4DB6AC',
      //     // ... otros colores oscuros
      //   },
      // },
    }
  }
})

app.use(createPinia())
app.use(router)
app.use(vuetify)
app.mount('#app')
