// Página de Sesiones activas (requiere sesión; no indexable)
import { Metadata } from "next";
import MenuPrincipal from "../../components/MenuPrincipal";
import HeaderSuperior from "../../components/HeaderSuperior";
import Publicidad from "../../components/Publicidad";
import FooterSugerencias from "../../components/FooterSugerencias";
import NuevosUsuariosRegistrados from "../../components/NuevosUsuariosRegistrados";
import SesionesActivas from "@/app/components/configuracion/sesiones-activas/SesionesActivas";

export const metadata: Metadata = {
  title: "Sesiones activas",
  description: "Revisa y cierra las sesiones abiertas de tu cuenta de TlaxApp.",
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_BASE_URL}/configuracion/sesiones`,
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noarchive: true,
      nosnippet: true,
      noimageindex: true,
    },
  },
};

export default function SesionesActivasPage() {
  return (
    <div className="contenedor_principal">
      <div className="row g-0">
        <div className="col-md-2 col-lg-2 col-xl-2">
          <div className="contenedor_menu_lateral_inferior fixed-bottom">
            <MenuPrincipal />
          </div>
        </div>

        <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
          <div className="contenedor_menu_superior sticky-top">
            <HeaderSuperior />
          </div>
          <div className="contenedor_contenido_principal">
            <SesionesActivas />
          </div>
        </div>

        <div className="col-xl-4 sugerencias">
          <div className="contenedor_sugerencias sticky-top p-3">
            <div className="contenedor_sugerencias_seguir mt-4">
              <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                <NuevosUsuariosRegistrados />
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
