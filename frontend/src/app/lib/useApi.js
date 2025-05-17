'use client'
import axios from 'axios';
import { useAuth } from './app';

export const useApi = () => {
    const { authToken } = useAuth();

    const api = axios.create({
        //baseURL: process.env.NEXT_PUBLIC_BACKEND_API_URL, //url
        baseURL: 'http://localhost:5147', //url
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken ? `Bearer ${authToken}` : '',
        },
    });

    return api;
};
