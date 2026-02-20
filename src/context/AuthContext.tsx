'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { UsuarioLogueado, IAuthContext } from '@/types/types';

// =========================
// Contexto
// =========================
const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogueado | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Ref para evitar múltiples refresh simultáneos
   */
  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);
  // URL base de la API (Puede venir de env)
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // =========================
  // Refresh Token (con control de concurrencia)
  // =========================
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    isRefreshing.current = true;

    refreshPromise.current = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (!res.ok) return false;

        return true;
      } catch (error) {
        console.error('Error al refrescar token:', error);
        return false;
      } finally {
        isRefreshing.current = false;
      }
    })();

    return refreshPromise.current;
  }, [API_URL]);

  // =========================
  // Fetch protegido inteligente
  // =========================
  const fetchWithAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      let response = await fetch(input, {
        ...init,
        credentials: 'include',
      });

      if (response.status === 401) {
        const refreshed = await refreshToken();

        if (refreshed) {
          response = await fetch(input, {
            ...init,
            credentials: 'include',
          });
        } else {
          setUser(null);
        }
      }

      return response;
    },
    [refreshToken]
  );

  // =========================
  // Login manual
  // =========================
  const login = useCallback((user: UsuarioLogueado) => {
    setUser(user);
  }, []);

  // =========================
  // Actualización parcial de usuario
  // =========================
  const updateUser = useCallback((newData: Partial<UsuarioLogueado>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : prev));
  }, []);

  // =========================
  // Logout
  // =========================
  const logout = useCallback(async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    } finally {
      setUser(null);
    }
  }, [API_URL]);

  // =========================
  // Inicialización de sesión
  // =========================
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        let res = await fetch(`${API_URL}/api/auth/me`, {
          credentials: 'include',
        });

        // Si token expiró, intentamos refresh
        if (res.status === 401) {
          const refreshed = await refreshToken();

          if (refreshed) {
            res = await fetch(`${API_URL}/api/auth/me`, {
              credentials: 'include',
            });
          }
        }

        if (res.ok) {
          const data = await res.json();
          setUser(data.usuario);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error recuperando sesión:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [API_URL, refreshToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        fetchWithAuth,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================
// Hook personalizado
// =========================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
