"use client";

import { useAuth } from "@/context/AuthContext";
import Spinner from "@/app/components/spinner";
import MenuPrincipal from "@/app/components/MenuPrincipal";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import NuevosUsuariosRegistrados from "@/app/components/NuevosUsuariosRegistrados";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";
import PosteoPublicoCTA from "@/app/components/PosteoPublicoCTA";

export default function PosteoNotFound() {
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
              : "col-12 col-md-8 col-lg-6 mx-auto d-flex justify-content-center"
          }
        >
          {isAuthenticated && (
            <div className="contenedor_menu_superior sticky-top">
              <HeaderSuperior />
            </div>
          )}

          <div
            className="contenedor_contenido_principal d-flex justify-content-center align-items-center"
            style={{ minHeight: "70vh" }}
          >
            <div className="text-center">
              <h2 className="fw-bold text-danger">Posteo no encontrado</h2>
              <p className="text-muted">
                Esta publicación no existe o fue eliminada.
              </p>
            </div>
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
