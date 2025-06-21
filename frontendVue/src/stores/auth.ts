// src/store/auth.ts
import { defineStore } from 'pinia';
import api from '@/api'; // Importa tu instancia de Axios configurada
import router from '@/router';
import type { Role, UserInfo, Permissions } from '@/Types'; // Asegúrate de importar Permissions también

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
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
    userRole:  (state) => state.userInfo?.role,
    userPermissions: (state) => state.userInfo?.permissions,
    getUserInfo: (state) => state.userInfo,
  },
  actions: {
    async login(credentials: { email: string; password: string }): Promise<boolean> {
      try {
        const response = await api.post('/users/auth', credentials);

        const { data } = response.data;
        const { token, userId, email: userEmail, role, permissions } = data;

        // Estructura UserInfo para el store
        const newUserInfo: UserInfo = {
          userId: userId,
          email: userEmail,
          role: role,
          permissions: permissions || [], // Asegurarse de que sea un array, se asume que 'permissions' del backend ya es string[] o lo mapeas.
                                          // Si el backend envía `Permissions[]` como string, no necesita `.map(p => p as Permissions)`
        };

        this.token = token;
        this.userInfo = newUserInfo;

        localStorage.setItem('jwtToken', token);
        localStorage.setItem('userInfo', JSON.stringify(newUserInfo));

        await router.push('/'); // Redirigir al dashboard al inicio de sesión exitoso

        return true;
      } catch (error: any) {
        this.logout(); // Limpiar el estado local y localStorage
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
    hasRole(role: string): boolean {
      return this.userInfo?.role === role;
    }
  },
});
