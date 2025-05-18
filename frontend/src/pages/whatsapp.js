'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Form, Input, Button, Select, message } from 'antd';
import { WhatsAppOutlined } from '@ant-design/icons';
import { useApi } from '@/hooks/useApi';

const { Title } = Typography;
const { Item } = Form;
const { Option } = Select;

const WhatsAppNotifications = () => {
    const [form] = Form.useForm();
    const { get, loading } = useApi();
    const [patients, setPatients] = useState([]);

    useEffect(() => {
        fetchPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPatients = async () => {
        try {
            const data = await get('/api/patients'); // Reemplaza con tu endpoint de pacientes con número de teléfono
            setPatients(data);
        } catch (error) {
            console.error('Error fetching patients for WhatsApp:', error);
            message.error('Error al cargar la lista de pacientes.');
        }
    };

    const handleSendToSpecific = (values) => {
        if (values.specificNumber && values.message) {
            const whatsappLink = `https://web.whatsapp.com/send?phone=${values.specificNumber}&text=${encodeURIComponent(values.message)}`;
            window.open(whatsappLink, '_blank');
        } else {
            message.warning('Por favor, ingresa un número de teléfono y un mensaje.');
        }
    };

    const handleSendToAll = (values) => {
        if (values.message && patients.length > 0) {
            patients.forEach(patient => {
                if (patient.phone) { // Asegúrate de que el paciente tenga un número de teléfono
                    const whatsappLink = `https://web.whatsapp.com/send?phone=${patient.phone}&text=${encodeURIComponent(values.message)}`;
                    window.open(whatsappLink, '_blank');
                    // Considera agregar un pequeño retraso entre la apertura de cada ventana
                    // para evitar problemas con el navegador.
                } else {
                    message.warning(`El paciente ${patient.name} no tiene un número de teléfono registrado.`);
                }
            });
            message.success(`Se intentará abrir WhatsApp Web para enviar el mensaje a ${patients.length} pacientes.`);
        } else if (patients.length === 0) {
            message.info('No hay pacientes registrados para enviar el mensaje.');
        } else {
            message.warning('Por favor, ingresa el mensaje a enviar.');
        }
    };

    const handleOpenWhatsAppWeb = () => {
        window.open('https://web.whatsapp.com/', '_blank');
    };

    return (
        <div>
            <Title level={2}>Notificaciones vía WhatsApp</Title>

            <Form form={form} layout="vertical">
                <Item label="Mensaje a enviar" name="message" rules={[{ required: true, message: 'Por favor, ingresa el mensaje a enviar.' }]}>
                    <Input.TextArea rows={4} placeholder="Escribe tu mensaje aquí..." />
                </Item>

                <Title level={4}>Enviar a un número específico</Title>
                <Item label="Número de teléfono" name="specificNumber">
                    <Input placeholder="Ingresa el número de teléfono (con código de país)" />
                </Item>
                <Item>
                    <Button type="primary" onClick={() => form.submit()} htmlType="button">
                        Enviar a número específico
                    </Button>
                </Item>

                <Title level={4} style={{ marginTop: 24 }}>Enviar a todos los pacientes</Title>
                <Item>
                    <Button type="primary" onClick={() => form.submit()} htmlType="button">
                        Enviar a todos los pacientes ({patients.length})
                    </Button>
                </Item>

                <div style={{ marginTop: 24 }}>
                    <Button icon={<WhatsAppOutlined />} size="large" onClick={handleOpenWhatsAppWeb}>
                        Abrir WhatsApp Web
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default WhatsAppNotifications;