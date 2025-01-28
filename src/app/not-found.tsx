// Pagina no encontrada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos pagina not faound
import "./ui/not-found.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderAside";
// Footer
import FooterMain from "@/app/components/FooterMain";
// Metadatos
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 | Página no encontrado",
  description: "El lugar donde encuentras gente de Tlaxcala",
};

export default function CorreoEnviado() {
  
  // Retornar el componente
  return (
      <div className="container-fluid container-xl">
          <div className="row justify-content-center contenedor_principal">
              {/* Hear principal */}
              <HeaderPrincipalTei />
              
              <div className="col-sm-9 col-md-7 col-lg-6">
                  <div className="contenedor_formulario ">
                      <div className="contenedor_titulos">
                        <h3 className="mt-4">Upppsssssss...</h3>
                        <h1 className="mt-4">
                          PÁGINA NO ENCONTRADA
                        </h1>
                        <p className="mt-3">
                          Lo sentimos, la página que estás buscando no existe. Si cree que algo no funciona, informe un problema.
                        </p>
                      </div>
                      <div className="contenedor_formulario">
                          {/* Aqui se valida si hay sesion iniciada, ya sea para mostrar la pagina de inicio o la pagina de bienvenida */}
                          <Link 
                            href="/"
                            className="links"
                          >
                            Regresar a un lugar seguro
                          </Link>
                      </div>
                  </div>
              </div>
              {/* Footer */}
              <FooterMain />
          </div>
      </div>
  );
};

