// Pagina no encontrada
// Next Link
import Link from "next/link";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos pagina not faound
import "./ui/not-found.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer
import FooterMain from "@/app/components/FooterMain";
// Metadatos
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 | Página no encontrada",
  description: "El lugar donde encuentras gente de Tlaxcala",
};

export default function NotFound() {
  
  // Retornar el componente
  return (
      <div className="container-fluid container-xl">
          <div className="row justify-content-center contenedor_principal">
              {/* Hear principal */}
              <HeaderPrincipalTei />
              
              <div className="col-sm-9 col-md-7 col-lg-6">
                  <div className="contenedor_formulario ">
                      <div className="contenedor_titulos">
                        <h3 className="">Upppsssssss...</h3>
                        <h3 className="subtitulo_h3">
                          PÁGINA NO ENCONTRADA
                        </h3>
                        <p className="texto">
                          Lo sentimos, la página que estás buscando no existe, nunca existió y tal vez nunca existirá. Si crees que algo no funciona, informe un problema.
                        </p>
                      </div>
                      <div className="contenedor_formulario">
                          {/* Aqui se valida si hay sesion iniciada, ya sea para mostrar la pagina de inicio o la pagina de bienvenida */}
                          <Link 
                            href="/"
                            className="boton_registrarse"
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

