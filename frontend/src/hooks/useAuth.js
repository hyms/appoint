import React, {useState, useEffect, createContext, useContext} from 'react';
import {useRouter} from 'next/navigation';
import {useApi} from './useApi';

const AuthContext = createContext({
    authToken: null,
    isAuthenticated: false,
    user: null,
    login: async () => {},
    logout: () => {},
});

export function AuthProvider({children}) {
    const [authToken, setAuthToken] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userPermissions, setUserPermissions] = useState(null);
    const [user, setUser] = useState(null);
    const router = useRouter();
    const api = useApi(); // Utiliza el hook useApi

    useEffect(() => {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('user');
        const storedPermissions = localStorage.getItem('userPermissions');

        if (storedToken) {
            setAuthToken(storedToken);
            setIsAuthenticated(true);
            if (storedUser && storedUser !== "undefined") {
                try {
                    setUser(JSON.parse(storedUser));
                } catch (error) {
                    console.error("Error parsing stored user:", error);
                    localStorage.removeItem('user'); // Limpiar si hay un JSON inválido
                }
            }
            if (storedPermissions && storedPermissions !== "undefined") {
                try {
                    setUserPermissions(JSON.parse(storedPermissions));
                } catch (error) {
                    console.error("Error parsing stored permissions:", error);
                    localStorage.removeItem('userPermissions'); // Limpiar si hay un JSON inválido
                }
            }
        } else {
            setAuthToken(null);
            setIsAuthenticated(false);
            setUserPermissions(null);
            setUser(null);
            const publicRoutes = ['/login', '/register']; // Define tus rutas públicas
            if (!publicRoutes.includes(router.pathname)) {
                router.push('/login');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router.pathname]); // Depende de router.pathname para re-verificar en cambios de ruta

    const login = async (credentials) => {
        const responseData = await api.post('/auth/login', credentials);

        if (responseData && responseData.errorCode === null) {
            localStorage.setItem('authToken', responseData.data.token);
            localStorage.setItem('user', JSON.stringify(responseData.data.user)); // Store basic user info
            localStorage.setItem('userPermissions', JSON.stringify(responseData.data.permissions));
            setAuthToken(responseData.data.token);
            setIsAuthenticated(true);
            setUser(responseData.data.user); // Store basic user info
            router.push('/'); // Redirigir al dashboard al inicio de sesión exitoso
            return true; // Indica éxito del login
        } else {
            // Manejar errores de login (ej., mostrar mensaje al usuario desde responseData.message)
            console.error('Error de login:', responseData ? responseData.message : 'Error desconocido');
            return false; // Indica fallo del login
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('userPermissions');
        setAuthToken(null);
        setIsAuthenticated(false);
        setUser(null);
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{authToken, isAuthenticated, user, userPermissions,login, logout}}>
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
