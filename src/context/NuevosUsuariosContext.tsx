"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

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
  reload: () => void;
};

const NuevosUsuariosContext = createContext<NuevosUsuariosContextType | undefined>(undefined);

export function NuevosUsuariosProvider({ children }: { children: React.ReactNode }) {
  const [usuarios, setUsuarios] = useState<UsuarioNuevo[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchWithAuth } = useAuth();

  const hasFetched = useRef(false); // 👈 evita el re-fetch

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/registrados/nuevos-usuarios-registrados`
      );
      const data = await res.json();
      setUsuarios(data.nuevosUsuariosRegistrados || []);
    } catch (err) {
      console.error("Error al cargar nuevos usuarios:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 👈 Solo la primera vez en toda la vida del provider
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchUsuarios();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 👈 NO depende de nada, sin warnings

  return (
    <NuevosUsuariosContext.Provider value={{ usuarios, loading, reload: fetchUsuarios }}>
      {children}
    </NuevosUsuariosContext.Provider>
  );
}

export function useNuevosUsuarios() {
  const ctx = useContext(NuevosUsuariosContext);
  if (!ctx) throw new Error("useNuevosUsuarios debe usarse dentro de NuevosUsuariosProvider");
  return ctx;
}
