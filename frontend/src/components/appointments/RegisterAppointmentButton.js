import React from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const RegisterAppointmentButton = ({ onClick }) => {
    return (
        <Button icon={<PlusOutlined />} type="primary" style={{ marginBottom: 16 }} onClick={onClick}>
            Registrar Nueva Cita
        </Button>
    );
};

export default RegisterAppointmentButton;