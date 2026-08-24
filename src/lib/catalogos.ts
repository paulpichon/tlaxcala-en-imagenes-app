// ======================================
// 🗺️ Caché ligera de catálogos INEGI (municipios y localidades)
// ======================================
// - Memoria del tab únicamente (sin localStorage): muere al recargar,
//   imposible servir catálogos obsoletos entre sesiones.
// - Deduplicación de requests en vuelo: varios consumidores simultáneos
//   (p.ej. dos modales montados) comparten una sola petición.
// - La autoridad siempre es el backend: ante un 400 de ubicación al
//   publicar, llamar invalidarCatalogos() y pedir re-selección (spec §4).

import { ApiResponse, Localidad, Municipio } from "@/types/types";
import { apiGet } from "@/lib/apiClient";

export type FetchWithAuthFn = (
  input: RequestInfo,
  init?: RequestInit
) => Promise<Response>;

// ── Municipios (GET /api/municipios, cambia casi nunca) ──

let municipiosCache: Municipio[] | null = null;
let municipiosInFlight: Promise<Municipio[]> | null = null;

export async function getMunicipios(
  fetchWithAuth: FetchWithAuthFn
): Promise<Municipio[]> {
  if (municipiosCache) return municipiosCache;

  if (!municipiosInFlight) {
    municipiosInFlight = apiGet<
      ApiResponse<{ municipios: Municipio[] }>
    >(fetchWithAuth, "/api/municipios")
      .then((data) => {
        municipiosCache = data.data.municipios || [];
        return municipiosCache;
      })
      .finally(() => {
        municipiosInFlight = null;
      });
  }

  return municipiosInFlight;
}

// ── Localidades por municipio (GET /api/municipios/:clave/localidades) ──
// Clave numérica INEGI 1–60 (la misma que trae Municipio.claveMunicipio).

const localidadesCache = new Map<number, Localidad[]>();
const localidadesInFlight = new Map<number, Promise<Localidad[]>>();

export async function getLocalidades(
  claveMunicipio: number,
  fetchWithAuth: FetchWithAuthFn
): Promise<Localidad[]> {
  const cached = localidadesCache.get(claveMunicipio);
  if (cached) return cached;

  let inFlight = localidadesInFlight.get(claveMunicipio);
  if (!inFlight) {
    inFlight = apiGet<
      ApiResponse<{ municipio: string; localidades: Localidad[] }>
    >(
      fetchWithAuth,
      `/api/municipios/${claveMunicipio}/localidades`
    )
      .then((data) => {
        const localidades = data.data.localidades || [];
        localidadesCache.set(claveMunicipio, localidades);
        return localidades;
      })
      .finally(() => {
        localidadesInFlight.delete(claveMunicipio);
      });
    localidadesInFlight.set(claveMunicipio, inFlight);
  }

  return inFlight;
}

// ── Invalidación ──
// Con clave: descarta solo las localidades de ese municipio.
// Sin clave: descarta todo el catálogo (usar tras un 400 del backend).

export function invalidarCatalogos(claveMunicipio?: number): void {
  if (typeof claveMunicipio === "number") {
    localidadesCache.delete(claveMunicipio);
  } else {
    municipiosCache = null;
    localidadesCache.clear();
  }
}
