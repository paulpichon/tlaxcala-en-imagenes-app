// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// Meta datos NEXTJS
import { Metadata } from "next";
// Fonts
import "../../../ui/fonts";
// viewport
import type { Viewport } from 'next';
// Viewport meta tag for responsive design
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // Also supported by less commonly used
  // interactiveWidget: 'resizes-visual',
}
// metadatos
export const metadata: Metadata = {
    title: "TlaxApp | Olvidé la contraseña",
    description: "Password olvidado, recuperar contraseña de usuario.",
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