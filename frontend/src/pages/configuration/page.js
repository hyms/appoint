'use client';

import React, {useState, useEffect} from 'react';
import {Layout, Typography, Form, Input, Button, message} from 'antd';
import {SettingOutlined} from '@ant-design/icons';
import {useApi} from '../lib/useApi'; // Ajusta la ruta de importación

const {Content} = Layout;
const {Title} = Typography;

const ConfiguracionPage = () => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const api = useApi();

    useEffect(() => {
        const fetchConfiguracion = async () => {
            setLoading(true);
            try {
                const responseData = await api.get('/api/configuracion');
                form.setFieldsValue(responseData.data);
                if (responseData.errorCode) {
                    message.error(responseData.message || 'Failed to load configuration.');
                }
            } catch (error) {
                message.error(error.message || 'Network error while loading configuration.');
            } finally {
                setLoading(false);
            }
        };

        fetchConfiguracion();
    }, [api, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const responseData = await api.post('/api/configuracion', values);
            if (responseData.errorCode) {
                message.error(responseData.message || 'Failed to save configuration.');
            } else {
                message.success(responseData.message || 'Configuration saved successfully.');
                // Opcional: Recargar la configuración
                fetchConfiguracion();
            }
        } catch (error) {
            message.error(error.message || 'Network error while saving configuration.');
        } finally {
            setLoading(false);
        }
    };

    const onFinishFailed = (errorInfo) => {
        console.error('Failed:', errorInfo);
    };

    return (
        <Content style={{margin: '24px 16px 0', overflow: 'initial'}}>
            <div style={{padding: 24, textAlign: 'left'}}>
                <Title level={2} icon={<SettingOutlined/>}>Configuración del Sistema</Title>
                <div style={{marginTop: 24}}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        initialValues={{
                            nombreEmpresa: '',
                            direccionEmpresa: '',
                            telefonoEmpresa: '',
                            whatsappApiKey: '',
                            onesignalAppId: '',
                            // ... otros campos de configuración
                        }}
                    >
                        <Form.Item
                            label="Nombre de la Empresa"
                            name="nombreEmpresa"
                            rules={[{required: true, message: 'Por favor, ingresa el nombre de la empresa!'}]}
                        >
                            <Input/>
                        </Form.Item>

                        <Form.Item
                            label="Dirección de la Empresa"
                            name="direccionEmpresa"
                        >
                            <Input/>
                        </Form.Item>

                        <Form.Item
                            label="Teléfono de la Empresa"
                            name="telefonoEmpresa"
                        >
                            <Input/>
                        </Form.Item>

                        <Form.Item
                            label="Clave API de WhatsApp"
                            name="whatsappApiKey"
                        >
                            <Input.Password/> {/* Usar Input.Password si es sensible */}
                        </Form.Item>

                        <Form.Item
                            label="ID de Aplicación OneSignal"
                            name="onesignalAppId"
                        >
                            <Input/>
                        </Form.Item>

                        {/* Agrega más campos de configuración aquí */}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Guardar Cambios
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </Content>
    );
};

export default ConfiguracionPage;