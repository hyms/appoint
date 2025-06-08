import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notification } from 'antd';

function OneSignalAlertHandler() {
    const { user } = useAuth();
    const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        async function initializeOneSignalAlerts() {
            if (typeof window !== 'undefined') {
                window.OneSignal = window.OneSignal || [];
                const ONE_SIGNAL_APP_ID = 'YOUR_ONESIGNAL_APP_ID';

                window.OneSignal.push(async function() {
                    await window.OneSignal.init({
                        appId: ONE_SIGNAL_APP_ID,
                        // Otros parámetros de inicialización
                    });

                    // Listener para cuando se recibe una notificación en primer plano
                    window.OneSignal.setNotificationWillShowInForegroundHandler(notification => {
                        console.log('Notificación recibida en primer plano:', notification);
                        // Aquí puedes personalizar cómo mostrar la alerta usando antd Notification
                        api.info({
                            message: notification.notification.title || 'Nueva Notificación',
                            description: notification.notification.body || 'Has recibido una nueva notificación.',
                            placement: 'topRight', // O la ubicación que prefieras
                            duration: 5, // Duración en segundos
                        });
                        notification.complete(); // Llama a complete para que OneSignal sepa que la manejaste
                    });

                    // Listener para cuando el usuario hace clic en una notificación
                    window.OneSignal.setNotificationClickHandler(clickData => {
                        console.log('El usuario hizo clic en la notificación:', clickData);
                        // Aquí puedes manejar la acción al hacer clic (e.g., navegar a una página específica)
                    });

                    // Registro del playerId y envío al backend (como en el ejemplo anterior)
                    window.OneSignal.getUserId().then(async (playerId) => {
                        // ... (tu lógica para registrar el playerId en el backend)
                    });

                    // Establecimiento de etiquetas (como en el ejemplo anterior)
                    if (user?.role) {
                        window.OneSignal.sendTag('role', user.role);
                    }
                });
            }
        }

        initializeOneSignalAlerts();
    }, [user?.role, api]);

    return <>{contextHolder}</>; // Necesario para que las notificaciones de antd se rendericen
}

export default OneSignalAlertHandler;