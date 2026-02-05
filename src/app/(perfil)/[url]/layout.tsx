import { Metadata } from "next";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FollowProvider } from "@/context/FollowContext";
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
      <FollowProvider>
        <FavoritoProvider>
          {children}
        </FavoritoProvider>
      </FollowProvider>
    </ProtectedRoute>
  );
}