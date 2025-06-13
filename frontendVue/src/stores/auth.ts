// src/store/auth.ts
import { defineStore } from 'pinia';
import api from '@/api'; // Importa tu instancia de Axios configurada
import router from '@/router'; // Importa el router para redirecciones

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  // Si tu objeto 'user' de Next.js tenía otras propiedades aparte de userId, email, role,
  // asegúrate de agregarlas aquí en la interfaz y en el método login.
  // Por ejemplo, si tenía un 'name':
  // name?: string;
}

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  // userPermissions: string[] | null; // Ya está dentro de userInfo.permissions
  // isAuthenticated: boolean; // Se gestiona a través de un getter para derivarlo de 'token'
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => {
    let storedToken: string | null = null;
    let storedUserInfo: UserInfo | null = null;

    try {
      // Intentar cargar el token de localStorage
      const tokenFromLs = localStorage.getItem('jwtToken');
      if (tokenFromLs) {
        storedToken = tokenFromLs;
      }

      // Intentar cargar la información del usuario de localStorage
      const userInfoFromLs = localStorage.getItem('userInfo');
      if (userInfoFromLs && userInfoFromLs !== "undefined") {
        storedUserInfo = JSON.parse(userInfoFromLs);
      }
    } catch (e) {
      console.error("Error al parsear datos de localStorage:", e);
      // Si hay un error, limpiar el localStorage para evitar problemas futuros con datos corruptos
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userInfo');
      storedToken = null;
      storedUserInfo = null;
    }

    return {
      token: storedToken,
      userInfo: storedUserInfo,
    };
  },
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.userInfo,
    userRole: (state) => state.userInfo?.role || null,
    userPermissions: (state) => state.userInfo?.permissions || [],
    getUserInfo: (state) => state.userInfo,
  },
  actions: {
    async login(credentials: { email: string; password: string }): Promise<boolean> {
      try {
        // La URL completa para el login ya está configurada en '@/api/index.ts' como baseURL,
        // por lo que solo necesitamos la ruta relativa para este endpoint.
        // Asegúrate de que el backend de Auth está en la URL que especificaste para baseURL en api/index.ts.
        const response = await api.post('/login', credentials);

        const { token, userId, email: userEmail, role, permissions } = response.data;

        // Estructura UserInfo para el store
        const newUserInfo: UserInfo = {
          userId: userId,
          email: userEmail,
          role: role,
          permissions: permissions || [], // Asegurarse de que sea un array
        };

        this.token = token;
        this.userInfo = newUserInfo;

        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

        // Redirigir al dashboard al inicio de sesión exitoso
        await router.push('/');

        return true;
      } catch (error: any) {
        // El interceptor de Axios ya maneja 401/403 y hace logout si es necesario.
        // Aquí solo limpiamos el estado local por si acaso y re-lanzamos el error
        // para que el componente que llama pueda mostrar un mensaje al usuario.
        this.logout();
        console.error('Error during login action:', error.response?.data || error.message);
        throw error; // Propagar el error para que el componente que llama lo maneje
      }
    },
    logout() {
      this.token = null;
      this.userInfo = null;
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userInfo');
      router.push('/login'); // Redirigir al login después de cerrar sesión
    },
    // Método para verificar si el usuario tiene un permiso específico
    hasPermission(permission: string): boolean {
      return this.userInfo?.permissions.includes(permission) || false;
    },
    // Método para verificar si el usuario tiene un rol específico
    hasRole(role: string): boolean {
      return this.userInfo?.role === role;
    }
  },
});
