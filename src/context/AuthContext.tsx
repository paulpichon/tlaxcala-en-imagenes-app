'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { UsuarioLogueado, IAuthContext, ApiResponse } from '@/types/types';
import { apiPost, apiGet, isApiError } from '@/lib/apiClient';

const AuthContext = createContext<IAuthContext | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UsuarioLogueado | null>(null);
  const [loading, setLoading] = useState(true);

  const isRefreshing = useRef(false);
  const refreshPromise = useRef<Promise<boolean> | null>(null);

  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (isRefreshing.current && refreshPromise.current) {
      return refreshPromise.current;
    }

    isRefreshing.current = true;

    refreshPromise.current = (async () => {
      try {
        await apiPost(fetch, '/api/auth/refresh');
        return true;
      } catch {
        return false;
      } finally {
        isRefreshing.current = false;
      }
    })();

    return refreshPromise.current;
  }, []);

  const fetchWithAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const doFetch = () => fetch(input, { ...init, credentials: 'include' });

      for (let attempt = 0; attempt <= 2; attempt++) {
        try {
          let response = await doFetch();

          if (response.status === 401) {
            const refreshed = await refreshToken();

            if (refreshed) {
              response = await doFetch();
            } else {
              setUser(null);
            }
          }

          return response;
        } catch (err) {
          if (attempt === 2) throw err;
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }

      throw new Error('fetchWithAuth falló después de reintentos');
    },
    [refreshToken]
  );

  const login = useCallback((user: UsuarioLogueado) => {
    setUser(user);
    localStorage.removeItem('lastPasswordRequest');
    localStorage.removeItem('bloqueoReenvioCorreo');
    sessionStorage.removeItem('passForgetToken');
    sessionStorage.removeItem('registroToken');
  }, []);

  const updateUser = useCallback((newData: Partial<UsuarioLogueado>) => {
    setUser((prev) => (prev ? { ...prev, ...newData } : prev));
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost(fetch, '/api/auth/logout');
    } catch {
    } finally {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const data = await apiGet<ApiResponse<{ usuario: UsuarioLogueado }>>(fetch, '/api/auth/me');
        setUser(data.data.usuario);
      } catch (err) {
        if (isApiError(err) && err.status === 401) {
          const refreshed = await refreshToken();
          if (refreshed) {
            try {
              const data = await apiGet<ApiResponse<{ usuario: UsuarioLogueado }>>(fetch, '/api/auth/me');
              setUser(data.data.usuario);
              return;
            } catch {}
          }
        }
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [refreshToken]);

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};
