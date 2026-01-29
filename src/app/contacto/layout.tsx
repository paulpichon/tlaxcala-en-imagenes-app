// Layout de la página de contacto

// import "./ui/globals.css";
// import "./ui/fonts";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contacto | TlaxApp",
  description:
    "Información de contacto de TlaxApp. Si tienes preguntas, comentarios o necesitas asistencia, no dudes en ponerte en contacto con nosotros a través de nuestro correo electrónico",
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
