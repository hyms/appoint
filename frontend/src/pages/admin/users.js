'use client';

import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, message, Select } from 'antd';
import { useApi } from '../../hooks/useApi';
import { PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';

const { Title } = Typography;

const UsersPage = () => {
    const { get, post, put, del, loading } = useApi();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [form] = Form.useForm();
    const [isAssignPermissionsModalOpen, setIsAssignPermissionsModalOpen] = useState(false);
    const [userToAssignPermissions, setUserToAssignPermissions] = useState(null);
    const [roles, setRoles] = useState([]);
    const [assignPermissionsForm] = Form.useForm();

    useEffect(() => {
        fetchUsers();
        fetchRoles();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchUsers = async () => {
        try {
            const data = await get('/api/admin/users'); // Reemplaza con tu endpoint real
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
            message.error('Error al cargar los usuarios.');
        }
    };

    const fetchRoles = async () => {
        try {
            const rolesData = await get('/api/admin/roles'); // Reemplaza con tu endpoint de roles estáticos
            setRoles(rolesData);
        } catch (error) {
            console.error('Error fetching roles:', error);
            message.error('Error al cargar los roles.');
        }
    };

    const showModal = (title, record = null) => {
        setModalTitle(title);
        setEditingUser(record);
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
                if (editingUser) {
                    response = await put(`/api/admin/users/${editingUser.id}`, values); // Reemplaza con tu endpoint de edición
                    message.success('Usuario actualizado exitosamente.');
                } else {
                    response = await post('/api/admin/users', values); // Reemplaza con tu endpoint de creación
                    message.success('Usuario creado exitosamente.');
                }
                if (response?.errorCode === null) {
                    fetchUsers();
                    setIsModalOpen(false);
                    setEditingUser(null);
                } else {
                    message.error(response?.message || 'Error al guardar el usuario.');
                }
            } catch (err) {
                console.error('Error saving user:', err);
                message.error('Error al guardar el usuario.');
            }
        });
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleDelete = async (id) => {
        Modal.confirm({
            title: '¿Estás seguro de eliminar este usuario?',
            onOk: async () => {
                try {
                    const response = await del(`/api/admin/users/${id}`); // Reemplaza con tu endpoint de eliminación
                    if (response?.errorCode === null) {
                        message.success('Usuario eliminado exitosamente.');
                        fetchUsers();
                    } else {
                        message.error(response?.message || 'Error al eliminar el usuario.');
                    }
                } catch (err) {
                    console.error('Error deleting user:', err);
                    message.error('Error al eliminar el usuario.');
                }
            },
        });
    };

    const showAssignPermissionsModal = (record) => {
        setUserToAssignPermissions(record);
        setIsAssignPermissionsModalOpen(true);
        assignPermissionsForm.setFieldsValue({ role: record.role }); // Si el rol ya está asignado
    };

    const handleAssignPermissionsOk = async () => {
        assignPermissionsForm.validateFields().then(async (values) => {
            try {
                const response = await put(`/api/admin/users/${userToAssignPermissions.id}/roles`, { role: values.role }); // Reemplaza con tu endpoint de asignación de roles
                if (response?.errorCode === null) {
                    message.success(`Rol asignado a ${userToAssignPermissions.username} exitosamente.`);
                    fetchUsers();
                    setIsAssignPermissionsModalOpen(false);
                    setUserToAssignPermissions(null);
                } else {
                    message.error(response?.message || 'Error al asignar el rol.');
                }
            } catch (error) {
                console.error("Error assigning role:", error);
                message.error("Error al asignar el rol.");
            }
        });
    };

    const handleAssignPermissionsCancel = () => {
        setIsAssignPermissionsModalOpen(false);
        setUserToAssignPermissions(null);
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Nombre de Usuario', dataIndex: 'username', key: 'username' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Rol', dataIndex: 'role', key: 'role' },
        {
            title: 'Acciones',
            key: 'actions',
            render: (text, record) => (
                <>
                    <Button icon={<EditOutlined />} onClick={() => showModal('Editar Usuario', record)} style={{ marginRight: 8 }}>
                        Editar
                    </Button>
                    <Button icon={<KeyOutlined />} onClick={() => showAssignPermissionsModal(record)} style={{ marginRight: 8 }}>
                        Asignar Rol
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
            <Title level={2}>Gestión de Usuarios</Title>
            <Button icon={<PlusOutlined />} onClick={() => showModal('Crear Nuevo Usuario')} type="primary" style={{ marginBottom: 16 }}>
                Crear Usuario
            </Button>
            <Table dataSource={users} columns={columns} loading={loading} rowKey="id" />

            <Modal
                title={modalTitle}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
                confirmLoading={loading}
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="username"
                        label="Nombre de Usuario"
                        rules={[{ required: true, message: 'Por favor, ingresa el nombre de usuario!' }]}
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
                    <Form.Item
                        name="password"
                        label="Contraseña"
                        rules={[{ required: modalTitle === 'Crear Nuevo Usuario', message: 'Por favor, ingresa la contraseña!' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Rol"
                        rules={[{ required: true, message: 'Por favor, selecciona un rol!' }]}
                    >
                        <Select placeholder="Seleccionar Rol">
                            {roles.map(role => (
                                <Select.Option key={role.id} value={role.name}>{role.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    {/* Puedes agregar más campos según la información de tu usuario */}
                </Form>
            </Modal>

            <Modal
                title={`Asignar Rol a ${userToAssignPermissions?.username}`}
                open={isAssignPermissionsModalOpen}
                onOk={handleAssignPermissionsOk}
                onCancel={handleAssignPermissionsCancel}
                confirmLoading={loading}
            >
                <Form form={assignPermissionsForm} layout="vertical">
                    <Form.Item
                        name="role"
                        label="Rol"
                        rules={[{ required: true, message: 'Por favor, selecciona un rol!' }]}
                    >
                        <Select placeholder="Seleccionar Rol">
                            {roles.map(role => (
                                <Select.Option key={role.id} value={role.name}>{role.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UsersPage;