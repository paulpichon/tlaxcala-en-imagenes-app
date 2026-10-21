// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// Estilos globales
import "./ui/globals.css";
// metadatos
import type { Metadata, Viewport } from "next";
// fonts google
// Hay 2 formas de important las fuentes
// import { open_sans, league_gothic } from './ui/fonts';
import './ui/fonts';
import AttributionCapture from "./components/AttributionCapture";
// NuevosUsuariosProvider
// metadatos
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  title: {
    default: "TlaxApp",
    template: "%s | TlaxApp",
  },
  description:
    "TlaxApp es la red social de Tlaxcala: comparte fotos con ubicación, descubre lo que pasa en el estado y conecta con su gente.",
  keywords: [
    "TlaxApp",
    "Tlaxcala",
    "red social Tlaxcala",
    "comunidad Tlaxcala",
    "fotos de Tlaxcala",
    "descubrir Tlaxcala",
    "red social local",
  ],
  authors: [{ name: "TlaxApp" }],
  creator: "TlaxApp",
  openGraph: {
    title: "TlaxApp | La red social de Tlaxcala",
    description:
      "Descubre Tlaxcala a través de fotos, historias y personas reales.",
    url: `${process.env.NEXT_PUBLIC_BASE_URL}`,
    siteName: "TlaxApp",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "TlaxApp - Tlaxcala",
      },
    ],
    locale: "es_MX",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TlaxApp",
    description: "La red social de Tlaxcala.",
    images: ["/assets/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};


// ViewPort
// ✅ Viewport global (solo aquí, no en otras páginas)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
        <AttributionCapture />
      </body>
    </html>
  );
}
