// Inicio
// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// Meta datos NEXTJS
import { Metadata } from "next";
// Fonts
import "../ui/fonts";
import ProtectedRoute from "@/components/ProtectedRoute";
import { FollowProvider } from "@/context/FollowContext";
import { FavoritoProvider } from "@/context/FavoritoContext";
// metadatos
export const metadata: Metadata = {
    title: "TlaxApp | Notificaciones",
    description: "El lugar donde encuentras gente de Tlaxcala",
  };

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="es">
        <head>
            <meta
            name="viewport"
            content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
            />
        </head>
        
        <body>
          <ProtectedRoute>
            <FollowProvider>
              <FavoritoProvider>
                {children}
              </FavoritoProvider>
             </FollowProvider>
          </ProtectedRoute>
        </body>
      </html>
    );
  }