'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioPerfil } from "@/types/types";
import { apiGet, getUserMessage } from "@/lib/apiClient";

export function useUsuarioPerfil(url: string | undefined) {
  const { fetchWithAuth } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!url) return;

    const fetchUsuario = async () => {
      setLoading(true);
      try {
        const data = await apiGet<{ usuario: UsuarioPerfil }>(
          fetchWithAuth,
          `/api/usuarios/${url}`
        );
        setUsuario(data.usuario);
        setError(null);
      } catch (err) {
        const msg = getUserMessage(err, 'cargar_perfil');
        console.error(msg, err);
        setError(msg);
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [url, fetchWithAuth]);

  return { usuario, loading, error, clearError, setUsuario };
}
