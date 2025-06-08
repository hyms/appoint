import React, { useState, useEffect } from 'react';
import { Typography, Table, Button, message } from 'antd';
import { useApi } from '@/hooks/useApi';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title } = Typography;

const PatientsReport = () => {
  const { get, loading } = useApi();
  const [patientsReportData, setPatientsReportData] = useState([]);

  useEffect(() => {
    fetchPatientsReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPatientsReport = async () => {
    try {
      const data = await get('/api/reports/patients'); // Reemplaza con tu endpoint de reporte de pacientes
      setPatientsReportData(data);
    } catch (error) {
      console.error('Error fetching patients report:', error);
      message.error('Error al cargar el reporte de pacientes.');
    }
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['ID', 'Nombre Completo', 'Citas Totales', 'Citas Canceladas', 'Citas Realizadas', 'Deuda Total (BOB)'], // Cabecera
      ...patientsReportData.map(p => [p.id, `${p.name} ${p.lastName}`, p.totalAppointments, p.cancelledAppointments, p.completedAppointments, p.totalDebt]),
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte de Pacientes');
    XLSX.writeFile(wb, 'reporte_pacientes.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text('Reporte de Pacientes', 10, 10);
    doc.autoTable({
      head: [['ID', 'Nombre Completo', 'Citas Totales', 'Citas Canceladas', 'Citas Realizadas', 'Deuda Total (BOB)']],
      body: patientsReportData.map(p => [p.id, `${p.name} ${p.lastName}`, p.totalAppointments, p.cancelledAppointments, p.completedAppointments, p.totalDebt]),
    });
    doc.save('reporte_pacientes.pdf');
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Nombre Completo', render: (record) => `${record.name} ${record.lastName}`, key: 'name' },
    { title: 'Citas Totales', dataIndex: 'totalAppointments', key: 'totalAppointments' },
    { title: 'Citas Canceladas', dataIndex: 'cancelledAppointments', key: 'cancelledAppointments' },
    { title: 'Citas Realizadas', dataIndex: 'completedAppointments', key: 'completedAppointments' },
    { title: 'Deuda Total (BOB)', dataIndex: 'totalDebt', key: 'totalDebt' },
  ];

  return (
    <div>
      <Title level={2}>Reporte de Pacientes</Title>
      <div style={{ marginBottom: 16 }}>
        <Button onClick={exportToExcel} style={{ marginRight: 8 }}>Exportar a Excel</Button>
        <Button onClick={exportToPDF}>Exportar a PDF</Button>
      </div>
      <Table dataSource={patientsReportData} columns={columns} loading={loading} rowKey="id" />
    </div>
  );
};

export default PatientsReport;