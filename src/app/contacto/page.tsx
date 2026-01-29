// Página de Contacto
import "bootstrap/dist/css/bootstrap.css";

// Estilos (reutilizamos el mismo módulo)
import contacto from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";

// Header y Footer
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "@/app/components/FooterMain";

export default function Contacto() {
  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        {/* Header */}
        <HeaderPrincipalTei />

        <div className="col-sm-12 col-md-10 col-lg-8">
          <div className={contacto.contenedor_formulario}>
            <div className={contacto.contenedor_titulos}>
              <h1 className={contacto.titulo}>Contacto</h1>
              <p className={contacto.fecha}>
                Última actualización: <strong>Enero/2026</strong>
              </p>
            </div>

            <div className={contacto.contenido}>
              <p>
                En <strong>TlaxApp</strong> valoramos la
                comunicación con nuestra comunidad. Si tienes dudas, comentarios
                o necesitas apoyo relacionado con el uso de la Plataforma, puedes
                ponerte en contacto con nosotros a través de los siguientes
                medios.
              </p>

              <h2>¿Para qué puedo contactarlos?</h2>
              <ul>
                <li>Dudas generales sobre el funcionamiento de la Plataforma</li>
                <li>Reportes de errores o fallos técnicos</li>
                <li>Solicitudes relacionadas con tu cuenta</li>
                <li>Ejercicio de derechos ARCO</li>
                <li>Reportes de contenido o conductas inapropiadas</li>
                <li>Comentarios o sugerencias para mejorar TlaxApp</li>
              </ul>

              <h2>Medios de contacto disponibles</h2>
              <ul>
                <li>
                  <strong>Formulario de contacto:</strong> Disponible dentro de
                  la Plataforma
                </li>
                <li>
                  <strong>Correo electrónico:</strong>{" "}
                  <em>[correo de contacto]</em>
                </li>
              </ul>

              <h2>Tiempos de respuesta</h2>
              <p>
                Nos esforzamos por atender todas las solicitudes en un plazo
                razonable. El tiempo de respuesta puede variar dependiendo del
                tipo de solicitud, pero generalmente respondemos dentro de los
                siguientes días hábiles.
              </p>

              <h2>Uso responsable del canal de contacto</h2>
              <p>
                El canal de contacto debe utilizarse de forma respetuosa y
                adecuada. No se atenderán mensajes ofensivos, spam o que no estén
                relacionados con el uso de la Plataforma.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <FooterMain />
      </div>
    </div>
  );
}
