import axios from 'axios';

const API_BASE_URL = 'https://localhost:7196/api/Auth';

const AuthService = {
  /**
   * Realiza la petición de login al backend.
   * Almacena el token JWT y la información del usuario en localStorage si es exitoso.
   * @param {string} email
   * @param {string} password
   * @returns {Promise<object|null>} Información del usuario si el login es exitoso, de lo contrario null.
   */
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      const { token, userId, email: userEmail, role, permissions } = response.data;

      // Guardar el token y la información del usuario en localStorage
      localStorage.setItem('jwtToken', token);
      localStorage.setItem('userId', userId);
      localStorage.setItem('userEmail', userEmail);
      localStorage.setItem('userRole', role);
      localStorage.setItem('userPermissions', JSON.stringify(permissions));

      return { userId, email: userEmail, role, permissions };
    } catch (error) {
      console.error('Error en el servicio de login:', error.response ? error.response.data : error.message);
      throw error.response ? new Error(error.response.data.message || 'Error en el login.') : error;
    }
  },

  /**
   * Cierra la sesión del usuario eliminando el token y la información del usuario de localStorage.
   */
  logout: () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userPermissions');
  },

  /**
   * Obtiene el token JWT del localStorage.
   * @returns {string|null} El token JWT o null si no existe.
   */
  getToken: () => {
    return localStorage.getItem('jwtToken');
  },

  /**
   * Llama a un endpoint protegido en el backend.
   * @param {string} endpoint - La ruta del endpoint protegido (ej. 'admin-data').
   * @returns {Promise<object>} La respuesta del backend.
   */
  callProtectedEndpoint: async (endpoint) => {
    const token = AuthService.getToken();
    if (!token) {
      throw new Error('No hay token JWT. Por favor, inicie sesión.');
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error al llamar al endpoint /${endpoint}:`, error.response ? error.response.data : error.message);
      throw error; // Propagar el error para que el componente lo maneje
    }
  },
};

export default AuthService;
