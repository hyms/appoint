'use client'
// _app.js
import React, {useState, useEffect, createContext, useContext} from 'react';
import {useRouter} from 'next/navigation';
import 'antd/dist/reset.css'; // Importa los estilos de Ant Design

// Crear un contexto para la autenticación
const AuthContext = createContext(null);

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

    const login = (token) => {
        localStorage.setItem('authToken', token);
        setAuthToken(token);
        setIsAuthenticated(true);
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