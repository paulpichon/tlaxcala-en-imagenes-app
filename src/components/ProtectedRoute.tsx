'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import Spinner from '@/app/components/spinner';
import "bootstrap/dist/css/bootstrap.css";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      // Construimos la URL completa actual
      const fullPath =
        pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

      router.replace(
        `/cuentas/login?redirect=${encodeURIComponent(fullPath)}`
      );
    }
  }, [user, loading, router, pathname, searchParams]);

  if (loading || !user) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
