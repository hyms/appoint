import React from 'react';
import { Modal, Form, Input } from 'antd';

const { TextArea } = Input;

const CancelAppointmentModal = ({ visible, onCancel, onConfirm }) => {
    const [form] = Form.useForm();

    const handleOk = () => {
        form.validateFields().then((values) => {
            onConfirm(values.cancellationReason);
            form.resetFields();
        }).catch((errorInfo) => {
            console.log('Validation Failed:', errorInfo);
        });
    };

    return (
        <Modal
            title="Cancelar Cita"
            open={visible}
            onCancel={onCancel}
            onOk={handleOk}
        >
            <Form form={form} layout="vertical">
                <Form.Item
                    name="cancellationReason"
                    label="Motivo de Cancelación"
                    rules={[
                        { required: true, message: 'Por favor, ingresa el motivo de la cancelación.' },
                        { min: 20, message: 'El motivo de la cancelación debe tener al menos 20 caracteres.' },
                    ]}
                >
                    <TextArea rows={4} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CancelAppointmentModal;