// pages/login.js
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/router'; // Importa useRouter desde 'next/router'
import { Form, Input, Button, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth'; // Ajusta la ruta según tu estructura

const { Title } = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const router = useRouter(); // Utiliza useRouter de 'next/router'

    const onFinish = async (values) => {
        setLoading(true);
        const success = await login(values);
        setLoading(false);
        if (success) {
            router.push('/'); // Redirige al dashboard tras el login exitoso
        } else {
            message.error('Nombre de usuario o contraseña incorrectos');
        }
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '80vh',
                padding: '20px',
            }}
        >
            <Title level={2} style={{ marginBottom: '24px' }}>
                Iniciar Sesión
            </Title>
            <Form
                name="login-form"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                style={{ width: '300px' }}
            >
                <Form.Item
                    name="username"
                    rules={[{ required: true, message: 'Por favor, ingresa tu nombre de usuario!' }]}
                >
                    <Input prefix={<UserOutlined className="site-form-item-icon" />} placeholder="Nombre de usuario" />
                </Form.Item>

                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Por favor, ingresa tu contraseña!' }]}
                >
                    <Input
                        prefix={<LockOutlined className="site-form-item-icon" />}
                        type="password"
                        placeholder="Contraseña"
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit" className="login-form-button" loading={loading} block>
                        Iniciar Sesión
                    </Button>
                </Form.Item>
            </Form>
        </div>
    );
};

export default LoginPage;