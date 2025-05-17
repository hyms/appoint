'use client'
import {useAuth} from './lib/app'
import '@ant-design/v5-patch-for-react-19';
export default function Home() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <div>¡Usuario autenticado!</div>;
  } else {
    return <div>Por favor, inicia sesión.</div>;
  }
}
