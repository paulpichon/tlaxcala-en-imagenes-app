'use client';

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { UsuarioPerfil } from "@/types/types";

export function useUsuarioPerfil(url: string | undefined) {
  const { fetchWithAuth } = useAuth();
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) return;

    const fetchUsuario = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(
          `${process.env.NEXT_PUBLIC_API_URL}/api/usuarios/${url}`
        );
        if (!res.ok) throw new Error("Error al obtener usuario");
        const data = await res.json();
        setUsuario(data.usuario);
        setError(null);
      } catch (err) {
        console.error("Error al cargar usuario:", err);
        setError("Error al cargar usuario");
        setUsuario(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [url, fetchWithAuth]);

  return { usuario, loading, error, setUsuario };
}
