// Página Condiciones de Servicio
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import condiciones from "@/app/ui/legal/PrivacidadTerminosCondiciones.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "@/app/components/FooterMain";

export default function TerminosCondicionesServicio() {
  return (
    <div className="container-fluid container-xl">
      <div className="row justify-content-center contenedor_principal">
        {/* Header */}
        <HeaderPrincipalTei />

        <div className="col-sm-12 col-md-10 col-lg-8">
          <div className={condiciones.contenedor_formulario}>
            <div className={condiciones.contenedor_titulos}>
              <h1 className={condiciones.titulo}>Términos y Condiciones de Servicio</h1>
              <p className={condiciones.fecha}>
                Última actualización: <strong>Enero/2026</strong>
              </p>
            </div>

            <div className={condiciones.contenido}>
              <h2>1. Aceptación de los Términos</h2>
              <p>
                Bienvenido a <strong>TlaxApp</strong> (&quot;la Plataforma&quot;, &quot;nosotros&quot;, &quot;nuestro&quot;). 
                Estas Condiciones de Servicio (&quot;Condiciones&quot;, &quot;Términos&quot;) constituyen un acuerdo 
                legal vinculante entre tú (&quot;usuario&quot;, &quot;tú&quot;, &quot;tu&quot;) y TlaxApp.
              </p>
              <p>
                Al acceder o utilizar nuestra Plataforma, aceptas estar sujeto a estas Condiciones 
                en su totalidad. Si no estás de acuerdo con alguna parte de estos Términos, no 
                debes utilizar la Plataforma.
              </p>

              <h2>2. Descripción del Servicio</h2>
              <p>
                TlaxApp es una red social dedicada a la promoción, difusión y preservación del 
                patrimonio cultural, natural, social y turístico del estado de Tlaxcala, México. 
                Nuestra Plataforma permite a los usuarios:
              </p>
              <ul>
                <li>Crear perfiles personales</li>
                <li>Publicar y compartir fotografías, videos y contenido relacionado con Tlaxcala</li>
                <li>Interactuar con otros usuarios mediante comentarios, reacciones y mensajes</li>
                <li>Descubrir contenido sobre lugares, eventos y cultura de Tlaxcala</li>
                <li>Participar en comunidades y grupos de interés</li>
                <li>Conectar con otros entusiastas de Tlaxcala</li>
              </ul>
              <p>
                Nos reservamos el derecho de modificar, suspender o descontinuar cualquier aspecto 
                de la Plataforma en cualquier momento, con o sin previo aviso.
              </p>

              <h2>3. Elegibilidad y Registro de Cuenta</h2>
              
              <h3>3.1 Requisitos de Edad</h3>
              <p>
                Debes tener al menos <strong>18 años de edad</strong> para crear una cuenta en TlaxApp. 
              </p>

              <h3>3.2 Información de Registro</h3>
              <p>Al crear una cuenta, te comprometes a:</p>
              <ul>
                <li>Proporcionar información veraz, precisa, actual y completa</li>
                <li>Mantener y actualizar tu información de registro</li>
                <li>Mantener la seguridad y confidencialidad de tu contraseña</li>
                <li>Notificarnos inmediatamente sobre cualquier uso no autorizado de tu cuenta</li>
              </ul>

              <h3>3.3 Responsabilidad de la Cuenta</h3>
              <p>
                Eres totalmente responsable de todas las actividades que ocurran bajo tu cuenta. 
                No debes compartir tu cuenta con terceros. No nos hacemos responsables de pérdidas 
                que resulten del uso no autorizado de tu cuenta.
              </p>

              <h2>4. Conducta del Usuario</h2>

              <h3>4.1 Uso Aceptable</h3>
              <p>
                Te comprometes a utilizar la Plataforma de manera responsable y conforme a estas 
                Condiciones y a todas las leyes aplicables. Específicamente, aceptas:
              </p>
              <ul>
                <li>Usar la Plataforma solo para fines legales</li>
                <li>Respetar los derechos de otros usuarios y de terceros</li>
                <li>No publicar contenido falso, engañoso o que viole derechos de terceros</li>
                <li>Mantener un ambiente respetuoso y constructivo</li>
                <li>Promover la cultura y el turismo de Tlaxcala de manera positiva</li>
              </ul>

              <h3>4.2 Conductas Prohibidas</h3>
              <p>Está estrictamente prohibido:</p>

              <h4>Contenido Inapropiado:</h4>
              <ul>
                <li>Publicar contenido obsceno, pornográfico, sexualmente explícito o que sexualice a menores</li>
                <li>Compartir contenido violento, gore o que glorifique la violencia</li>
                <li>Publicar contenido que promueva el odio, discriminación o acoso basado en raza, etnia, religión, género, orientación sexual, discapacidad u otras características protegidas</li>
                <li>Difundir desinformación, noticias falsas o contenido engañoso</li>
                <li>Publicar contenido que promueva actividades ilegales o peligrosas</li>
              </ul>

              <h4>Violación de Derechos:</h4>
              <ul>
                <li>Infringir derechos de propiedad intelectual de terceros</li>
                <li>Publicar contenido que viole la privacidad de otros</li>
                <li>Suplantar la identidad de otra persona o entidad</li>
                <li>Publicar información privada de terceros sin su consentimiento</li>
              </ul>

              <h4>Abuso de la Plataforma:</h4>
              <ul>
                <li>Realizar spam, phishing o cualquier forma de comunicación no solicitada masiva</li>
                <li>Usar bots, scripts o herramientas automatizadas sin autorización</li>
                <li>Intentar acceder a áreas restringidas de la Plataforma o cuentas de otros usuarios</li>
                <li>Interferir con el funcionamiento normal de la Plataforma</li>
                <li>Realizar ingeniería inversa, descompilar o intentar extraer el código fuente</li>
                <li>Crear múltiples cuentas para evadir restricciones o sanciones</li>
              </ul>

              <h4>Actividades Ilegales:</h4>
              <ul>
                <li>Usar la Plataforma para cometer fraude o estafas</li>
                <li>Promover o facilitar actividades ilegales</li>
                <li>Violar cualquier ley local, estatal, nacional o internacional</li>
              </ul>

              <h3>4.3 Acoso y Bullying</h3>
              <p>No se tolera ninguna forma de acoso, intimidación o bullying. Esto incluye:</p>
              <ul>
                <li>Amenazas directas o indirectas</li>
                <li>Acoso persistente o no deseado</li>
                <li>Doxing (publicar información personal de otros)</li>
                <li>Cyberbullying o cyberstalking</li>
                <li>Organizar o participar en ataques coordinados contra usuarios</li>
              </ul>

              <h2>5. Contenido del Usuario</h2>

              <h3>5.1 Propiedad del Contenido</h3>
              <p>
                Conservas la propiedad de todo el contenido que publiques en TlaxApp. Sin embargo, 
                al publicar contenido en la Plataforma, nos otorgas una licencia no exclusiva, mundial, 
                libre de regalías, sublicenciable y transferible para:
              </p>
              <ul>
                <li>Usar, reproducir, distribuir, modificar, adaptar y crear obras derivadas de tu contenido</li>
                <li>Mostrar públicamente tu contenido en la Plataforma</li>
                <li>Permitir que otros usuarios vean, compartan e interactúen con tu contenido según tu configuración de privacidad</li>
              </ul>
              <p>
                Esta licencia continúa únicamente para contenido que ya haya sido compartido por otros usuarios o que sea necesario respaldar por cuestiones legales, pero el contenido en el perfil del usuario será eliminado de la vista pública al cerrar la cuenta.
              </p>

              <h3>5.2 Responsabilidad por el Contenido</h3>
              <p>Eres totalmente responsable del contenido que publicas. Al publicar contenido, garantizas que:</p>
              <ul>
                <li>Tienes todos los derechos necesarios para publicar dicho contenido</li>
                <li>El contenido no infringe derechos de terceros</li>
                <li>El contenido cumple con estas Condiciones</li>
                <li>El contenido es legal y no causará daño</li>
              </ul>

              <h3>5.3 Contenido de Terceros</h3>
              <p>
                Si publicas fotografías, videos u otro contenido que incluya a terceros o propiedades 
                de terceros, debes:
              </p>
              <ul>
                <li>Obtener los permisos necesarios de las personas que aparecen en el contenido</li>
                <li>Respetar los derechos de propiedad intelectual de los creadores originales</li>
                <li>Dar el crédito apropiado cuando uses contenido de terceros con permiso</li>
                <li>Cumplir con las leyes de derechos de imagen aplicables</li>
              </ul>

              <h3>5.4 Monitoreo y Moderación</h3>
              <p>
                No tenemos la obligación de monitorear el contenido publicado por los usuarios, pero 
                nos reservamos el derecho de:
              </p>
              <ul>
                <li>Revisar, monitorear y moderar el contenido de la Plataforma</li>
                <li>Eliminar o modificar contenido que viole estas Condiciones</li>
                <li>Tomar acciones contra usuarios que violen estas Condiciones</li>
                <li>Cooperar con autoridades en investigaciones legales</li>
              </ul>

              <h2>6. Derechos de Propiedad Intelectual</h2>

              <h3>6.1 Propiedad de la Plataforma</h3>
              <p>
                TlaxApp y todo su contenido, características y funcionalidad (incluyendo pero no 
                limitado a información, software, texto, diseños, gráficos, logos, iconos, imágenes, 
                clips de audio y video, y el diseño, selección y disposición de los mismos) son 
                propiedad exclusiva de TlaxApp o de nuestros licenciantes y están protegidos por 
                leyes de propiedad intelectual mexicanas e internacionales.
              </p>

              <h3>6.2 Uso Limitado</h3>
              <p>
                Se te otorga una licencia limitada, no exclusiva, no transferible y revocable para 
                acceder y usar la Plataforma para tu uso personal y no comercial, sujeto a estas Condiciones.
              </p>

              <h3>6.3 Marcas Comerciales</h3>
              <p>
              &quot;TlaxApp&quot; y todos los logos, marcas, nombres comerciales y otros signos distintivos 
                son marcas comerciales de TlaxApp. No puedes usar estas marcas sin nuestro 
                consentimiento previo por escrito.
              </p>

              <h2>7. Privacidad y Protección de Datos</h2>
              <p>
                Tu privacidad es importante para nosotros. El uso de la Plataforma está también 
                sujeto a nuestra Política de Privacidad, la cual describe cómo recopilamos, usamos 
                y protegemos tu información personal. Te recomendamos leer nuestra Política de 
                Privacidad detenidamente.
              </p>

              <h2>8. Medidas de Cumplimiento</h2>

              <h3>8.1 Violaciones</h3>
              <p>Si violas estas Condiciones, podemos tomar una o más de las siguientes acciones:</p>
              <ul>
                <li>Emitir una advertencia</li>
                <li>Eliminar contenido que viole las Condiciones</li>
                <li>Limitar temporalmente tu acceso a ciertas funciones</li>
                <li>Suspender temporalmente tu cuenta</li>
                <li>Eliminar permanentemente tu cuenta</li>
                <li>Tomar acciones legales según corresponda</li>
                <li>Reportar actividades ilegales a las autoridades competentes</li>
              </ul>

              <h3>8.2 Apelaciones</h3>
              <p>
                Si consideras que una acción tomada contra tu cuenta fue injusta, puedes apelar 
                contactando a nuestro equipo de soporte con:
              </p>
              <ul>
                <li>Tu nombre de usuario</li>
                <li>Descripción de la acción tomada</li>
                <li>Razones por las que consideras que la acción fue incorrecta</li>
                <li>Cualquier evidencia relevante</li>
              </ul>

              <h2>9. Terminación</h2>

              <h3>9.1 Terminación por el Usuario</h3>
              <p>
                Puedes cerrar tu cuenta en cualquier momento a través de la configuración de tu 
                perfil o contactando a nuestro equipo de soporte. Al cerrar tu cuenta:
              </p>
              <ul>
                <li>Perderás acceso a tu contenido y datos</li>
                <li>Tu contenido público puede permanecer visible si otros usuarios lo compartieron</li>
                <li>Ciertas obligaciones continuarán después de la terminación</li>
              </ul>

              <h3>9.2 Terminación por TlaxApp</h3>
              <p>Podemos suspender o terminar tu cuenta inmediatamente, sin previo aviso, si:</p>
              <ul>
                <li>Violas estas Condiciones</li>
                <li>Realizas actividades ilegales o fraudulentas</li>
                <li>Tu conducta pone en riesgo a otros usuarios o a la Plataforma</li>
                <li>Lo requerimos por ley</li>
                <li>Decidimos cerrar la Plataforma</li>
              </ul>

              <h2>10. Limitación de Responsabilidad</h2>
              <p>
                LA PLATAFORMA SE PROPORCIONA &quot;TAL CUAL&quot; Y &quot;SEGÚN DISPONIBILIDAD&quot;, SIN GARANTÍAS 
                DE NINGÚN TIPO, YA SEAN EXPRESAS O IMPLÍCITAS.
              </p>
              <p>
                EN LA MÁXIMA MEDIDA PERMITIDA POR LA LEY, TlaxApp NO SERÁ RESPONSABLE POR DAÑOS 
                DIRECTOS, INDIRECTOS, INCIDENTALES, ESPECIALES, CONSECUENTES O PUNITIVOS.
              </p>

              <h2>11. Indemnización</h2>
              <p>
                Aceptas indemnizar, defender y mantener indemne a TlaxApp, sus afiliados, directores, 
                empleados, agentes, licenciantes y proveedores de cualquier reclamo, responsabilidad, 
                daño, pérdida y gasto que surjan de o estén relacionados con:
              </p>
              <ul>
                <li>Tu uso de la Plataforma</li>
                <li>Tu violación de estas Condiciones</li>
                <li>Tu violación de derechos de terceros</li>
                <li>Tu conducta en relación con la Plataforma</li>
                <li>Contenido que publiques en la Plataforma</li>
              </ul>

              <h2>12. Ley Aplicable y Jurisdicción</h2>
              <p>
                Estas Condiciones se regirán e interpretarán de acuerdo con las leyes de los 
                Estados Unidos Mexicanos, sin dar efecto a ningún principio de conflicto de leyes.
              </p>
              <p>
                Cualquier controversia o reclamación que surja de o esté relacionada con estas 
                Condiciones o la Plataforma se someterá a la jurisdicción exclusiva de los 
                tribunales competentes del estado de Tlaxcala, México.
              </p>

              <h2>13. Disposiciones Generales</h2>

              <h3>13.1 Acuerdo Completo</h3>
              <p>
                Estas Condiciones, junto con nuestra Política de Privacidad, constituyen el 
                acuerdo completo entre tú y TlaxApp con respecto al uso de la Plataforma.
              </p>

              <h3>13.2 Modificaciones</h3>
              <p>
                Nos reservamos el derecho de modificar estas Condiciones en cualquier momento. 
                Tu uso continuado de la Plataforma después de dichos cambios constituye tu 
                aceptación de las nuevas Condiciones.
              </p>

              <h3>13.3 Divisibilidad</h3>
              <p>
                Si alguna disposición de estas Condiciones se considera inválida o inaplicable, 
                dicha disposición se eliminará o limitará en la medida mínima necesaria, y las 
                disposiciones restantes continuarán en pleno vigor y efecto.
              </p>

              <h2>14. Contacto</h2>
              <p>
                Si tienes preguntas, comentarios o inquietudes sobre estas Condiciones de Servicio, 
                puedes contactarnos a través de los medios de contacto disponibles en la Plataforma.
              </p>

              <h2>15. Aceptación</h2>
              <p>
                Al crear una cuenta o utilizar TlaxApp, reconoces que has leído, entendido y 
                aceptado estas Condiciones de Servicio en su totalidad.
              </p>

              <div className={condiciones.advertencia_final}>
                <p>
                  <strong>Fecha de entrada en vigor:</strong> Enero de 2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <FooterMain />
      </div>
    </div>
  );
}