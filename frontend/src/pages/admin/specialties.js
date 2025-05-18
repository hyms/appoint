'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message } from 'antd';
import { useApi } from '../../hooks/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const SpecialtiesPage = () => {
    const { get, post, put, del, loading } = useApi();
    const [specialties, setSpecialties] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [editingSpecialty, setEditingSpecialty] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchSpecialties();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSpecialties = async () => {
        try {
            const data = await get('/api/admin/specialties'); // Reemplaza con tu endpoint real
            setSpecialties(data);
        } catch (err) {
            console.error('Error fetching specialties:', err);
            message.error('Error al cargar las especialidades.');
        }
    };

    const showModal = (title, record = null) => {
        setModalTitle(title);
        setEditingSpecialty(record);
        setIsModalOpen(true);
        form.resetFields();
        if (record) {
            form.setFieldsValue(record);
        }
    };

    const handleOk = async () => {
        form.validateFields().then(async (values) => {
            try {
                let response;
                if (editingSpecialty) {
                    response = await put(`/api/admin/specialties/${editingSpecialty.id}`, values); // Reemplaza con tu endpoint de edición
                    message.success('Especialidad actualizada exitosamente.');
                } else {
                    response = await post('/api/admin/specialties', values); // Reemplaza con tu endpoint de creación
                    message.success('Especialidad creada exitosamente.');
                }
                if (response?.errorCode === null) {
                    fetchSpecialties();
                    setIsModalOpen(false);
                    setEditingSpecialty(null);
                } else {
                    message.error(response?.message || 'Error al guardar la especialidad.');
                }
            } catch (err) {
                console.error('Error saving specialty:', err);
                message.error('Error al guardar la especialidad.');
            }
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingSpecialty(null);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '¿Estás seguro de eliminar esta especialidad?',
            onOk: async () => {
                try {
                    const response = await del(`/api/admin/specialties/${id}`); // Reemplaza con tu endpoint de eliminación
                    if (response?.errorCode === null) {
                        message.success('Especialidad eliminada exitosamente.');
                        fetchSpecialties();
                    } else {
                        message.error(response?.message || 'Error al eliminar la especialidad.');
                    }
                } catch (err) {
                    console.error('Error deleting specialty:', err);
                    message.error('Error al eliminar la especialidad.');
                }
            },
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Descripción', dataIndex: 'description', key: 'description' },
        {
            title: 'Acciones',
            key: 'actions',
            render: (text, record) => (
                <>
                    <Button icon={<EditOutlined />} onClick={() => showModal('Editar Especialidad', record)} style={{ marginRight: 8 }}>
                        Editar
                    </Button>
                    <Button icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} danger>
                        Eliminar
                    </Button>
                </>
            ),
        },
    ];

    return (
        <div>
            <Title level={2}>Gestión de Especialidades</Title>
            <Button icon={<PlusOutlined />} onClick={() => showModal('Crear Nueva Especialidad')} type="primary" style={{ marginBottom: 16 }}>
                Crear Especialidad
            </Button>
            <Table dataSource={specialties} columns={columns} loading={loading} rowKey="id" />

            <Modal
                title={modalTitle}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="name"
                        label="Nombre de la Especialidad"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre de la especialidad!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Descripción"
                        rules={[{ required: true, message: 'Por favor, ingresa la descripción de la especialidad!' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    {/* Puedes agregar más campos según la estructura de tus especialidades */}
                </Form>
            </Modal>
        </div>
    );
};

export default SpecialtiesPage;