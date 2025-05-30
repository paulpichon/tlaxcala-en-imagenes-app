// Inicio
// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97
// Link_activo: color del link activo
import "../ui/globals.css";
// Meta datos NEXTJS
import { Metadata } from "next";
// Fonts
import "../ui/fonts";
// Ruta potegida
import ProtectedRoute from "@/components/ProtectedRoute";
// metadatos
export const metadata: Metadata = {
    title: "Tlaxcala en imágenes",
    description: "Perfil de usuario - Magali Jimenez",
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
            {children}
          </ProtectedRoute>
        </body>
      </html>
    );
  }