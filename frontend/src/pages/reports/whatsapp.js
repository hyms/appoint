import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title } = Typography;

const WhatsAppReport = () => {
    const { get, loading } = useApi();
    const [whatsappReportData, setWhatsappReportData] = useState([]);

    useEffect(() => {
        fetchWhatsappReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchWhatsappReport = async () => {
        try {
            const data = await get('/api/reports/whatsapp'); // Reemplaza con tu endpoint de reporte de WhatsApp
            setWhatsappReportData(data);
        } catch (error) {
            console.error('Error fetching WhatsApp report:', error);
            message.error('Error al cargar el reporte de WhatsApp.');
        }
    };

    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();
        const wsData = [
            ['Fecha', 'Mensajes Enviados', 'Enviados por Cliente'], // Cabecera
            ...whatsappReportData.map(w => [w.date, w.totalMessages, w.messagesPerClient]),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, 'Reporte de WhatsApp');
        XLSX.writeFile(wb, 'reporte_whatsapp.xlsx');
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.text('Reporte de WhatsApp', 10, 10);
        doc.autoTable({
            head: [['Fecha', 'Mensajes Enviados', 'Enviados por Cliente']],
            body: whatsappReportData.map(w => [w.date, w.totalMessages, w.messagesPerClient]),
        });
        doc.save('reporte_whatsapp.pdf');
    };

    const columns = [
        { title: 'Fecha', dataIndex: 'date', key: 'date' },
        { title: 'Mensajes Enviados', dataIndex: 'totalMessages', key: 'totalMessages' },
        { title: 'Enviados por Cliente', dataIndex: 'messagesPerClient', key: 'messagesPerClient' },
    ];

    return (
        <div>
            <Title level={2}>Reporte de WhatsApp</Title>
            <div style={{ marginBottom: 16 }}>
                <Button onClick={exportToExcel} style={{ marginRight: 8 }}>Exportar a Excel</Button>
                <Button onClick={exportToPDF}>Exportar a PDF</Button>
            </div>
            <Table dataSource={whatsappReportData} columns={columns} loading={loading} rowKey="date" />
        </div>
    );
};

export default WhatsAppReport;