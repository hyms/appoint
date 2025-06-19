import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

// --- CAMBIO AQUÍ: Incluir '/Users' en la URL base ---
const API_BASE_URL: string = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';

const api: AxiosInstance = axios.create({
  withCredentials: true,
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
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
