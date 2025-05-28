'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AlreadyAuthRedirect({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Redirige si ya hay sesión activa
      router.replace('/inicio'); // o la ruta principal de tu app
    }
  }, [user, loading, router]);

  // Mientras verifica, puede mostrar un loader
  if (loading || user) return null;

  return <>{children}</>;
}