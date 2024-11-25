// Estilos globales
import "./ui/globals.css";
// metadatos
import type { Metadata } from "next";
// fonts google
// Hay 2 formas de important las fuentes
// import { open_sans, league_gothic } from './ui/fonts';
import './ui/fonts';
// metadatos
export const metadata: Metadata = {
  title: "Tlaxcala En Imágenes | Entrar o registrarse",
  description: "El lugar donde encuentras gente de Tlaxcala",
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
