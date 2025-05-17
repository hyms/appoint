'use client'
import React, {useState} from 'react';
import {Form, Input, Button, message} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import {useRouter} from 'next/navigation';
import {useApi} from '../lib/useApi';
import '@ant-design/v5-patch-for-react-19';

const LoginForm = () => {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const api = useApi();
    const onFinish = async (values) => {
        setLoading(true);
        try {
            const response = await api.post(`auth/login`, values, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = response.data;

            if (response.status === 200) {
                // Autenticación exitosa
                localStorage.setItem('authToken', data.token); // Guardar el token (ejemplo)
                message.success('¡Login exitoso!');
                router.push('/'); // Redirigir a la página principal
            } else {
                // Autenticación fallida (aunque axios no lanza error para status != 2xx)
                message.error(data.message || 'Error al iniciar sesión. Credenciales incorrectas.');
            }
        } catch (error) {
            message.error('Error de conexión con el servidor.');
            console.error('Error de login:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form
            name="login-form"
            className="login-form"
            onFinish={onFinish}
            style={{maxWidth: 300, margin: 'auto', paddingTop: 50}}
        >
            <Form.Item
                name="username"
                rules={[{required: true, message: 'Por favor, ingresa tu nombre de usuario!'}]}
            >
                <Input prefix={<UserOutlined className="site-form-item-icon"/>} placeholder="Usuario"/>
            </Form.Item>

            <Form.Item
                name="password"
                rules={[{required: true, message: 'Por favor, ingresa tu contraseña!'}]}
            >
                <Input
                    prefix={<LockOutlined className="site-form-item-icon"/>}
                    type="password"
                    placeholder="Contraseña"
                />
            </Form.Item>

            <Form.Item>
                <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}>
                    Iniciar Sesión
                </Button>
            </Form.Item>
        </Form>
    );
};

export default LoginForm;