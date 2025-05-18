import React, {useState, useEffect} from 'react';
import {Layout,Typography, Form, Input, Button, Switch, message} from 'antd';
import {useAuth} from '@/hooks/useAuth';
import {useApi} from '@/hooks/useApi';
import AppLayout from "@/components/AppLayout";

const { Content } = Layout;
const {Title} = Typography;

const ConfigurationPage = () => {
    const {user} = useAuth();
    const {get, post, loading, error} = useApi();
    const [settings, setSettings] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const data = await get('/configuration'); // Reemplaza con tu endpoint real para obtener la configuración
                setSettings(data);
                form.setFieldsValue(data); // Inicializar el formulario con los datos de configuración
            } catch (err) {
                console.error('Error fetching configuration:', err);
                message.error('Error al cargar la configuración.');
            }
        };

        fetchSettings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onFinish = async (values) => {
        try {
            const response = await post('/configuration', values); // Reemplaza con tu endpoint para guardar la configuración
            if (response && response.errorCode === null) {
                message.success('Configuración guardada exitosamente.');
                setSettings(values); // Actualizar el estado local con los nuevos valores
            } else {
                message.error(response?.message || 'Error al guardar la configuración.');
            }
        } catch (err) {
            console.error('Error saving configuration:', err);
            message.error('Error al guardar la configuración.');
        }
    };

    if (loading && !settings) {
        return <div>Cargando configuración...</div>;
    }

    if (error && !settings) {
        return <div>Error al cargar la configuración.</div>;
    }

    return (
        <AppLayout>
            <Content style={{margin: '24px 16px 0', overflow: 'initial'}}>
                <div>
                    <Title level={2}>Configuración</Title>
                    {settings && (
                        <Form form={form} layout="vertical" onFinish={onFinish}>
                            {/* Ejemplo de campos de configuración: */}
                            <Form.Item label="Nombre de Usuario" name="username">
                                <Input disabled value={user?.username}/>
                            </Form.Item>

                            <Form.Item label="Email" name="email">
                                <Input disabled value={user?.email}/>
                            </Form.Item>

                            <Form.Item label="Notificaciones por Correo Electrónico" name="emailNotifications"
                                       valuePropName="checked">
                                <Switch/>
                            </Form.Item>

                            <Form.Item label="Tema Oscuro" name="darkMode" valuePropName="checked">
                                <Switch/>
                            </Form.Item>

                            {/* Agrega aquí más campos de configuración según tus necesidades */}

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Guardar Configuración
                                </Button>
                            </Form.Item>
                        </Form>
                    )}
                </div>
            </Content>
        </AppLayout>
    );
};

export default ConfigurationPage;