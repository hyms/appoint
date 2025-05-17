import {useEffect, useState} from "react";
import {useRouter} from "next/navigation";
import {AuthProvider} from "./lib/useAuth";
import {Spin} from "antd";
import AppLayout from "./components/AppLayout";

function MyApp({ Component, pageProps }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleRouteChangeStart = () => {
            setLoading(true);
        };

        const handleRouteChangeComplete = () => {
            setLoading(false);
        };

        const handleRouteChangeError = () => {
            setLoading(false);
        };

        router.events.on('routeChangeStart', handleRouteChangeStart);
        router.events.on('routeChangeComplete', handleRouteChangeComplete);
        router.events.on('routeChangeError', handleRouteChangeError);

        // Limpiar los listeners al desmontar el componente
        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeComplete);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router]);

    return (
        <AuthProvider>
            <Spin spinning={loading} fullscreen />
            <AppLayout>
                <Component {...pageProps} />
            </AppLayout>
        </AuthProvider>
    );
}

export default MyApp;