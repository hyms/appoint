import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import moment from 'moment';

const { Title } = Typography;

const AppointmentsReport = () => {
    const { get, loading } = useApi();
    const [appointmentsReportData, setAppointmentsReportData] = useState([]);

    useEffect(() => {
        fetchAppointmentsReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchAppointmentsReport = async () => {
        try {
            const data = await get('/api/reports/appointments'); // Reemplaza con tu endpoint de reporte de citas
            setAppointmentsReportData(data);
        } catch (error) {
            console.error('Error fetching appointments report:', error);
            message.error('Error al cargar el reporte de citas.');
        }
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['ID', 'Paciente', 'Doctor', 'Fecha y Hora', 'Estado'], // Cabecera
            ...appointmentsReportData.map(a => [a.id, `${a.patient.name} ${a.patient.lastName}`, a.doctor.name, moment(a.dateTime).format('YYYY-MM-DD HH:mm'), a.status]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Citas');
        XLSX.writeFile(wb, 'reporte_citas.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte de Citas', 10, 10);
        doc.autoTable({
            head: [['ID', 'Paciente', 'Doctor', 'Fecha y Hora', 'Estado']],
            body: appointmentsReportData.map(a => [a.id, `${a.patient.name} ${a.patient.lastName}`, a.doctor.name, moment(a.dateTime).format('YYYY-MM-DD HH:mm'), a.status]),
        });
        doc.save('reporte_citas.pdf');
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Paciente', render: (record) => `${record.patient.name} ${record.patient.lastName}`, key: 'patient' },
        { title: 'Doctor', dataIndex: 'doctor', render: (record) => record.name, key: 'doctor' },
        { title: 'Fecha y Hora', dataIndex: 'dateTime', key: 'dateTime', render: (dateTime) => moment(dateTime).format('YYYY-MM-DD HH:mm') },
        { title: 'Estado', dataIndex: 'status', key: 'status' },
    ];

    return (
        <div>
            <Title level={2}>Reporte de Citas</Title>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={exportToExcel} style={{ marginRight: 8 }}>Exportar a Excel</Button>
                <Button onClick={exportToPDF}>Exportar a PDF</Button>
            </div>
            <Table dataSource={appointmentsReportData} columns={columns} loading={loading} rowKey="id" />
        </div>
    );
};

export default AppointmentsReport;