// ======================================
// 🏷️ Etiqueta de ubicación para cards y modales
// ======================================
// - Post con localidad (nuevo shape): "Municipio · Localidad"
// - Posts antiguos (localidadClave/localidadNombre: null): formato
//   histórico "ciudad, estado, país" — backward compatible.

interface UbicacionParaEtiqueta {
  ciudad?: string | null;
  estado?: string | null;
  pais?: string | null;
  localidadNombre?: string | null;
}

export function formatearEtiquetaUbicacion(
  ubicacion?: UbicacionParaEtiqueta | null
): string | null {
  if (!ubicacion) return null;

  const { ciudad, estado, pais, localidadNombre } = ubicacion;

  if (localidadNombre) {
    return ciudad ? `${ciudad} · ${localidadNombre}` : localidadNombre;
  }

  const texto = [ciudad, estado, pais].filter(Boolean).join(", ");
  return texto || null;
}
