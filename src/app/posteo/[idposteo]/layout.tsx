// 📌 Posteo Layout (Layout Anidado)
// Se usa Layouts Anidados en la estructura del proyecto.
// Este layout aplica únicamente a las rutas:
// /posteo/[idposteo]

// ❌ NO incluir metadata aquí.
//     La metadata específica del posteo se define en page.tsx.
// ❌ NO incluir <html>, <body>, <head>.
//     Solo deben declararse en el layout raíz (app/layout.tsx).
// ✅ Este layout solo contiene providers y protección de ruta.

// 🔐 Componente de protección de rutas
// Este componente redirige al login si el usuario NO está autenticado.
import ProtectedRoute from "@/components/ProtectedRoute";

// 🌐 Contextos específicos para esta sección
// Se usan solo en detalle de posteo.
import { FollowProvider } from "@/context/FollowContext";
import { FavoritoProvider } from "@/context/FavoritoContext";

/**
 * Layout anidado para páginas de detalle de posteo.
 *
 * Responsabilidades:
 * - 🔒 Protege la ruta con autenticación obligatoria.
 * - 📦 Provee contextos de seguimiento (follow) y favoritos.
 * - 🚫 No maneja metadata.
 *
 * Importante:
 * Aunque la ruta esté protegida, esto NO impide que bots intenten rastrearla.
 * El control SEO real se define en page.tsx mediante metadata (noindex).
 */
export default function PosteoLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 🔒 Ruta protegida - requiere autenticación obligatoria
    <ProtectedRoute>
      {/* 👇 Provider para funcionalidad de seguir/dejar de seguir usuarios */}
      <FollowProvider>
        {/* 👇 Provider para funcionalidad de favoritos (marcar/desmarcar publicaciones) */}
        <FavoritoProvider>
          {children}
        </FavoritoProvider>
      </FollowProvider>
    </ProtectedRoute>
  );
}
