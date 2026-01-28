// Layout de la página de términos y condiciones
// Metadata y estructura básica
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos y Condiciones | TlaxApp",
  description: "Consulta los términos y condiciones de TlaxApp y conoce cómo protegemos y tratamos tus datos personales.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
