// src/api/index.ts
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/store/auth'; // Importa tu store de autenticación

// Configura la URL base para tu API.
// NOTA: Para producción, es recomendable usar variables de entorno de Vite:
// const API_BASE_URL: string = import.meta.env.VITE_BACKEND_API_URL || 'https://localhost:7196/api/Auth';
// Para este ejemplo, usaremos la URL que pasaste de Next.js para el backend de Auth.
// Asegúrate de que esta URL base coincida con la URL de tu API de .NET 8
// si usas la de Next.js (http://localhost:5000), tu backend de .NET 8 DEBE escuchar en ese puerto.
// Si tu backend .NET 8 está en https://localhost:7196, usa esa URL.
const API_BASE_URL: string = 'http://localhost:5000/api/Auth'; // Ajusta según tu configuración de backend .NET 8

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de solicitudes: Añade el token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();
    const token = authStore.token; // Accede al token desde el store de Pinia
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    // Manejo de errores antes de enviar la solicitud (ej. problemas de configuración)
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de respuestas: Maneja errores de autenticación/autorización y respuestas exitosas
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // Esto es equivalente a tu 'handleResponse' de Next.js. Axios ya devuelve 'response.data'.
    return response; // La respuesta contiene la data en `response.data`
  },
  (error: AxiosError) => {
    // Esto es equivalente a tu 'handleError' de Next.js, pero centralizado.
    const authStore = useAuthStore();
    console.error('API Response Error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      console.warn('Unauthorized request. Token might be invalid or expired. Logging out...');
      authStore.logout(); // Limpiar el estado de autenticación de Pinia
      // Aquí podrías agregar una redirección global al login si tu router está disponible
      // import router from '@/router';
      // router.push('/login');
    } else if (error.response?.status === 403) {
      console.warn('Forbidden request. User does not have sufficient permissions.');
    }
    // Re-lanzar el error para que el componente que hizo la llamada pueda manejarlo también.
    return Promise.reject(error);
  }
);

export default api;
