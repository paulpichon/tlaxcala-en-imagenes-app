// Página de Ayuda y Soporte - Configuración
// Permite al usuario verificar informacion, pedir ayuda, contactar soporte, etc
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// EImportaciones
import MenuPrincipal from "@/app/components/MenuPrincipal";
import HeaderSuperior from "@/app/components/HeaderSuperior";
import NuevosUsuariosRegistrados from "@/app/components/NuevosUsuariosRegistrados";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";
import AyudaSoporte from "@/app/components/configuracion/ayuda-y-soporte/AyudaSoporte";


export default function EditarPerfilPage() {
  return (
    <>
      {/* Contenedor Principal */}
      <div className="contenedor_principal">
        {/* Row principal con grid de Bootstrap */}
        <div className="row g-0">
          
          {/* Contenedor menu lateral */}
          <div className="col-md-2 col-lg-2 col-xl-2">
            <div className="contenedor_menu_lateral_inferior fixed-bottom">
              {/* Menu principal de navegación */}
              <MenuPrincipal />
            </div>
          </div>
          {/* Fin Contenedor menu */}

          {/* Contenedor Contenido Principal */}
          <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
            
            {/* Contenedor menu superior */}
            <div className="contenedor_menu_superior sticky-top">
              {/* Header Superior con búsqueda y perfil */}
              <HeaderSuperior />
            </div>
            {/* Fin Contenedor menu principal */}
            
            {/* Contenedor del contenido principal - Formulario de edición de perfil */}
            <div className="contenedor_contenido_principal">
                {/* Componente de ayuda y soporte al usuariol */}
                <AyudaSoporte />


            </div>
            {/* Fin Contenedor del contenido principal */}
            
          </div>
          {/* Fin Contenedor Contenido Principal */}

          {/* Contenedor publicidad/sugerencias - Solo visible en pantallas XL */}
          <div className="col-xl-4 sugerencias">
            
            {/* Contenedor de contenido lateral */}
            <div className="contenedor_sugerencias sticky-top p-3">
              
              {/* Contenedor de sugerencias */}
              <div className="contenedor_sugerencias_seguir mt-4">
                
                {/* Sección: Nuevos usuarios registrados */}
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  {/* Widget de nuevos usuarios para seguir */}
                  <NuevosUsuariosRegistrados />
                </div>
                
                {/* Sección: Publicidad */}
                <div className="row d-flex justify-content-center contenedor_border_divs_sugerencias">
                  <div className="col-8">
                    {/* Banner publicitario */}
                    <Publicidad />
                  </div>
                </div>
                {/* Fin row publicidad */}

                {/* Sección: Footer con enlaces y información */}
                <div className="row d-flex justify-content-center mt-4">
                  <div className="col-12">
                    <div className="text-center mt-3">
                      {/* Footer del div sugerencias (Términos, Privacidad, Ayuda, etc.) */}
                      <FooterSugerencias />
                    </div>
                  </div>
                </div>
                
              </div>
              {/* Fin contenedor_sugerencias_seguir */}
              
            </div>
            {/* Fin contenedor_sugerencias */}
            
          </div>
          {/* Fin Contenedor publicidad/sugerencias */}
          
        </div>
        {/* Fin Row */}
      </div>
      {/* Fin Contenedor Principal */}
    </>
  );
}