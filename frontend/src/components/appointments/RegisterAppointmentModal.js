import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, DatePicker, TimePicker, Button, message,Input } from 'antd';
import { useApi } from '@/hooks/useApi';
import moment from 'moment';

const { Option } = Select;

const RegisterAppointmentModal = ({ visible, onCancel, onAppointmentCreated }) => {
    const [form] = Form.useForm();
    const { get, post, loading } = useApi();
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [availableTimes, setAvailableTimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    // Configuración predeterminada de la hora (ejemplo: cada 30 minutos desde las 9:00 hasta las 17:00)
    const defaultTimeSlots = generateTimeSlots(moment('09:00', 'HH:mm'), moment('17:00', 'HH:mm'), 30);

    useEffect(() => {
        if (visible) {
            fetchPatients();
            fetchDoctors();
            fetchSpecialties();
            form.resetFields();
            setSelectedDate(null);
            setAvailableTimes(defaultTimeSlots); // Inicializar con todas las horas al abrir el modal
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const fetchPatients = async () => {
        try {
            const data = await get('/api/patients'); // Reemplaza con tu endpoint
            setPatients(data);
        } catch (error) {
            console.error('Error fetching patients:', error);
            message.error('Error al cargar los pacientes.');
        }
    };

    const fetchDoctors = async () => {
        try {
            const data = await get('/api/doctors'); // Reemplaza con tu endpoint
            setDoctors(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            message.error('Error al cargar los doctores.');
        }
    };

    const fetchSpecialties = async () => {
        try {
            const data = await get('/api/specialties'); // Reemplaza con tu endpoint
            setSpecialties(data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
            message.error('Error al cargar las especialidades.');
        }
    };

    const handleDateChange = (date) => {
        setSelectedDate(date);
        form.setFieldsValue({ time: undefined }); // Resetear la hora al cambiar la fecha
        if (date) {
            fetchAvailableTimes(date.format('YYYY-MM-DD'));
        } else {
            setAvailableTimes(defaultTimeSlots); // Si no hay fecha seleccionada, mostrar todas las horas
        }
    };

    const fetchAvailableTimes = async (date) => {
        try {
            const data = await get(`/api/appointments/available-times?date=${date}`); // Reemplaza con tu endpoint
            // Suponiendo que el backend devuelve un array de strings con las horas disponibles ('HH:mm')
            setAvailableTimes(data);
        } catch (error) {
            console.error('Error fetching available times:', error);
            message.error('Error al cargar las horas disponibles.');
            setAvailableTimes([]);
        }
    };

    const onFinish = async (values) => {
        try {
            const appointmentData = {
                patientId: values.patient,
                doctorId: values.doctor,
                specialtyId: values.specialty,
                dateTime: moment(`${values.date.format('YYYY-MM-DD')} ${moment(values.time).format('HH:mm')}`).toISOString(),
                reason: values.reason,
                status: 'pendiente', // Estado inicial
            };
            const response = await post('/api/appointments', appointmentData); // Reemplaza con tu endpoint
            if (response?.errorCode === null) {
                message.success('Cita registrada exitosamente.');
                onAppointmentCreated(); // Notificar a la página principal para recargar las citas
                onCancel(); // Cerrar el modal
                form.resetFields();
                setSelectedDate(null);
                setAvailableTimes(defaultTimeSlots);
            } else {
                message.error(response?.message || 'Error al registrar la cita.');
            }
        } catch (error) {
            console.error('Error registering appointment:', error);
            message.error('Error al registrar la cita.');
        }
    };

    const doctorOptions = doctors.length === 1
        ? [{ value: doctors[0].id, label: doctors[0].name }]
        : doctors.map(doc => ({ value: doc.id, label: doc.name }));

    return (
        <Modal
            title="Registrar Nueva Cita"
            open={visible}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" loading={loading} onClick={() => form.submit()}>
                    Registrar
                </Button>,
            ]}
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="patient"
                    label="Paciente"
                    rules={[{ required: true, message: 'Por favor, selecciona un paciente!' }]}
                >
                    <Select
                        showSearch
                        placeholder="Seleccionar paciente"
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                        }
                    >
                        {patients.map(patient => (
                            <Option key={patient.id} value={patient.id}>{`${patient.name} ${patient.lastName}`}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="date"
                    label="Fecha de la Cita"
                    rules={[{ required: true, message: 'Por favor, selecciona la fecha de la cita!' }]}
                >
                    <DatePicker onChange={handleDateChange} style={{ width: '100%' }} disabledDate={(current) => current && current < moment().startOf('day')} />
                </Form.Item>

                <Form.Item
                    name="time"
                    label="Hora de la Cita"
                    rules={[{ required: true, message: 'Por favor, selecciona la hora de la cita!' }]}
                >
                    <Select placeholder="Seleccionar hora" disabled={!selectedDate}>
                        {availableTimes.map(time => (
                            <Option key={time} value={moment(time, 'HH:mm').toISOString()}>{time}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="doctor"
                    label="Doctor"
                    rules={[{ required: true, message: 'Por favor, selecciona un doctor!' }]}
                >
                    <Select placeholder="Seleccionar doctor" disabled={doctors.length === 1}>
                        {doctorOptions.map(option => (
                            <Option key={option.value} value={option.value}>{option.label}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="specialty"
                    label="Especialidad"
                    rules={[{ required: true, message: 'Por favor, selecciona la especialidad!' }]}
                >
                    <Select placeholder="Seleccionar especialidad">
                        {specialties.map(specialty => (
                            <Option key={specialty.id} value={specialty.id}>{specialty.name}</Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="reason"
                    label="Motivo de la Cita"
                    rules={[{ required: true, message: 'Por favor, ingresa el motivo de la cita!' }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
            </Form>
        </Modal>
    );
};

// Función auxiliar para generar rangos de tiempo
function generateTimeSlots(startTime, endTime, intervalMinutes) {
    const timeSlots = [];
    let currentTime = moment(startTime);
    while (currentTime.isSameOrBefore(endTime)) {
        timeSlots.push(currentTime.format('HH:mm'));
        currentTime.add(intervalMinutes, 'minutes');
    }
    return timeSlots;
}

export default RegisterAppointmentModal;