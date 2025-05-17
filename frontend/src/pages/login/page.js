'use client';

import React, {useState} from 'react';
import {Card, Form, Input, Button, Typography, message} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import {useRouter} from 'next/navigation';
import {useAuth} from '../../app/lib/useAuth'; // Asegúrate de la ruta correcta
import {useApi} from '../../app/lib/useApi'; // Asegúrate de la ruta correcta
import '@ant-design/v5-patch-for-react-19';

const {Title} = Typography;

const LoginPage = () => {
    const [loading, setLoading] = useState(false);
    const {login} = useAuth();
    const router = useRouter();
    const api = useApi();

    const onFinish = async (values) => {
        setLoading(true);
        try {
            await login(values); // Asumiendo que el token y el rol están en responseData.data
        } catch (error) {
            message.error(error.message || 'Error de conexión con el servidor.');
            console.error('Error de login:', error);
        } finally {
            setLoading(false);
        }
    };

    return (

        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f0f2f5'
        }}>
            <Card title={<Title level={2} style={{textAlign: 'center'}}>Iniciar Sesión</Title>} style={{width: 400}}>
                <Form
                    name="login_form"
                    initialValues={{
                        remember: true,
                    }}
                    onFinish={onFinish}
                >
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: 'Por favor, ingresa tu nombre de usuario!',
                            },
                        ]}
                    >
                        <Input prefix={<UserOutlined className="site-form-item-icon"/>} placeholder="Usuario"/>
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: 'Por favor, ingresa tu contraseña!',
                            },
                        ]}
                    >
                        <Input
                            prefix={<LockOutlined className="site-form-item-icon"/>}
                            type="password"
                            placeholder="Contraseña"
                        />
                    </Form.Item>

                    {/* Si acordamos la opción de recordar usuario */}
                    {/* <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Recordarme</Checkbox>
          </Form.Item> */}

                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="login-form-button" loading={loading}
                                style={{width: '100%'}}>
                            Iniciar Sesión
                        </Button>
                        {/* Si acordamos la opción de registro */}
                        {/* <div style={{ marginTop: 12, textAlign: 'right' }}>
              O <Link href="/register">Regístrate ahora!</Link>
            </div> */}
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;