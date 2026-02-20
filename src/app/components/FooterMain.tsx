// Footer principal
import Link from "next/link";

export default function FooterMain() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="col-md-12">
      <footer className="pie_pagina_index">
        {/* Navegación legal */}
        <ul className="nav justify-content-center mb-2">
          <li className="nav-item">
            <Link
              className="nav-link pie_pagina_links tad"
              href="https://joyful-palmier-7fd55a.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tlaxcala Al Descubierto
            </Link>
          </li>

          <li className="nav-item">
            <Link 
              className="nav-link pie_pagina_links" 
              href="/contacto" 
              target="_blank"
            >
              Contacto
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className="nav-link pie_pagina_links"
              href="/legal/politica-de-privacidad"
              target="_blank"
            >
              Política de Privacidad
            </Link>
          </li>

          <li className="nav-item">
            <Link
              className="nav-link pie_pagina_links"
              href="/legal/terminos-y-condiciones"
              target="_blank"
            >
              Términos y Condiciones
            </Link>
          </li>
          <li className="nav-item">
            <Link
              className="nav-link pie_pagina_links"
              href="/legal/preguntas-frecuentes"
              target="_blank"
            >
              Preguntas Frecuentes (FAQ)
            </Link>
          </li>
        </ul>

        {/* Copy */}
        <div className="text-center pie_pagina_copy mb-5">
          <small>
            © {currentYear} <strong>TlaxApp</strong>. Todos los derechos reservados.
          </small>
          <br />
          <small className="text-muted">
            El uso de esta plataforma implica la aceptación de nuestros Términos y
            Política de Privacidad.
          </small>
        </div>
      </footer>
    </div>
  );
}
