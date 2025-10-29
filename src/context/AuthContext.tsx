'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { UsuarioLogueado, IAuthContext } from '@/types/types';

// Creamos el contexto de autenticación
const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogueado | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Función para renovar el accessToken usando refreshToken
   */
  const refreshToken = async (): Promise<boolean> => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`,
        { method: 'POST', credentials: 'include' }
      );
      return res.ok;
    } catch (err) {
      console.error('Error al refrescar token:', err);
      return false;
    }
  };

  /**
   * Helper para llamadas protegidas que maneja 401 automáticamente
   */
  const fetchWithAuth = async (input: RequestInfo, init?: RequestInit) => {
    let res = await fetch(input, { ...init, credentials: 'include' });

    if (res.status === 401) {
      // Token expirado, intentamos renovar
      const refreshed = await refreshToken();
      if (refreshed) {
        // Reintentamos la petición original
        res = await fetch(input, { ...init, credentials: 'include' });
      } else {
        // No se pudo renovar, cerramos sesión
        setUser(null);
      }
    }

    return res;
  };

  /**
   * Función para login manual
   */
  const login = (user: UsuarioLogueado) => {
    setUser(user);
  };

  /**
   * 🔄 Nueva función: actualizar parcialmente el usuario global
   * Permite cambiar solo ciertos campos sin afectar todo el estado
   */
  const updateUser = (newData: Partial<UsuarioLogueado>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : prev));
  };

  /**
   * Función de logout
   */
  const logout = async () => {
    try {
      // Petición normal al endpoint de logout
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      // Borramos el estado del usuario en el frontend
      setUser(null);
    }
  };

  /**
   * useEffect para recuperar sesión al montar el provider
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.usuario);
          return;
        }

        if (res.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            const retry = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
              credentials: 'include',
            });
            if (retry.ok) {
              const data = await retry.json();
              setUser(data.usuario);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.error('Error recuperando sesión:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // sin dependencias

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fetchWithAuth,
        updateUser, // ✅ agregamos aquí
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar autenticación
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};
