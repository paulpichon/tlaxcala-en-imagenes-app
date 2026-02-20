'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
// Spinner de carga
import Spinner from '@/app/components/spinner';
// Bootstrap
import "bootstrap/dist/css/bootstrap.css";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Solo redirige si ya terminó de cargar y no hay usuario
    if (!loading && !user) {
      router.push('/cuentas/login');
    }
  }, [user, loading, router]);

  // Puedes mostrar una pantalla de carga mientras se verifica
  if (loading || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}