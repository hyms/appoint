import axios from 'axios';
import { useAuth } from './useAuth'; // Import necesario para usar el contexto en los componentes

export const useApi = () => {
    const { authToken,isAuthenticated } = useAuth();
    //const baseURL= process.env.NEXT_PUBLIC_BACKEND_API_URL, //url
    const baseURL= 'http://localhost:5000';

    const apiInstance = axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': 'application/json',
            // Incluye el token solo si está presente
            ...(isAuthenticated ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
    });

    const handleResponse = (response) => {
        return response.data;
    };

    const handleError = (error) => {
        console.error('API Error:', error);
        // if (error.response && error.response.data && error.response.data.message) {
        //     throw new Error(error.response.data.message);
        // }
        // throw new Error('An unexpected error occurred.');
    };

    const get = async (url, config = {}) => {
        try {
            const response = await apiInstance.get(url, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const post = async (url, data = {}, config = {}) => {
        try {
            const response = await apiInstance.post(url, data, {
                ...config,
                headers: {
                    ...config.headers,
                    // El token se añade aquí, desde el contexto en el componente que llama a post
                },
            });
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const put = async (url, data = {}, config = {}) => {
        try {
            const response = await apiInstance.put(url, data, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const del = async (url, config = {}) => {
        try {
            const response = await apiInstance.delete(url, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    return { get, post, put, delete: del };
};

export default useApi;