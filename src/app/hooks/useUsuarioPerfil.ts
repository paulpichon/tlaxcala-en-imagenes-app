'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioPerfil, ApiResponse } from "@/types/types";
import { apiGet, isNotFound, isValidationFailed, getUserMessage } from "@/lib/apiClient";

interface SoftRedirect {
  urlActual: string;
  redirect: "permanent";
}

export function useUsuarioPerfil(url: string | undefined) {
  const { fetchWithAuth } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFoundError, setIsNotFoundError] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  const redirectedRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);
  const clearRedirectMessage = useCallback(() => setRedirectMessage(null), []);

  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    const fetchUsuario = async (currentUrl: string) => {
      setLoading(true);
      setIsNotFoundError(false);
      setRedirectMessage(null);
      try {
        const data = await apiGet<ApiResponse<{ usuario: UsuarioPerfil } | SoftRedirect>>(
          fetchWithAuth,
          `/api/usuarios/${currentUrl}`
        );

        const payload = data.data as { usuario?: UsuarioPerfil; redirect?: string; urlActual?: string };

        if (payload.redirect === "permanent" && payload.urlActual && !redirectedRef.current) {
          redirectedRef.current = true;
          setRedirectMessage("Esta URL ha cambiado, te redirigimos al perfil actual.");
          window.history.replaceState(null, "", `/${payload.urlActual}`);
          return fetchUsuario(payload.urlActual);
        }

        if (cancelled) return;

        if (payload.usuario) {
          setUsuario(payload.usuario);
          setError(null);
        } else {
          setUsuario(null);
          setIsNotFoundError(true);
          setError("El perfil de usuario no fue encontrado.");
        }
      } catch (err) {
        if (cancelled) return;

        const notFound = isNotFound(err) || isValidationFailed(err);
        setIsNotFoundError(notFound);

        if (notFound) {
          console.warn("Perfil de usuario no encontrado:", currentUrl);
          setError("El perfil de usuario no fue encontrado.");
        } else {
          const msg = getUserMessage(err, 'cargar_perfil');
          console.error(msg, err);
          setError(msg);
        }

        setRedirectMessage(null);
        setUsuario(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    redirectedRef.current = false;
    fetchUsuario(url);

    return () => {
      cancelled = true;
    };
  }, [url, fetchWithAuth]);

  return { usuario, loading, error, isNotFoundError, redirectMessage, clearError, clearRedirectMessage, setUsuario };
}
