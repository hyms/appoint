'use client'
// _app.js
import React, {useState, useEffect, createContext, useContext} from 'react';
import {useRouter} from 'next/navigation';
import 'antd/dist/reset.css'; // Importa los estilos de Ant Design

// Crear un contexto para la autenticación
const AuthContext = createContext({
    authToken: null,
    isAuthenticated: false,
    userRole: null,
    userPermissions: [], // Array de permisos
    login: () => {},
    logout: () => {},
    setPermissions: () => {}, // Función para actualizar los permisos
});
export function AuthProvider({children}) {
    const [authToken, setAuthToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken) {
            // Aquí podrías validar el token en el frontend (si es seguro y necesario)
            // o simplemente asumirlo como válido hasta que el backend diga lo contrario
            setAuthToken(storedToken);
            setIsAuthenticated(true);
        } else {
            setAuthToken(null);
            setIsAuthenticated(false);
            // Redirigir al login si no hay token y la ruta no es pública
            const publicRoutes = ['/login', '/register']; // Define tus rutas públicas
            if (!publicRoutes.includes(router.pathname)) {
                router.push('/login');
            }
        }
    }, [router]);

    const login = async (credentials) => {
        // ... tu lógica de login
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('authToken', data.token);
            setAuthToken(data.token);
            setIsAuthenticated(true);
            setUserRole(data.role);
            // Si el backend devuelve permisos en el login:
            setPermissions(data.permissions);
            // O podrías hacer una llamada adicional para obtener los permisos basados en el rol
            const permissionsResponse = await fetch(`/api/permissions/${data.role}`);
            const permissionsData = await permissionsResponse.json();
            setPermissions(permissionsData.permissions);
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setIsAuthenticated(false);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ authToken, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
};

function MyApp({ Component, pageProps }) {
    return (
        <AuthProvider>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;