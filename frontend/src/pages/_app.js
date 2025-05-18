import {useEffect, useState} from "react";
import {useRouter} from "next/router";
import {AuthProvider} from "@/hooks/useAuth";
import {Spin} from "antd";

function MyApp({Component, pageProps}) {
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

        return () => {
            router.events.off('routeChangeStart', handleRouteChangeStart);
            router.events.off('routeChangeComplete', handleRouteChangeComplete);
            router.events.off('routeChangeError', handleRouteChangeError);
        };
    }, [router]);

    return (
        <AuthProvider>
            <Spin spinning={loading} fullscreen/>
            <Component {...pageProps} />
        </AuthProvider>
    );
}

export default MyApp;