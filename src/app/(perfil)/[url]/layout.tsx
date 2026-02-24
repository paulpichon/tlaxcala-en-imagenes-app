import ProtectedRoute from "@/components/ProtectedRoute";
import { FavoritoProvider } from "@/context/FavoritoContext";

// SEO en la pagina page.tsx
// ✅ CORRECTO - Sin <html> ni <body>
export default function PerfilLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
        <FavoritoProvider>
          {children}
        </FavoritoProvider>
    </ProtectedRoute>
  );
}