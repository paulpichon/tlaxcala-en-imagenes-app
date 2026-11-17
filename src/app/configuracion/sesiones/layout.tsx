// Fonts globales
import "../../ui/fonts";
// Componente de protección de rutas
import ProtectedRoute from "@/components/ProtectedRoute";
// Contextos globales
import { FavoritoProvider } from "@/context/FavoritoContext";

/**
 * Layout anidado para la página de sesiones activas
 * - Protege la ruta con autenticación (solo usuarios autenticados)
 * - No incluye metadata (se define en page.tsx)
 */
export default function SesionesActivasLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ProtectedRoute>
      <FavoritoProvider>{children}</FavoritoProvider>
    </ProtectedRoute>
  );
}
