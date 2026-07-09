// Componente para seleccionar municipio manualmente
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Municipio, DatosUbicacion } from "@/types/types";
import { apiGet } from "@/lib/apiClient";

// Componente para seleccionar municipio manualmente
// Props:
// - municipio: id del municipio seleccionado actualmente (string o null)
// - onSelect: función que recibe (idMunicipio: string | null, datosUbicacion: DatosUbicacion) al seleccionar un municipio
export default function ManualMunicipioSelector({
  municipio,
  onSelect,
}: {
  municipio: string | null;
  onSelect: (id: string | null, data: DatosUbicacion) => void;
}) {
    const { fetchWithAuth } = useAuth(); // 👈 IMPORTANTE 
    //   Estado para lista de municipios
    const [municipios, setMunicipios] = useState<Municipio[]>([]);

  useEffect(() => {
    const cargarMunicipios = async () => {
        try {
        const data = await apiGet<Municipio[] | { municipios: Municipio[] }>(
          fetchWithAuth,
          '/api/municipios'
        );

        const lista = Array.isArray(data)
            ? data
            : Array.isArray(data?.municipios)
            ? data.municipios
            : [];

        setMunicipios(lista);
        } catch (err) {
        console.error("Error cargando municipios:", err);
        setMunicipios([]);
        }
    };
    cargarMunicipios();
  }, [fetchWithAuth]);

  return (
    <div>
        <label className="form-label">Seleccionar municipio (opcional)</label>

        <select
            className="form-select"
            value={municipio || ""}
            onChange={({ target }) => {
                // Id del municipio seleccionado, puede ser null si no se selecciona nada
                const id = target.value || null;
                const muni = municipios.find((m) => m._id === id);
                // obtener datos adicionales
                const data: DatosUbicacion = {
                ciudad: muni?.nombreMunicipio ?? null,
                estado: muni?.nombreEntidad ?? null,
                pais: "México",
                };
                // id: puede ser null si no se selecciona nada, id del municipio
                // data: info adicional, ciudad, estado, pais   
                onSelect(id, data);
            }}
            >
            <option value="">No seleccionar</option>
            
            {municipios.map((m) => (
                <option key={m._id} value={m._id}>
                    {m.nombreMunicipio}
                </option>
            ))}
        </select>
    </div>
  );
}
