import React from 'react';
import { Modal, Descriptions } from 'antd';

const AppointmentDetailsModal = ({ visible, onCancel, appointment }) => {
    return (
        <Modal
            title="Detalle de la Cita"
            open={visible}
            onCancel={onCancel}
            footer={null} // O puedes agregar botones si necesitas acciones desde el detalle
        >
            {appointment ? (
                <Descriptions bordered>
                    <Descriptions.Item label="ID">{appointment.id}</Descriptions.Item>
                    <Descriptions.Item label="Paciente">{`${appointment.patient?.name} ${appointment.patient?.lastName}`}</Descriptions.Item>
                    <Descriptions.Item label="Doctor">{appointment.doctor?.name}</Descriptions.Item>
                    <Descriptions.Item label="Fecha y Hora">{appointment.dateTime}</Descriptions.Item> {/* Ajusta el formato según tu necesidad */}
                    <Descriptions.Item label="Estado">{appointment.status}</Descriptions.Item>
                    <Descriptions.Item label="Motivo de la Cita">{appointment.reason}</Descriptions.Item>
                    {appointment.cancellationReason && (
                        <Descriptions.Item label="Motivo de Cancelación">{appointment.cancellationReason}</Descriptions.Item>
                    )}
                    {appointment.summary && (
                        <Descriptions.Item label="Resumen de la Cita" span={3}>
                            {appointment.summary}
                        </Descriptions.Item>
                    )}
                    {/* Agrega aquí más detalles de la cita según tu modelo de datos */}
                </Descriptions>
            ) : (
                <p>No se ha seleccionado ninguna cita.</p>
            )}
        </Modal>
    );
};

export default AppointmentDetailsModal;