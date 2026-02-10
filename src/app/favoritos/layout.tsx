// Favoritos Layout
// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// ❌ NO incluir metadata aquí - se define en page.tsx para mayor flexibilidad
// ❌ NO incluir <html>, <body>, <head> - solo en el layout raíz (src/app/layout.tsx)
// ✅ Este layout solo contiene providers y componente de protección

// Fonts globales
import "../ui/fonts";
// Componente de protección de rutas
import ProtectedRoute from "@/components/ProtectedRoute";
// Contextos globales
import { FollowProvider } from "@/context/FollowContext";
import { FavoritoProvider } from "@/context/FavoritoContext";

/**
 * Layout anidado para la página de Favoritos
 * - Protege la ruta con autenticación (solo usuarios autenticados)
 * - Provee contextos de seguimiento y favoritos
 * - No incluye metadata (se define en page.tsx)
 * 
 * Esta página muestra las publicaciones que el usuario ha guardado como favoritas
 */
export default function FavoritosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Ruta protegida - requiere autenticación obligatoria
    <ProtectedRoute>
      {/* Provider para funcionalidad de seguir/dejar de seguir usuarios */}
      <FollowProvider>
        {/* Provider para funcionalidad de favoritos (marcar/desmarcar publicaciones) */}
        <FavoritoProvider>
          {children}
        </FavoritoProvider>
      </FollowProvider>
    </ProtectedRoute>
  );
}