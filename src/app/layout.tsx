// AuthProvider
import { AuthProvider } from '@/context/AuthContext';
// Estilos globales
import "./ui/globals.css";
// metadatos
import type { Metadata, Viewport } from "next";
// fonts google
// Hay 2 formas de important las fuentes
// import { open_sans, league_gothic } from './ui/fonts';
import './ui/fonts';
// NotificacionesProvider
import { NotificacionesProvider } from '@/context/NotificacionesContext';
// NuevosUsuariosProvider
import { NuevosUsuariosProvider } from '@/context/NuevosUsuariosContext';
import { PublicidadProvider } from '@/context/PublicidadContext';
// metadatos
export const metadata: Metadata = {
  title: {
    default: "TlaxApp",
    template: "%s | TlaxApp",
  },
  description:
    "TlaxApp es la red social de Tlaxcala. Comparte fotos, descubre lugares, conecta con personas y vive Tlaxcala a través de su gente.",
  keywords: [
    "Tlaxcala",
    "TlaxApp",
    "red social Tlaxcala",
    "lugares de Tlaxcala",
    "personas de Tlaxcala",
    "turismo Tlaxcala",
  ],
  authors: [{ name: "TlaxApp" }],
  creator: "TlaxApp",
  openGraph: {
    title: "TlaxApp | Tlaxcala, contada por su gente",
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
    description: "Tlaxcala, contada por su gente.",
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
        <AuthProvider>
            <NotificacionesProvider>
              <NuevosUsuariosProvider>
                <PublicidadProvider>
                  {children}
                </PublicidadProvider>
              </NuevosUsuariosProvider>
            </NotificacionesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
