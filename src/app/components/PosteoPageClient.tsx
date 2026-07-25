'use client';

import { useAuth } from "@/context/AuthContext";
import Spinner from "./spinner";
import HeaderSuperior from "./HeaderSuperior";
import MenuPrincipal from "./MenuPrincipal";
import NuevosUsuariosRegistrados from "./NuevosUsuariosRegistrados";
import Publicidad from "./Publicidad";
import FooterSugerencias from "./FooterSugerencias";
import PosteoDetalle from "./PosteoDetalle";
import PosteoPublicoCTA from "./PosteoPublicoCTA";

export default function PosteoPageClient() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <div className="contenedor_principal">
      <div className="row g-0">
        {isAuthenticated && (
          <div className="col-md-2 col-lg-2 col-xl-2">
            <div className="contenedor_menu_lateral_inferior fixed-bottom">
              <MenuPrincipal />
            </div>
          </div>
        )}

        <div
          className={
            isAuthenticated
              ? "col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido"
              : "col-12 col-md-10 col-lg-8 mx-auto"
          }
        >
          <div className="contenedor_menu_superior sticky-top">
            <HeaderSuperior href={isAuthenticated ? "/inicio" : "/"} />
          </div>

          <div
            className="contenedor_contenido_principal"
            style={
              isAuthenticated
                ? {}
                : { maxWidth: "600px", margin: "0 auto" }
            }
          >
            <PosteoDetalle />
          </div>
        </div>

        {isAuthenticated && (
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
        )}
      </div>

      {!isAuthenticated && <PosteoPublicoCTA />}
    </div>
  );
}
