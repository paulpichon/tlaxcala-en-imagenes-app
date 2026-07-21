"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, getUserMessage } from "@/lib/apiClient";

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

  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiGet<{ nuevosUsuariosRegistrados: UsuarioNuevo[] }>(
        fetchWithAuth,
        "/api/usuarios/registrados/nuevos-usuarios-registrados"
      );
      setUsuarios(data.nuevosUsuariosRegistrados || []);
    } catch (err) {
      const msg = getUserMessage(err, 'cargar_perfil');
      console.error(msg, err);
      setError(msg);
    } finally {
      setLoading(false);
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