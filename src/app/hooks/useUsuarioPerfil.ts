'use client';

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioPerfil, ApiResponse } from "@/types/types";
import { apiGet, isNotFound, isValidationFailed, getUserMessage } from "@/lib/apiClient";

export function useUsuarioPerfil(url: string | undefined) {
  const { fetchWithAuth } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundError, setIsNotFoundError] = useState(false);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!url) return;

    const fetchUsuario = async () => {
      setLoading(true);
      setIsNotFoundError(false);
      try {
        const data = await apiGet<ApiResponse<{ usuario: UsuarioPerfil }>>(
          fetchWithAuth,
          `/api/usuarios/${url}`
        );
        setUsuario(data.data.usuario);
        setError(null);
      } catch (err) {
        // Un ID/URL mal formado (VALIDATION_FAILED) es semánticamente equivalente
        // a "no encontrado" desde la perspectiva del usuario: el perfil no existe
        // o no es accesible, por lo que mostramos la página 404 en ambos casos.
        const notFound = isNotFound(err) || isValidationFailed(err);
        setIsNotFoundError(notFound);

        if (notFound) {
          console.warn("Perfil de usuario no encontrado:", url);
          setError("El perfil de usuario no fue encontrado.");
        } else {
          const msg = getUserMessage(err, 'cargar_perfil');
          console.error(msg, err);
          setError(msg);
        }

        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [url, fetchWithAuth]);

  return { usuario, loading, error, isNotFoundError, clearError, setUsuario };
}
