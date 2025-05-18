import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;

const PermissionsPage = () => {
    const { get, post, put, del, loading } = useApi();
    const [permissions, setPermissions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [editingPermission, setEditingPermission] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchPermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchPermissions = async () => {
        try {
            const data = await get('/api/admin/permissions'); // Reemplaza con tu endpoint real
            setPermissions(data);
        } catch (err) {
            console.error('Error fetching permissions:', err);
            message.error('Error al cargar los permisos.');
        }
    };

    const showModal = (title, record = null) => {
        setModalTitle(title);
        setEditingPermission(record);
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
                if (editingPermission) {
                    response = await put(`/api/admin/permissions/${editingPermission.id}`, values); // Reemplaza con tu endpoint de edición
                    message.success('Permiso actualizado exitosamente.');
                } else {
                    response = await post('/api/admin/permissions', values); // Reemplaza con tu endpoint de creación
                    message.success('Permiso creado exitosamente.');
                }
                if (response?.errorCode === null) {
                    fetchPermissions();
                    setIsModalOpen(false);
                    setEditingPermission(null);
                } else {
                    message.error(response?.message || 'Error al guardar el permiso.');
                }
            } catch (err) {
                console.error('Error saving permission:', err);
                message.error('Error al guardar el permiso.');
            }
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingPermission(null);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '¿Estás seguro de eliminar este permiso?',
            onOk: async () => {
                try {
                    const response = await del(`/api/admin/permissions/${id}`); // Reemplaza con tu endpoint de eliminación
                    if (response?.errorCode === null) {
                        message.success('Permiso eliminado exitosamente.');
                        fetchPermissions();
                    } else {
                        message.error(response?.message || 'Error al eliminar el permiso.');
                    }
                } catch (err) {
                    console.error('Error deleting permission:', err);
                    message.error('Error al eliminar el permiso.');
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
                    <Button icon={<EditOutlined />} onClick={() => showModal('Editar Permiso', record)} style={{ marginRight: 8 }}>
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
            <Title level={2}>Gestión de Permisos</Title>
            <Button icon={<PlusOutlined />} onClick={() => showModal('Crear Nuevo Permiso')} type="primary" style={{ marginBottom: 16 }}>
                Crear Permiso
            </Button>
            <Table dataSource={permissions} columns={columns} loading={loading} rowKey="id" />

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
                        label="Nombre del Permiso"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre del permiso!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Descripción"
                        rules={[{ required: true, message: 'Por favor, ingresa la descripción del permiso!' }]}
                    >
                        <Input.TextArea rows={4} />
                    </Form.Item>
                    {/* Puedes agregar más campos según la estructura de tus permisos */}
                </Form>
            </Modal>
        </div>
    );
};

export default PermissionsPage;