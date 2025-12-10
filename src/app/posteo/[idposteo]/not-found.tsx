"use client";

import MenuPrincipal from "@/app/components/MenuPrincipal";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import ImagenesMasVotadas from "@/app/components/NuevosUsuariosRegistrados";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";

export default function PerfilNotFound() {
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

          {/* Contenido central */}
          <div className="contenedor_contenido_principal d-flex justify-content-center align-items-center" style={{ minHeight: "70vh" }}>
            <div className="text-center">
              <h2 className="fw-bold text-danger">Posteo no encontrado</h2>
              <p className="text-muted">
                Esta publicación no existe o fue eliminada.
              </p>
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
