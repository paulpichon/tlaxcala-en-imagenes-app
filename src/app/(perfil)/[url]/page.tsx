"use client";

import "bootstrap/dist/css/bootstrap.css";
// Estilos que debemos mantener para el diseño del boton de LIKE
import "../../ui/inicio/inicio.css";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import perfil from "../../ui/perfil/perfil.module.css";

// Componentes
import MenuPrincipal from "../../components/MenuPrincipal";
import HeaderSuperior from "../../components/HeaderSuperior";
import InformacionUsuarioPerfil from "../../components/perfil/InformacionUsuarioPerfil";
import PublicacionesUsuarioGrid from "../../components/perfil/PublicacionesUsuarioGrid";
import ImagenesMasVotadas from "../../components/ImagenesMasVotadas";
import Publicidad from "../../components/Publicidad";
import FooterSugerencias from "../../components/FooterSugerencias";
import { useAuth } from "@/context/AuthContext";
// Se usa el tipo UsuarioPerfil que extiende de UsuarioLogueado ya que se agregan estadisticas adicionales  totaltPosteos, totalSeguidores, totalSeguidos
import { UsuarioPerfil } from "@/types/types";

export default function PerfilUsuario() {
	const { url } = useParams<{ url: string }>();
	const { fetchWithAuth } = useAuth(); // 👈 usamos fetchWithAuth
  // Se usa el tipo UsuarioPerfil que extiende de UsuarioLogueado ya que se agregan estadisticas adicionales  totaltPosteos, totalSeguidores, totalSeguidos
	const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);
	const [loading, setLoading] = useState(true);
  
	useEffect(() => {
	  if (!url) return;
  
	  const fetchUsuario = async () => {
		try {
		  const res = await fetchWithAuth(
			`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/${url}`
		  );
		  if (!res.ok) throw new Error("Error al obtener usuario");
		  const data = await res.json();
		  setUsuario(data.usuario);
		} catch (error) {
		  console.error("Error al cargar usuario:", error);
		} finally {
		  setLoading(false);
		}
	  };
  
	  fetchUsuario();
	}, [url, fetchWithAuth]);
  
	if (loading) return <p className="text-center mt-5">Cargando perfil...</p>;
	if (!usuario) return <p className="text-center mt-5">Usuario no encontrado</p>;
  

  return (
    <div className="contenedor_principal">
      <div className="row g-0">
        {/* Menú lateral */}
        <div className="col-md-2 col-lg-2 col-xl-2">
          <div className="contenedor_menu_lateral_inferior fixed-bottom">
            <MenuPrincipal />
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
                <InformacionUsuarioPerfil usuario={usuario}/>
              </div>
            </div>
          </div>

          {/* Publicaciones */}
          <div className="publicaciones_usuario">
            <div className="container-fluid">
              <div className="row">
                <div className="col-12">
                  <div className="contenedor_publicacion_usuario mb-5">
                    <div className="mt-3">
                      <div className="titulo_contenedor text-center">
                        <h6 className={`${perfil.titulo_publicaciones} pt-3 pb-3`}>
                          PUBLICACIONES
                        </h6>
                      </div>
                      <PublicacionesUsuarioGrid usuarioId={usuario._id} />
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
