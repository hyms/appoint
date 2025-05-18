import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const DoctorsPage = () => {
    const { get, post, put, del, loading } = useApi();
    const [doctors, setDoctors] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [editingDoctor, setEditingDoctor] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchDoctors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDoctors = async () => {
        try {
            const data = await get('/api/admin/doctors'); // Reemplaza con tu endpoint real
            setDoctors(data);
        } catch (err) {
            console.error('Error fetching doctors:', err);
            message.error('Error al cargar los doctores.');
        }
    };

    const showModal = (title, record = null) => {
        setModalTitle(title);
        setEditingDoctor(record);
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
                if (editingDoctor) {
                    response = await put(`/api/admin/doctors/${editingDoctor.id}`, values); // Reemplaza con tu endpoint de edición
                    message.success('Doctor actualizado exitosamente.');
                } else {
                    response = await post('/api/admin/doctors', values); // Reemplaza con tu endpoint de creación
                    message.success('Doctor creado exitosamente.');
                }
                if (response?.errorCode === null) {
                    fetchDoctors();
                    setIsModalOpen(false);
                    setEditingDoctor(null);
                } else {
                    message.error(response?.message || 'Error al guardar el doctor.');
                }
            } catch (err) {
                console.error('Error saving doctor:', err);
                message.error('Error al guardar el doctor.');
            }
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingDoctor(null);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '¿Estás seguro de eliminar este doctor?',
            onOk: async () => {
                try {
                    const response = await del(`/api/admin/doctors/${id}`); // Reemplaza con tu endpoint de eliminación
                    if (response?.errorCode === null) {
                        message.success('Doctor eliminado exitosamente.');
                        fetchDoctors();
                    } else {
                        message.error(response?.message || 'Error al eliminar el doctor.');
                    }
                } catch (err) {
                    console.error('Error deleting doctor:', err);
                    message.error('Error al eliminar el doctor.');
                }
            },
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Especialidad', dataIndex: 'specialty', key: 'specialty' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        {
            title: 'Acciones',
            key: 'actions',
            render: (text, record) => (
                <>
                    <Button icon={<EditOutlined />} onClick={() => showModal('Editar Doctor', record)} style={{ marginRight: 8 }}>
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
            <Title level={2}>Gestión de Doctores</Title>
            <Button icon={<PlusOutlined />} onClick={() => showModal('Crear Nuevo Doctor')} type="primary" style={{ marginBottom: 16 }}>
                Crear Doctor
            </Button>
            <Table dataSource={doctors} columns={columns} loading={loading} rowKey="id" />

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
                        label="Nombre del Doctor"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre del doctor!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="specialty"
                        label="Especialidad"
                        rules={[{ required: true, message: 'Por favor, ingresa la especialidad!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, message: 'Por favor, ingresa el email!', type: 'email' }]}
                    >
                        <Input type="email" />
                    </Form.Item>
                    {/* Puedes agregar más campos según la información del doctor */}
                </Form>
            </Modal>
        </div>
    );
};

export default DoctorsPage;