// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// Meta datos NEXTJS
import { Metadata } from "next";
// Fonts
import "../../../ui/fonts";
// metadatos
export const metadata: Metadata = {
    title: "Correo enviado | Tlaxcala En Imágenes",
    description: "Correo de verificación de cuenta creada, Tlaxcala en imágenes",
  };

export default function RootLayout({
    children,
  }: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html lang="es">
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <body>
          {children}
        </body>
      </html>
    );
  }