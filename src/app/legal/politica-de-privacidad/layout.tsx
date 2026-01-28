// Layout de la página de política de privacidad

// import "./ui/globals.css";
// import "./ui/fonts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad | TlaxApp",
  description:
    "Consulta la política de privacidad de TlaxApp y conoce cómo protegemos y tratamos tus datos personales.",
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
