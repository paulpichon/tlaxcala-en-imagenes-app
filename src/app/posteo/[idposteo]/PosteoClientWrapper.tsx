"use client";

import { useSearchParams } from "next/navigation";
import PosteoModal from "@/app/components/PosteoModal";
import PosteoDetalle from "@/app/components/PosteoDetalle";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import MenuPrincipal from "@/app/components/MenuPrincipal";
import ImagenesMasVotadas from "@/app/components/ImagenesMasVotadas";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";

export default function PosteoClientWrapper() {
  const searchParams = useSearchParams();
  const isModal = searchParams.get("modal") === "true";

  return (
    <>
      {/* 👇 siempre renderizamos la página de detalle completa */}
      <div className="contenedor_principal">
        <div className="row g-0">
          {/* Menú lateral */}
          <div className="col-md-2 col-lg-2 col-xl-2">
            <div className="contenedor_menu_lateral_inferior fixed-bottom">
              <MenuPrincipal />
            </div>
          </div>

          {/* Contenido principal */}
          <div className="col-md-10 col-lg-10  col-xl-6 contenedor_central_contenido">
            <div className="contenedor_menu_superior sticky-top">
              <HeaderSuperior />
            </div>
            <div className="contenedor_contenido_principal">
              <PosteoDetalle />
            </div>
          </div>

          {/* Sugerencias */}
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

      {/* 👇 Si hay ?modal=true, mostramos el overlay encima */}
      {isModal && <PosteoModal isOpen={true} />}
    </>
  );
}
