// Página Política de Privacidad
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import politica from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "@/app/components/FooterMain";

export default function PoliticaDePrivacidad() {
  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        {/* Header */}
        <HeaderPrincipalTei />

        <div className="col-sm-12 col-md-10 col-lg-8">
          <div className={politica.contenedor_formulario}>
            <div className={politica.contenedor_titulos}>
              <h1 className={politica.titulo}>Política de Privacidad</h1>
              <p className={politica.fecha}>
                Última actualización: <strong>Enero/2026</strong>
              </p>
            </div>

            <div className={politica.contenido}>
              <p>
                <strong>TlaxApp</strong> (en adelante, “la Plataforma”) es una
                aplicación web de carácter social que permite a los usuarios
                registrarse, crear perfiles, subir imágenes, interactuar mediante
                seguidores, likes y comentarios, y compartir contenido
                relacionado con experiencias, lugares y estilo de vida,
                principalmente dentro del estado de Tlaxcala, México.
              </p>

              <p>
                La presente Política de Privacidad se emite en cumplimiento de la{" "}
                <strong>
                  Ley Federal de Protección de Datos Personales en Posesión de los
                  Particulares (LFPDPPP)
                </strong>
                , su Reglamento y demás disposiciones aplicables en los Estados
                Unidos Mexicanos.
              </p>

              <h2>1. Responsable del tratamiento de los datos personales</h2>
              <p>
                El responsable del tratamiento de los datos personales recabados
                a través de la Plataforma es{" "}
                <strong>TlaxApp</strong> (legal@tlaxapp.mx), quien actúa como responsable conforme a
                la LFPDPPP.
              </p>

              <h2>2. Datos personales que se recaban</h2>

              <h3>a) Datos de identificación</h3>
              <ul>
                <li>Nombre y apellidos</li>
                <li>Nombre de usuario (URL personalizada)</li>
                <li>Correo electrónico</li>
                <li>Imagen de perfil</li>
              </ul>

              <h3>b) Datos de uso y actividad</h3>
              <ul>
                <li>Publicaciones (imágenes, descripciones y metadatos)</li>
                <li>Interacciones dentro de la Plataforma</li>
                <li>Historial básico de actividad</li>
              </ul>

              <h3>c) Datos de ubicación (opcionales)</h3>
              <ul>
                <li>
                  Estado, municipio o ciudad asociados a una publicación, cuando
                  el usuario los proporciona voluntariamente
                </li>
              </ul>

              <p>
                TlaxApp <strong>no recaba datos personales sensibles</strong>{" "}
                conforme a la LFPDPPP.
              </p>

              <h2>3. Finalidades del tratamiento</h2>

              <h3>Finalidades primarias</h3>
              <ul>
                <li>Crear y administrar la cuenta del usuario</li>
                <li>Permitir la autenticación y seguridad de sesión</li>
                <li>Mostrar perfiles y contenido generado por usuarios</li>
                <li>Habilitar funciones sociales</li>
                <li>Gestión de verificación y recuperación de cuenta</li>
              </ul>

              <h3>Finalidades secundarias</h3>
              <ul>
                <li>Mejorar la experiencia de usuario</li>
                <li>Análisis interno de uso de la Plataforma</li>
                <li>Envío de promociones, publicidad o eventos relacionados con el comercio local en Tlaxcala.</li>
              </ul>

              <h2>4. Cookies y tecnologías similares</h2>
              <p>
                TlaxApp utiliza cookies para mantener la sesión activa, garantizar
                la seguridad y mejorar el funcionamiento general de la
                Plataforma.
              </p>

              <h2>5. Transferencias de datos personales</h2>
              <p>
                TlaxApp <strong>no vende ni comercializa</strong> datos
                personales. Estos solo podrán compartirse cuando sea requerido
                por ley o para el funcionamiento técnico del servicio.
              </p>

              <h2>6. Derechos ARCO</h2>
              <p>
                El usuario podrá ejercer sus derechos de Acceso, Rectificación,
                Cancelación u Oposición (ARCO) a través de los medios de contacto
                indicados en la Plataforma.
              </p>

              <h2>7. Eliminación de cuenta</h2>
              <p>
                El usuario podrá solicitar la eliminación de su cuenta. La
                información podrá conservarse de forma temporal únicamente para
                cumplir obligaciones legales.
              </p>

              <h2>8. Seguridad de la información</h2>
              <p>
                TlaxApp implementa medidas razonables para proteger los datos
                personales contra accesos no autorizados.
              </p>

              <h2>9. Cambios a la política</h2>
              <p>
                Esta Política de Privacidad podrá ser modificada en cualquier
                momento y será publicada dentro de la Plataforma.
              </p>

              <h2>10. Aceptación</h2>
              <p>
                El uso de TlaxApp implica la aceptación expresa de la presente
                Política de Privacidad.
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
