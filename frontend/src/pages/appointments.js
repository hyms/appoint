import React, {useState, useEffect} from 'react';
import {Typography, Table, Button, message} from 'antd';
import {useApi} from '@/hooks/useApi';
import {useAuth} from '@/hooks/useAuth';
import {EyeOutlined, CloseOutlined, CheckOutlined} from '@ant-design/icons';
import AppLayout from '@/components/AppLayout';
import AppointmentDetailsModal from '@/components/appointments/AppointmentDetailsModal';
import CancelAppointmentModal from '@/components/appointments/CancelAppointmentModal';
import RecordAppointmentModal from '@/components/appointments/RecordAppointmentModal';
import RegisterAppointmentButton from '@/components/appointments/RegisterAppointmentButton';
import RegisterAppointmentModal from '@/components/appointments/RegisterAppointmentModal'; // Importa el modal de registro

const {Title} = Typography;

const AppointmentsPage = () => {
    const {user} = useAuth();
    const {get, del, put, loading} = useApi();
    const [appointments, setAppointments] = useState([]);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [isDetailsModalVisible, setIsDetailsModalVisible] = useState(false);
    const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
    const [isRecordModalVisible, setIsRecordModalVisible] = useState(false);
    const [isRegisterModalVisible, setIsRegisterModalVisible] = useState(false); // Estado para el modal de registro

    useEffect(() => {
        fetchAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAppointments = async () => {
        try {
            const data = await get('/api/appointments'); // Reemplaza con tu endpoint real
            setAppointments(data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            message.error('Error al cargar las citas.');
        }
    };

    const showRegisterModal = () => {
        setIsRegisterModalVisible(true);
    };

    const hideRegisterModal = () => {
        setIsRegisterModalVisible(false);
    };

    const showDetailsModal = (record) => {
        setSelectedAppointment(record);
        setIsDetailsModalVisible(true);
    };

    const hideDetailsModal = () => {
        setSelectedAppointment(null);
        setIsDetailsModalVisible(false);
    };

    const showCancelModal = (record) => {
        setSelectedAppointment(record);
        setIsCancelModalVisible(true);
    };

    const hideCancelModal = () => {
        setSelectedAppointment(null);
        setIsCancelModalVisible(false);
    };

    const showRecordModal = (record) => {
        setSelectedAppointment(record);
        setIsRecordModalVisible(true);
    };

    const hideRecordModal = () => {
        setSelectedAppointment(null);
        setIsRecordModalVisible(false);
    };

    const handleCancelAppointment = async (reason) => {
        if (selectedAppointment) {
            try {
                const response = await del(`/api/appointments/${selectedAppointment.id}`, {data: {cancellationReason: reason}}); // Reemplaza con tu endpoint de cancelación
                if (response?.errorCode === null) {
                    message.success('Cita cancelada exitosamente.');
                    fetchAppointments();
                } else {
                    message.error(response?.message || 'Error al cancelar la cita.');
                }
            } catch (err) {
                console.error('Error cancelling appointment:', err);
                message.error('Error al cancelar la cita.');
            } finally {
                hideCancelModal();
            }
        }
    };

    const handleRecordAppointment = async (summary) => {
        if (selectedAppointment) {
            try {
                const response = await put(`/api/appointments/${selectedAppointment.id}/record`, {summary}); // Reemplaza con tu endpoint para marcar como realizada
                if (response?.errorCode === null) {
                    message.success('Cita marcada como realizada exitosamente.');
                    fetchAppointments();
                } else {
                    message.error(response?.message || 'Error al marcar la cita como realizada.');
                }
            } catch (err) {
                console.error('Error recording appointment:', err);
                message.error('Error al marcar la cita como realizada.');
            } finally {
                hideRecordModal();
            }
        }
    };

    const columns = [
        {
            title: 'Paciente',
            dataIndex: 'patient',
            key: 'patient',
            render: (patient) => `${patient.name} ${patient.lastName}`, // Ajusta según tu modelo de paciente
        },
        {
            title: 'Hora',
            dataIndex: 'dateTime',
            key: 'dateTime',
            render: (dateTime) => moment(dateTime).format('YYYY-MM-DD HH:mm'), // Formatea la hora
        },
        {
            title: 'Estado',
            dataIndex: 'status',
            key: 'status',
            // Puedes usar un componente o lógica para mostrar el estado de forma visual
        },
        {
            title: 'Acciones',
            key: 'actions',
            render: (text, record) => (
                <>
                    <Button icon={<EyeOutlined/>} onClick={() => showDetailsModal(record)} size="small"
                            style={{marginRight: 8}}>
                        Ver
                    </Button>
                    {(user?.role === 'secretaria' || user?.role === 'administrador') && record.status !== 'cancelado' && (
                        <Button icon={<CloseOutlined/>} onClick={() => showCancelModal(record)} size="small" danger
                                style={{marginRight: 8}}>
                            Cancelar
                        </Button>
                    )}
                    {(user?.role === 'medico' || user?.role === 'administrador') && record.status !== 'cancelado' && record.status !== 'realizada' && (
                        <Button icon={<CheckOutlined/>} onClick={() => showRecordModal(record)} size="small"
                                type="primary">
                            Realizada
                        </Button>
                    )}
                    {/* Más acciones según los roles */}
                </>
            ),
        },
    ];

    return (
        <AppLayout>
            <div>
                <Title level={2}>Gestión de Citas</Title>
                {(user?.role === 'secretaria' || user?.role === 'administrador') && (
                    <RegisterAppointmentButton onClick={showRegisterModal}/>
                )}
                <Table dataSource={appointments} columns={columns} loading={loading} rowKey="id"/>

                <AppointmentDetailsModal
                    visible={isDetailsModalVisible}
                    onCancel={hideDetailsModal}
                    appointment={selectedAppointment}
                />

                <CancelAppointmentModal
                    visible={isCancelModalVisible}
                    onCancel={hideCancelModal}
                    onConfirm={handleCancelAppointment}
                />

                <RecordAppointmentModal
                    visible={isRecordModalVisible}
                    onCancel={hideRecordModal}
                    onConfirm={handleRecordAppointment}
                    appointment={selectedAppointment}
                />

                <RegisterAppointmentModal
                    visible={isRegisterModalVisible}
                    onCancel={hideRegisterModal}
                    onAppointmentCreated={fetchAppointments}
                />
            </div>
        </AppLayout>
    );
};

export default AppointmentsPage;