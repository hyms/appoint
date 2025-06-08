import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title } = Typography;

const DoctorsReport = () => {
    const { get, loading } = useApi();
    const [doctorsReportData, setDoctorsReportData] = useState([]);

    useEffect(() => {
        fetchDoctorsReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchDoctorsReport = async () => {
        try {
            const data = await get('/api/reports/doctors'); // Reemplaza con tu endpoint de reporte de doctores
            setDoctorsReportData(data);
        } catch (error) {
            console.error('Error fetching doctors report:', error);
            message.error('Error al cargar el reporte de doctores.');
        }
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['ID', 'Nombre', 'Especialidad', 'Citas Atendidas'], // Cabecera
            ...doctorsReportData.map(d => [d.id, d.name, d.specialty, d.appointmentsAttended]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Doctores');
        XLSX.writeFile(wb, 'reporte_doctores.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte de Doctores', 10, 10);
        doc.autoTable({
            head: [['ID', 'Nombre', 'Especialidad', 'Citas Atendidas']],
            body: doctorsReportData.map(d => [d.id, d.name, d.specialty, d.appointmentsAttended]),
        });
        doc.save('reporte_doctores.pdf');
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Nombre', dataIndex: 'name', key: 'name' },
        { title: 'Especialidad', dataIndex: 'specialty', key: 'specialty' },
        { title: 'Citas Atendidas', dataIndex: 'appointmentsAttended', key: 'appointmentsAttended' },
    ];

    return (
        <div>
            <Title level={2}>Reporte de Doctores</Title>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={exportToExcel} style={{ marginRight: 8 }}>Exportar a Excel</Button>
                <Button onClick={exportToPDF}>Exportar a PDF</Button>
            </div>
            <Table dataSource={doctorsReportData} columns={columns} loading={loading} rowKey="id" />
        </div>
    );
};

export default DoctorsReport;