import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title } = Typography;

const SystemReport = () => {
    const { get, loading } = useApi();
    const [systemReportData, setSystemReportData] = useState({});

    useEffect(() => {
        fetchSystemReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchSystemReport = async () => {
        try {
            const data = await get('/api/reports/system'); // Reemplaza con tu endpoint de reporte del sistema
            setSystemReportData(data);
        } catch (error) {
            console.error('Error fetching system report:', error);
            message.error('Error al cargar el reporte del sistema.');
        }
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Pacientes', 'Doctores', 'Notificaciones Enviadas', 'Usuarios'], // Cabecera
            [systemReportData.totalPatients, systemReportData.totalDoctors, systemReportData.totalNotifications, systemReportData.totalUsers],
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte del Sistema');
        XLSX.writeFile(wb, 'reporte_sistema.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte del Sistema', 10, 10);
        doc.autoTable({
            head: [['Pacientes', 'Doctores', 'Notificaciones Enviadas', 'Usuarios']],
            body: [[systemReportData.totalPatients, systemReportData.totalDoctors, systemReportData.totalNotifications, systemReportData.totalUsers]],
        });
        doc.save('reporte_sistema.pdf');
    };

    const columns = [
        { title: 'Pacientes', dataIndex: 'totalPatients', key: 'totalPatients' },
        { title: 'Doctores', dataIndex: 'totalDoctors', key: 'totalDoctors' },
        { title: 'Notificaciones Enviadas', dataIndex: 'totalNotifications', key: 'totalNotifications' },
        { title: 'Usuarios', dataIndex: 'totalUsers', key: 'totalUsers' },
    ];

    const dataSource = [systemReportData]; // Para que Table funcione con un objeto

    return (
        <div>
            <Title level={2}>Reporte del Sistema</Title>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={exportToExcel} style={{ marginRight: 8 }}>Exportar a Excel</Button>
                <Button onClick={exportToPDF}>Exportar a PDF</Button>
            </div>
            <Table dataSource={dataSource} columns={columns} loading={loading} rowKey="totalPatients" /> {/* Usamos una clave única */}
        </div>
    );
};

export default SystemReport;