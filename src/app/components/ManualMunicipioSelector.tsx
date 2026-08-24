// Selector en cascada: municipio (por _id) → localidades INEGI (por claveMunicipio)
// El formulario sólo envía la clave de la localidad; el nombre lo resuelve el backend.
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Municipio,
  DatosUbicacion,
  SeleccionLocalidad,
  Localidad,
} from "@/types/types";
import { getMunicipios, getLocalidades } from "@/lib/catalogos";

// Props:
// - municipio: id (_id) del municipio seleccionado actualmente (string o null)
// - localidadClave: clave INEGI de la localidad seleccionada (string o null)
// - onSelect: (idMunicipio, datosUbicacion, localidad) al cambiar cualquier select
export default function ManualMunicipioSelector({
  municipio,
  localidadClave = null,
  onSelect,
}: {
  municipio: string | null;
  localidadClave?: string | null;
  onSelect: (
    id: string | null,
    data: DatosUbicacion,
    localidad: SeleccionLocalidad | null
  ) => void;
}) {
  const { fetchWithAuth } = useAuth();

  // Estado para lista de municipios (cacheada en src/lib/catalogos.ts)
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [cargandoLocalidades, setCargandoLocalidades] = useState(false);
  const [errorLocalidades, setErrorLocalidades] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    getMunicipios(fetchWithAuth)
      .then((lista) => {
        if (vigente) setMunicipios(lista);
      })
      .catch((err) => {
        console.error("Error cargando municipios:", err);
        if (vigente) setMunicipios([]);
      });
    return () => {
      vigente = false;
    };
  }, [fetchWithAuth]);

  // Cascada: cuando cambia el municipio seleccionado (o llega el catálogo),
  // pedir sus localidades. El guard "vigente" descarta respuestas tardías.
  useEffect(() => {
    const muni = municipio
      ? municipios.find((m) => m._id === municipio)
      : undefined;

    if (!muni) {
      setLocalidades([]);
      setCargandoLocalidades(false);
      return;
    }

    let vigente = true;
    setCargandoLocalidades(true);
    setErrorLocalidades(null);

    getLocalidades(muni.claveMunicipio, fetchWithAuth)
      .then((lista) => {
        if (vigente) setLocalidades(lista);
      })
      .catch((err) => {
        console.error("Error cargando localidades:", err);
        if (vigente) {
          setLocalidades([]);
          setErrorLocalidades("No se pudieron cargar las localidades");
        }
      })
      .finally(() => {
        if (vigente) setCargandoLocalidades(false);
      });

    return () => {
      vigente = false;
    };
  }, [municipio, municipios, fetchWithAuth]);

  const construirDatosUbicacion = (id: string | null): DatosUbicacion => {
    const muni = id ? municipios.find((m) => m._id === id) : undefined;
    return {
      ciudad: muni?.nombreMunicipio ?? null,
      estado: muni?.nombreEntidad ?? null,
      pais: muni ? "México" : null,
    };
  };

  const handleMunicipioChange = (id: string | null) => {
    // Al cambiar de municipio la localidad anterior queda huérfana → reset
    onSelect(id, construirDatosUbicacion(id), null);
  };

  const handleLocalidadChange = (clave: string | null) => {
    if (!municipio || !clave) {
      onSelect(municipio, construirDatosUbicacion(municipio), null);
      return;
    }
    const loc = localidades.find((l) => l.clave === clave);
    onSelect(
      municipio,
      construirDatosUbicacion(municipio),
      loc ? { clave: loc.clave, nombre: loc.nombre } : null
    );
  };

  return (
    <div>
      <label className="form-label mb-1">Ubicación (opcional)</label>

      <div className="row g-2">
        <div className="col-12 col-sm-6">
          <select
            className="form-select"
            aria-label="Seleccionar municipio"
            value={municipio || ""}
            onChange={({ target }) => handleMunicipioChange(target.value || null)}
          >
            <option value="">No seleccionar</option>
            {municipios.map((m) => (
              <option key={m._id} value={m._id}>
                {m.nombreMunicipio}
              </option>
            ))}
          </select>
        </div>

        <div className="col-12 col-sm-6">
          <select
            className="form-select"
            aria-label="Seleccionar localidad"
            value={localidadClave || ""}
            disabled={!municipio || cargandoLocalidades}
            onChange={({ target }) =>
              handleLocalidadChange(target.value || null)
            }
          >
            <option value="">Sin localidad</option>
            {localidades.map((l) => (
              <option key={l.clave} value={l.clave}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      {cargandoLocalidades && (
        <div className="small text-muted mt-1">Cargando localidades…</div>
      )}
      {errorLocalidades && (
        <div className="small text-danger mt-1">{errorLocalidades}</div>
      )}
    </div>
  );
}
