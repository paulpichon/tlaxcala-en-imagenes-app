"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, getUserMessage } from "@/lib/apiClient";
import { ApiResponse } from "@/types/types";

type UsuarioNuevo = {
  nombre_completo: { nombre: string; apellido: string };
  imagen_perfil: { secure_url: string };
  url: string;
  _id: string;
  isFollowing: boolean;
};

type NuevosUsuariosContextType = {
  usuarios: UsuarioNuevo[];
  loading: boolean;
  error: string | null;
  clearError: () => void;
  reload: () => void;
};

const NuevosUsuariosContext = createContext<NuevosUsuariosContextType | undefined>(undefined);

export function NuevosUsuariosProvider({ children }: { children: React.ReactNode }) {
  const [usuarios, setUsuarios] = useState<UsuarioNuevo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clearError = useCallback(() => setError(null), []);
  const { fetchWithAuth, user, loading: authLoading } = useAuth();

  // silent=true: omitir loading/error (usado por polling en segundo plano)
  const fetchUsuarios = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await apiGet<ApiResponse<{ nuevosUsuariosRegistrados: UsuarioNuevo[] }>>(
        fetchWithAuth,
        "/api/usuarios/registrados/nuevos-usuarios-registrados"
      );
      setUsuarios(data.data.nuevosUsuariosRegistrados || []);
    } catch (err) {
      if (!silent) {
        const msg = getUserMessage(err, 'cargar_perfil');
        console.error(msg, err);
        setError(msg);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      fetchUsuarios();
    } else {
      setUsuarios([]);
    }
  }, [user?._id, authLoading]);

  // Sincronizar imagen del usuario logueado con la lista (cambios en la misma sesión)
  useEffect(() => {
    if (!user || !usuarios.length) return;
    setUsuarios(prev =>
      prev.map(u =>
        u._id === user._id && u.imagen_perfil.secure_url !== user.imagen_perfil?.secure_url
          ? { ...u, imagen_perfil: { secure_url: user.imagen_perfil!.secure_url } }
          : u
      )
    );
  }, [user?.imagen_perfil?.secure_url, user?._id]);

  // Polling cada 60s para detectar cambios de otros usuarios entre sesiones/navegadores.
  // Se pausa cuando la pestaña no está visible (ahorra requests).
  // Al volver a la pestaña, hace un fetch inmediato y reinicia el intervalo.
  useEffect(() => {
    if (!user || authLoading) return;

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      intervalId = setInterval(() => fetchUsuarios(true), 60000);
    };

    const stopPolling = () => {
      clearInterval(intervalId);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUsuarios(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (document.visibilityState === 'visible') startPolling();

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, authLoading, fetchUsuarios]);

  return (
    <NuevosUsuariosContext.Provider value={{ usuarios, loading, error, clearError, reload: fetchUsuarios }}>
      {children}
    </NuevosUsuariosContext.Provider>
  );
}

export function useNuevosUsuarios() {
  const ctx = useContext(NuevosUsuariosContext);
  if (!ctx) throw new Error("useNuevosUsuarios debe usarse dentro de NuevosUsuariosProvider");
  return ctx;
}