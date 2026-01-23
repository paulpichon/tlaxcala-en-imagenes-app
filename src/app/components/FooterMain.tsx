//footer
// Link-nextjs.
import Link from "next/link";

// componente para mostrar el footer principal
export default function FooterPrincipal() {
    return (
        <div className="col-md-12">
          <div className="pie_pagina_index">
            <ul className="nav justify-content-center">
              <li className="nav-item">
                <Link className="nav-link pie_pagina_links tad" href="https://joyful-palmier-7fd55a.netlify.app/" aria-current="page" target="_blank">
                    Tlaxcala Al Descubierto
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link pie_pagina_links" href="/informacion">
                    Información
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link pie_pagina_links" href="/politica-de-privacidad">
                    Política de Privacidad
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link pie_pagina_links" href="/condiciones-de-servicio">
                    Condiciones de Servicio
                </Link>
              </li>
            </ul>
          </div>
        </div>
    );
}