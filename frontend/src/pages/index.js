'use client';

import React from 'react';
import { Layout, Typography, Row, Col, Card, Button } from 'antd';
import { CalendarOutlined, UserAddOutlined, ScheduleOutlined, BellOutlined,SettingOutlined } from '@ant-design/icons';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/AppLayout';

const { Content } = Layout;
const { Title } = Typography;

const WelcomePage = () => {
    const { user } = useAuth(); //for roles

    return (
        <AppLayout>
        <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
            <div style={{ padding: 24, textAlign: 'left' }}>
                <Title level={2}>¡Bienvenido/a!</Title>
                <Title level={4} style={{ marginBottom: 24 }}>Resumen de hoy</Title>

                <Row gutter={24}>
                    {user?.role === 'secretaria' && (
                        <>
                            <Col span={8}>
                                <Card title="Citas para Hoy" icon={<CalendarOutlined />} variant="borderless">
                                    {/* Aquí iría la lógica para obtener y mostrar el número de citas */}
                                    <p>15 Citas Programadas</p>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Citas por Confirmar" icon={<ScheduleOutlined />} variant="borderless">
                                    {/* Aquí iría la lógica para obtener y mostrar el número de citas por confirmar */}
                                    <p>3 Citas Pendientes</p>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Nuevos Pacientes" icon={<UserAddOutlined />} variant="borderless">
                                    {/* Aquí iría la lógica para obtener y mostrar el número de nuevos pacientes */}
                                    <p>2 Pacientes Nuevos</p>
                                </Card>
                            </Col>
                        </>
                    )}

                    {user?.role === 'medico' && (
                        <>
                            <Col span={12}>
                                <Card title="Tu Calendario de Hoy" icon={<CalendarOutlined />} variant="borderless">
                                    {/* Aquí iría la lógica para mostrar un calendario resumido o lista de citas */}
                                    <ul>
                                        <li>09:00 - Paciente A</li>
                                        <li>10:30 - Paciente B</li>
                                        {/* ... más citas */}
                                    </ul>
                                </Card>
                            </Col>
                            <Col span={12}>
                                <Card title="Pacientes por Atender" icon={<UserAddOutlined />} variant="borderless">
                                    {/* Aquí iría la lógica para mostrar la lista de pacientes pendientes */}
                                    <ul>
                                        <li>Paciente C</li>
                                        <li>Paciente D</li>
                                        {/* ... más pacientes */}
                                    </ul>
                                </Card>
                            </Col>
                        </>
                    )}

                    {user?.role === 'administrador' && (
                        <>
                            <Col span={8}>
                                <Card title="Nuevas Reservas Hoy" icon={<CalendarOutlined />} variant="borderless">
                                    <p>25 Reservas</p>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Cancelaciones Hoy" icon={<ScheduleOutlined />} variant="borderless">
                                    <p>5 Cancelaciones</p>
                                </Card>
                            </Col>
                            <Col span={8}>
                                <Card title="Usuarios Activos" icon={<UserAddOutlined />} variant="borderless">
                                    <p>10 Usuarios</p>
                                </Card>
                            </Col>
                        </>
                    )}
                </Row>

                <div style={{ marginTop: 32 }}>
                    <Title level={4}>Acciones Rápidas</Title>
                    {user?.role === 'secretaria' && (
                        <>
                            <Button type="primary" icon={<CalendarOutlined />} style={{ marginRight: 16 }}>
                                Crear Nueva Cita
                            </Button>
                            <Button icon={<UserAddOutlined />} style={{ marginRight: 16 }}>
                                Registrar Paciente
                            </Button>
                            {/* ... más acciones */}
                        </>
                    )}

                    {user?.role === 'medico' && (
                        <>
                            <Button type="primary" icon={<ScheduleOutlined />} style={{ marginRight: 16 }}>
                                Ver Calendario Completo
                            </Button>
                            <Button icon={<UserAddOutlined />} style={{ marginRight: 16 }}>
                                Ver Historial de Pacientes
                            </Button>
                            {/* ... más acciones */}
                        </>
                    )}

                    {user?.role === 'administrador' && (
                        <>
                            <Button type="primary" icon={<UserAddOutlined />} style={{ marginRight: 16 }}>
                                Gestionar Usuarios
                            </Button>
                            <Button icon={<SettingOutlined />} style={{ marginRight: 16 }}>
                                Configuración del Sistema
                            </Button>
                            {/* ... más acciones */}
                        </>
                    )}
                </div>

                <div style={{ marginTop: 32 }}>
                    <Title level={4}>Notificaciones</Title>
                    <Card icon={<BellOutlined />}>
                        {/* Aquí irían las notificaciones */}
                        <p>No hay notificaciones pendientes.</p>
                    </Card>
                </div>
            </div>
        </Content>
        </AppLayout>
    );
};

export default WelcomePage;