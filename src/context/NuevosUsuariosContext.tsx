"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, getUserMessage, isRateLimit } from "@/lib/apiClient";
import { ApiResponse } from "@/types/types";
import {
  conJitter,
  esperaPorRateLimit,
  INTERVALO_MIN_VISIBILIDAD_MS,
} from "@/lib/polling";

// Datos de poco valor a alta frecuencia: 3 min (antes 60 s) para reducir carga por IP.
const INTERVALO_POLLING_MS = 180_000;

type UsuarioNuevo = {
  nombre_completo: { nombre: string; apellido: string };
  imagen_perfil?: { public_id?: string };
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
  // Tras un 429 no se consulta hasta esta marca (Retry-After / RateLimit-Reset).
  const noAntesDeRef = useRef(0);
  const ultimoFetchRef = useRef(0);

  // silent=true: omitir loading/error (usado por polling en segundo plano)
  const fetchUsuarios = useCallback(async (silent = false) => {
    if (Date.now() < noAntesDeRef.current) return;
    ultimoFetchRef.current = Date.now();
    try {
      if (!silent) setLoading(true);
      const data = await apiGet<ApiResponse<{ nuevosUsuariosRegistrados: UsuarioNuevo[] }>>(
        fetchWithAuth,
        "/api/usuarios/registrados/nuevos-usuarios-registrados"
      );
      setUsuarios(data.data.nuevosUsuariosRegistrados || []);
    } catch (err) {
      if (isRateLimit(err)) {
        noAntesDeRef.current = Date.now() + esperaPorRateLimit(err);
      }
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
        u._id === user._id && u.imagen_perfil?.public_id !== user.imagen_perfil?.public_id
          ? { ...u, imagen_perfil: { public_id: user.imagen_perfil?.public_id } }
          : u
      )
    );
  }, [user?.imagen_perfil?.public_id, user?._id]);

  // Polling cada 3 min (con jitter) para detectar cambios de otros usuarios entre sesiones/navegadores.
  // Se pausa cuando la pestaña no está visible (ahorra requests).
  // Al volver a la pestaña, hace un fetch inmediato (si el último tiene más de
  // INTERVALO_MIN_VISIBILIDAD_MS) y reinicia el intervalo.
  useEffect(() => {
    if (!user || authLoading) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const startPolling = () => {
      if (intervalId === undefined) {
        intervalId = setInterval(() => fetchUsuarios(true), conJitter(INTERVALO_POLLING_MS));
      }
    };

    const stopPolling = () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (Date.now() - ultimoFetchRef.current >= INTERVALO_MIN_VISIBILIDAD_MS) {
          fetchUsuarios(true);
        }
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