import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const PatientsPage = () => {
    const { get, post, put, del, loading } = useApi();
    const [patients, setPatients] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [editingPatient, setEditingPatient] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchPatients();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPatients = async () => {
        try {
            const data = await get('/api/patients'); // Reemplaza con tu endpoint real
            setPatients(data);
        } catch (err) {
            console.error('Error fetching patients:', err);
            message.error('Error al cargar los pacientes.');
        }
    };

    const showModal = (title, record = null) => {
        setModalTitle(title);
        setEditingPatient(record);
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
                if (editingPatient) {
                    response = await put(`/api/patients/${editingPatient.id}`, values); // Reemplaza con tu endpoint de edición
                    message.success('Paciente actualizado exitosamente.');
                } else {
                    response = await post('/api/patients', values); // Reemplaza con tu endpoint de creación
                    message.success('Paciente creado exitosamente.');
                }
                if (response?.errorCode === null) {
                    fetchPatients();
                    setIsModalOpen(false);
                    setEditingPatient(null);
                } else {
                    message.error(response?.message || 'Error al guardar el paciente.');
                }
            } catch (err) {
                console.error('Error saving patient:', err);
                message.error('Error al guardar el paciente.');
            }
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPatient(null);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '¿Estás seguro de eliminar este paciente?',
            onOk: async () => {
                try {
                    const response = await del(`/api/patients/${id}`); // Reemplaza con tu endpoint de eliminación
                    if (response?.errorCode === null) {
                        message.success('Paciente eliminado exitosamente.');
                        fetchPatients();
                    } else {
                        message.error(response?.message || 'Error al eliminar el paciente.');
                    }
                } catch (err) {
                    console.error('Error deleting patient:', err);
                    message.error('Error al eliminar el paciente.');
                }
            },
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Apellido', dataIndex: 'lastName', key: 'lastName' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        // Agrega más columnas según la información de tus pacientes
        {
            title: 'Acciones',
            key: 'actions',
            render: (text, record) => (
                <>
                    <Button icon={<EditOutlined />} onClick={() => showModal('Editar Paciente', record)} style={{ marginRight: 8 }}>
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
            <Title level={2}>Gestión de Pacientes</Title>
            <Button icon={<PlusOutlined />} onClick={() => showModal('Crear Nuevo Paciente')} type="primary" style={{ marginBottom: 16 }}>
                Crear Paciente
            </Button>
            <Table dataSource={patients} columns={columns} loading={loading} rowKey="id" />

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
                        label="Nombre"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre del paciente!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="lastName"
                        label="Apellido"
                        rules={[{ required: true, message: 'Por favor, ingresa el apellido del paciente!' }]}
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
                    {/* Agrega más campos del formulario según la información de tus pacientes */}
                </Form>
            </Modal>
        </div>
    );
};

export default PatientsPage;