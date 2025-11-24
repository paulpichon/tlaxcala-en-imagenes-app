'use client';

import { useState } from "react";
import perfil from "../../ui/perfil/perfil.module.css";
import { notFound } from "next/navigation"; // 👈 importamos para usar la página not-found.tsx

import MenuPrincipal from "../../components/MenuPrincipal";
import HeaderSuperior from "../../components/HeaderSuperior";
import InformacionUsuarioPerfil from "../../components/perfil/InformacionUsuarioPerfil";
import PublicacionesUsuarioGrid from "../../components/perfil/PublicacionesUsuarioGrid";
import ImagenesMasVotadas from "../NuevosUsuariosRegistrados";
import Publicidad from "../../components/Publicidad";
import FooterSugerencias from "../../components/FooterSugerencias";
import { useUsuarioPerfil } from "@/app/hooks/useUsuarioPerfil";
import Spinner from "../spinner";

// Props de url de perfil
interface UrlProps {
  url: string;
}

export default function PerfilUsuarioContainer({ url }: UrlProps) {
  const { usuario, loading, error } = useUsuarioPerfil(url);
  const [refreshPosteos, setRefreshPosteos] = useState(0);

  // 🔹 Nuevo: estado local sincronizado con el total del usuario
  const [totalPosteos, setTotalPosteos] = useState<number | undefined>(undefined);


  const handlePostCreated = () => {
    setRefreshPosteos((prev) => prev + 1);
  };

  // 🔹 Al cargar el usuario, sincroniza el total inicial
  if (usuario && totalPosteos === undefined) {
    setTotalPosteos(usuario.totaltPosteos);
  }

  if (loading) return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner /></div>;

  // 👇 Si hubo error de fetch o no existe usuario, mostramos la página not-found
  if (error || !usuario) return notFound();

  return (
    <div className="contenedor_principal">
      <div className="row g-0">
        {/* Menú lateral */}
        <div className="col-md-2 col-lg-2 col-xl-2">
          <div className="contenedor_menu_lateral_inferior fixed-bottom">
            <MenuPrincipal onPostCreated={handlePostCreated} />
          </div>
        </div>

        {/* Contenido principal */}
        <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
          <div className="contenedor_menu_superior sticky-top">
            <HeaderSuperior />
          </div>
          <div className="contenedor_contenido_principal">
            <div className="container-fluid">
              <div className={`${perfil.contenedor_info_usuario}`}>
              {/* ✅ Pasamos el total sincronizado */}
                <InformacionUsuarioPerfil usuario={usuario} totalPosteos={totalPosteos} />
              </div>
            </div>
          </div>

          {/* Publicaciones */}
          <div className="publicaciones_usuario bg-light">
            <div className="container-fluid">
              <div className="row">
                <div className="col-12">
                  <div className="contenedor_publicacion_usuario mb-5">
                    <div className="mt-3">
                      <div className="titulo_contenedor text-center">
                      </div>
                        {/* ✅ Sincronizamos el total al eliminar/cargar posteos */}
                        <PublicacionesUsuarioGrid
                          usuarioId={usuario._id}
                          refreshTrigger={refreshPosteos}
                          onPostCountChange={setTotalPosteos}
                        />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna sugerencias */}
        <div className="col-xl-4 sugerencias">
          <div className="contenedor_sugerencias sticky-top p-3">
            <div className="contenedor_sugerencias_seguir mt-4">
              <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                <ImagenesMasVotadas />
              </div>
              <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                <div className="col-8">
                  <Publicidad />
                </div>
              </div>
              <div className="row d-flex justify-content-center mt-4">
                <div className="col-12">
                  <div className="text-center mt-3">
                    <FooterSugerencias />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
