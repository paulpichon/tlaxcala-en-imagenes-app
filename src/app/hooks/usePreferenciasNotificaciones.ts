import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiGet, apiPut, getUserMessage, isNotFound } from "@/lib/apiClient";
import type {
  ApiResponse,
  CanalNotificacion,
  PreferenciasNotificaciones,
} from "@/types/types";

type RespuestaPreferencias = ApiResponse<{ preferencias: PreferenciasNotificaciones }>;

/**
 * Preferencias de notificaciones por tipo y canal (Fase 4 del backend):
 * `GET /api/notificaciones/preferencias` al montar y `PUT` parcial por cada
 * interruptor. Sin polling.
 *
 * - `disponible` es `false` si el backend aún no tiene la Fase 4 (`404`): la
 *   pantalla oculta la sección en lugar de mostrar un error.
 * - El cambio es optimista; si el `PUT` falla se revierte esa clave.
 * - Solo hay un `PUT` en curso a la vez (`guardando`): cada respuesta trae las
 *   preferencias completas, y dos en paralelo podrían llegar desordenadas y
 *   revertir visualmente el otro cambio.
 */
export function usePreferenciasNotificaciones() {
  const { user, fetchWithAuth } = useAuth();
  const [preferencias, setPreferencias] = useState<PreferenciasNotificaciones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [disponible, setDisponible] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRef = useRef(fetchWithAuth);
  fetchRef.current = fetchWithAuth;
  const enCursoRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelado = false;

    (async () => {
      try {
        const resp = await apiGet<RespuestaPreferencias>(
          fetchRef.current,
          "/api/notificaciones/preferencias"
        );
        if (cancelado) return;
        setPreferencias(resp.data?.preferencias ?? null);
        setDisponible(true);
        setError(null);
      } catch (err) {
        if (cancelado) return;
        if (isNotFound(err)) {
          setDisponible(false);
        } else {
          console.warn("No se pudieron cargar las preferencias de notificaciones:", err);
          setError(getUserMessage(err, "cargar_preferencias"));
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [user]);

  /**
   * Cambia un interruptor. Devuelve `true` si el backend lo guardó.
   */
  const cambiarPreferencia = useCallback(
    async <C extends CanalNotificacion>(
      canal: C,
      tipo: keyof PreferenciasNotificaciones[C],
      valor: boolean
    ): Promise<boolean> => {
      if (enCursoRef.current || !preferencias) return false;

      const anterior = preferencias[canal][tipo] as boolean;
      enCursoRef.current = true;
      setGuardando(true);
      setError(null);
      setPreferencias((prev) =>
        prev ? { ...prev, [canal]: { ...prev[canal], [tipo]: valor } } : prev
      );

      try {
        const resp = await apiPut<RespuestaPreferencias>(
          fetchRef.current,
          "/api/notificaciones/preferencias",
          { [canal]: { [tipo]: valor } }
        );
        if (resp.data?.preferencias) setPreferencias(resp.data.preferencias);
        return true;
      } catch (err) {
        console.warn("No se pudo guardar la preferencia de notificaciones:", err);
        setPreferencias((prev) =>
          prev ? { ...prev, [canal]: { ...prev[canal], [tipo]: anterior } } : prev
        );
        setError(getUserMessage(err, "guardar_preferencias"));
        return false;
      } finally {
        enCursoRef.current = false;
        setGuardando(false);
      }
    },
    [preferencias]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    preferencias,
    cargando,
    disponible,
    guardando,
    error,
    clearError,
    cambiarPreferencia,
  };
}
