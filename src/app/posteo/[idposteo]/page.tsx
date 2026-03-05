// 📌 Página de Detalle de Posteo
// Ruta: /posteo/[idposteo]
// Esta página muestra el detalle completo de una publicación.

// ❗ IMPORTANTE:
// Todos los posteos son PRIVADOS.
// Requieren autenticación obligatoria.
// No deben indexarse en motores de búsqueda.

// Componentes estructurales
import HeaderSuperior from "@/app/components/HeaderSuperior";
import MenuPrincipal from "@/app/components/MenuPrincipal";
import NuevosUsuariosRegistrados from "@/app/components/NuevosUsuariosRegistrados";
import Publicidad from "@/app/components/Publicidad";
import FooterSugerencias from "@/app/components/FooterSugerencias";

// 🎨 Estilos
import "../../ui/inicio/inicio.css";
// Componente que obtiene y renderiza el posteo (Client Component)
import PosteoDetalle from "@/app/components/PosteoDetalle";
import { Metadata } from "next";

/**
 * 🔐 SEO CONFIGURADO COMO PRIVADO
 *
 * Aunque la ruta esté protegida por ProtectedRoute,
 * también indicamos explícitamente a los motores de búsqueda
 * que NO deben indexar ni seguir esta página.
 *
 * Esto es una doble capa de protección SEO.
 */
export const metadata: Metadata = {
  title: "Publicación",
  description: "Contenido privado disponible únicamente para usuarios autenticados.",

  // 🆕 MEJORA SEO PRIVADO (agregado)
  robots: {
    index: false,     // ❌ No indexar
    follow: false,    // ❌ No seguir enlaces
    nocache: true,    // ❌ No guardar en caché
  },

  // 🆕 Canonical preventivo (no obligatorio pero recomendado)
  alternates: {
    canonical: "/",
  },
};

export default async function Posteo() {
  return (
    // 📦 Contenedor principal
    <div className="contenedor_principal">
      <div className="row g-0">

        {/* 📌 Menú lateral */}
        <div className="col-md-2 col-lg-2 col-xl-2">
          <div className="contenedor_menu_lateral_inferior fixed-bottom">
            <MenuPrincipal />
          </div>
        </div>

        {/* 📌 Contenido central */}
        <div className="col-md-10 col-lg-10 col-xl-6 contenedor_central_contenido">
          
          {/* Header superior */}
          <div className="contenedor_menu_superior sticky-top">
            <HeaderSuperior />
          </div>

          {/* 📌 Contenido del posteo */}
          <div className="contenedor_contenido_principal">
            {/* 
              🔎 PosteoDetalle:
              - Obtiene idposteo desde useParams()
              - Hace fetch autenticado
              - Maneja loading y errores
              - Si hay error → notFound()
            */}
            <PosteoDetalle />
          </div>
        </div>

        {/* 📌 Columna derecha (sugerencias y publicidad) */}
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

      </div>
    </div>
  );
}
