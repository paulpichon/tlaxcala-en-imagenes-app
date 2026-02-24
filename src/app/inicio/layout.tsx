// Inicio
// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97
import ProtectedRoute from "@/components/ProtectedRoute";
import { FavoritoProvider } from "@/context/FavoritoContext";

// ❌ NO incluir metadata aquí - se hereda del layout principal
// ❌ NO incluir <html>, <body>, <head> - solo en layout raíz

export default function InicioLayout({
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