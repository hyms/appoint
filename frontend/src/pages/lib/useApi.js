// 'use client'
import axios from 'axios';
import { useAuth } from './useAuth';

export const useApi = () => {
    const { authToken } = useAuth();
    //const baseURL= process.env.NEXT_PUBLIC_BACKEND_API_URL, //url
    const baseURL= 'http://localhost:5000';

    const api = axios.create({
        baseURL: baseURL,
        headers: {
            'Content-Type': 'application/json',
            // Incluye el token solo si está presente
            ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
    });

    const handleResponse = (response) => {
        return response.data; // Asumimos que el backend siempre responde con { errorCode, message, data }
    };

    const handleError = (error) => {
        console.error('API Error:', error);
        // Puedes personalizar el manejo de errores aquí, por ejemplo,
        // extrayendo el mensaje de error del backend si está presente.
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('An unexpected error occurred.');
    };

    const get = async (url, config = {}) => {
        try {
            const response = await api.get(url, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const post = async (url, data = {}, config = {}) => {
        try {
            console.log(authToken);
            const response = await api.post(url, data, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const put = async (url, data = {}, config = {}) => {
        try {
            const response = await api.put(url, data, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    const del = async (url, config = {}) => {
        try {
            const response = await api.delete(url, config);
            return handleResponse(response);
        } catch (error) {
            handleError(error);
        }
    };

    return { get, post, put, delete: del };
};

export default useApi;