"use client";

// Importaciones de React
import { createContext, useContext, useEffect, useState, useCallback } from "react";

// Hook de autenticación (para saber si hay usuario y hacer requests autenticados)
import { useAuth } from "@/context/AuthContext";

// Tipo que define la estructura de un usuario sugerido
type UsuarioNuevo = {
  nombre_completo: { nombre: string; apellido: string }; // Nombre y apellido del usuario
  imagen_perfil: { secure_url: string }; // URL de la imagen de perfil
  url: string; // Username o URL única del usuario
  _id: string; // ID del usuario en la base de datos
  isFollowing: boolean; // Indica si el usuario logueado lo sigue o no
};

// Tipo del contexto: lo que se va a exponer a los componentes
type NuevosUsuariosContextType = {
  usuarios: UsuarioNuevo[]; // Lista de usuarios nuevos
  loading: boolean; // Estado de carga
  reload: () => void; // Función para recargar los usuarios manualmente
};

// Creación del contexto (inicialmente undefined)
const NuevosUsuariosContext = createContext<NuevosUsuariosContextType | undefined>(undefined);

// Provider que envuelve los componentes que necesitan acceso a este contexto
export function NuevosUsuariosProvider({ children }: { children: React.ReactNode }) {

  // Estado que guarda la lista de usuarios nuevos
  const [usuarios, setUsuarios] = useState<UsuarioNuevo[]>([]);

  // Estado para saber si se está cargando la información
  const [loading, setLoading] = useState(false);

  // Se obtiene fetchWithAuth (para peticiones autenticadas),
  // user (usuario actual) y authLoading (estado de carga del auth)
  const { fetchWithAuth, user, loading: authLoading } = useAuth();

  // Función para obtener los usuarios nuevos desde el backend
  const fetchUsuarios = useCallback(async () => {
    try {
      setLoading(true); // Inicia el estado de carga

      // Petición al endpoint
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/registrados/nuevos-usuarios-registrados`
      );

      // Se parsea la respuesta
      const data = await res.json();

      // Se guardan los usuarios en el estado (fallback a array vacío)
      setUsuarios(data.nuevosUsuariosRegistrados || []);
    } catch (err) {
      // Manejo de errores
      console.error("Error al cargar nuevos usuarios:", err);
    } finally {
      // Finaliza el estado de carga
      setLoading(false);
    }
  }, [fetchWithAuth]); // Dependencia: si cambia fetchWithAuth, se recrea la función

  // useEffect para cargar los usuarios cuando:
  // - termine de cargar el contexto de auth
  // - cambie el usuario logueado
  useEffect(() => {

    // Si aún se está inicializando el AuthContext, no hacer nada
    if (authLoading) return;

    if (user) {
      // Si hay usuario logueado → obtener usuarios nuevos
      fetchUsuarios();
    } else {
      // Si no hay usuario → limpiar lista
      setUsuarios([]);
    }

  }, [user?._id, authLoading]); // Dependencias: ID del usuario y estado de auth

  // Se proveen los valores del contexto a los componentes hijos
  return (
    <NuevosUsuariosContext.Provider value={{ usuarios, loading, reload: fetchUsuarios }}>
      {children}
    </NuevosUsuariosContext.Provider>
  );
}

// Hook personalizado para consumir el contexto fácilmente
export function useNuevosUsuarios() {

  const ctx = useContext(NuevosUsuariosContext);

  // Si se usa fuera del Provider, lanzar error para evitar bugs
  if (!ctx) throw new Error("useNuevosUsuarios debe usarse dentro de NuevosUsuariosProvider");

  return ctx;
}