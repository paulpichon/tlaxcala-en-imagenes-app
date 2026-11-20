// AuthProvider
import { AuthProvider } from '@/context/AuthContext';
// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css';
// Estilos globales
import "./ui/globals.css";
// metadatos
import type { Metadata, Viewport } from "next";
// fonts google
// Hay 2 formas de important las fuentes
import './ui/fonts';
// NotificacionesProvider
import { NotificacionesProvider } from '@/context/NotificacionesContext';
// NuevosUsuariosProvider
import { NuevosUsuariosProvider } from '@/context/NuevosUsuariosContext';
import { PublicidadProvider } from '@/context/PublicidadContext';
import { FollowProvider } from '@/context/FollowContext';
// Recursos de PWA para iOS (iconos y pantallas de arranque)
import { ICONO_APPLE_TOUCH, IMAGENES_ARRANQUE_IOS } from '@/lib/pwa';
// metadatos
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
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
  // PWA en iOS (requisito de Web Push): icono de pantalla de inicio y modo web app.
  icons: {
    apple: ICONO_APPLE_TOUCH, // 180×180 con fondo blanco (el PNG transparente se veía sobre negro)
  },
  appleWebApp: {
    capable: true,
    title: "TlaxApp",
    statusBarStyle: "default",
    startupImage: IMAGENES_ARRANQUE_IOS, // pantalla de arranque (iOS ignora el manifest)
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
              <FollowProvider>
                <NuevosUsuariosProvider>
                  <PublicidadProvider>
                    {children}
                  </PublicidadProvider>
                </NuevosUsuariosProvider>
              </FollowProvider>
            </NotificacionesProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
