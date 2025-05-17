'use client';

import React, {useState} from 'react';
import {Layout, Menu, Button, Drawer} from 'antd';
import {
    HomeOutlined,
    UserOutlined,
    CalendarOutlined,
    LogoutOutlined,
    MenuOutlined,
    AppstoreOutlined
} from '@ant-design/icons';
import '@ant-design/v5-patch-for-react-19';
import {useRouter} from 'next/navigation';
import Link from 'next/link';
import {useAuth} from '../lib/useAuth'; // Asegúrate de la ruta correcta

const { Header, Content, Footer, Sider } = Layout;
const AppLayout = ({children}) => {
    const { user, logout } = useAuth();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [openDrawer, setOpenDrawer] = useState(false);

    const showDrawer = () => {
        setOpenDrawer(true);
    };

    const onCloseDrawer = () => {
        setOpenDrawer(false);
    };

    const handleLogout = () => {
        logout(true);
        onCloseDrawer();
    };


    const menuItems = [
        {
            key: '/dashboard',
            icon: <HomeOutlined/>,
            label: <Link href="/">Dashboard</Link>,
        },
        ...(user?.role === 'administrador'
                ? [
                    {
                        key: '/admin/users',
                        icon: <UserOutlined/>,
                        label: <Link href="/admin/users">Usuarios</Link>,
                    },
                ]
                : []
        ),
        ...(user?.role === 'secretaria'
                ? [
                    {
                        key: '/appointments',
                        icon: <CalendarOutlined/>,
                        label: <Link href="/appointments">Citas</Link>,
                    },
                ]
                : []
        ),
        ...(user?.role === 'medico'
                ? [
                    {
                        key: '/patients',
                        icon: <UserOutlined/>,
                        label: <Link href="/patients">Pacientes</Link>,
                    },
                ]
                : []
        ),
        // {
        //     key: 'sub2',
        //     label: 'Navigation Two',
        //     icon: <AppstoreOutlined />,
        //     children: [
        //         { key: '5', label: 'Option 5' },
        //         { key: '6', label: 'Option 6' },
        //         {
        //             key: 'sub3',
        //             label: 'Submenu',
        //             icon: <SubmenuOutlined />,
        //             children: [
        //                 { key: '7', label: 'Option 7' },
        //                 { key: '8', label: 'Option 8' },
        //             ],
        //         },
        //     ],
        // },
        {
            key: 'logout-mobile',
            icon: <LogoutOutlined/>,
            label: 'Cerrar Sesión',
            onClick: handleLogout,
            className: 'mobile-only',
        },
    ];
    return (
        <Layout style={{minHeight: '100vh'}}>
            <Sider collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}  collapsedWidth="0" breakpoint="lg">
                <div
                    style={{
                        height: 32,
                        margin: 16,
                        background: 'rgba(255, 255, 255, 0.2)',
                    }}
                />
                <Menu theme="dark" defaultSelectedKeys={[router.pathname === '/' ? '/' : router.pathname]}
                      mode="inline" items={menuItems}/>
            </Sider>
            <Layout className="site-layout">
                {/*<Header*/}
                {/*    className="site-layout-background"*/}
                {/*    style={{*/}
                {/*        padding: '0 16px',*/}
                {/*        display: 'flex',*/}
                {/*        justifyContent: 'space-between',*/}
                {/*        alignItems: 'center',*/}
                {/*    }}*/}
                {/*>*/}
                {/*    <Button*/}
                {/*        type="text"*/}
                {/*        icon={<MenuOutlined/>}*/}
                {/*        onClick={() => setCollapsed(!collapsed)}*/}
                {/*        style={{marginRight: 16}}*/}
                {/*    />*/}
                {/*    <Button icon={<LogoutOutlined/>} onClick={handleLogout} >*/}
                {/*        Cerrar Sesión*/}
                {/*    </Button>*/}
                {/*</Header>*/}
                <Content>
                    {children}
                </Content>
                <Footer style={{ textAlign: 'center' }}>
                    ©{new Date().getFullYear()} Created by copito
                </Footer>
            </Layout>
        </Layout>
    );
};

export default AppLayout;