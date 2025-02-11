// Esta página no tiene LAYOUT
'use client' // Error boundaries must be Client Components
// Pagina no encontrada
// use effect
import { useEffect } from 'react';
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos pagina not faound
import "./ui/error.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer
import FooterMain from "@/app/components/FooterMain";
// Al ser una pagina de error los metadatos no funcionan, se muestran los metadatos de la pagina que intentas acceder

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])
 
  return (
      <div className="container-fluid container-xl">
          <div className="row justify-content-center contenedor_principal">
              {/* Hear principal */}
              <HeaderPrincipalTei />
              
              <div className="col-sm-9 col-md-7 col-lg-6">
                  <div className="contenedor_formulario ">
                      <div className="contenedor_titulos">
                        <h3 className="subtitulo_h3">
                        ¡Algo ha salidó mal!
                        </h3>
                        <p className="texto">
                          Lo sentimos, al parecer hubo un problema. 
                          Favor de intentar más tarde.
                        </p>
                      </div>
                      <div className="contenedor_formulario">
                          {/* Aqui se valida si hay sesion iniciada, ya sea para mostrar la pagina de inicio o la pagina de bienvenida */}
                          <button
                            className="btn_tryagain"
                            onClick={
                              // Attempt to recover by trying to re-render the segment
                              () => reset()
                            }
                          >
                            Intentar de nuevo
                          </button>
                      </div>
                  </div>
              </div>
              {/* Footer */}
              <FooterMain />
          </div>
      </div>
  )
}