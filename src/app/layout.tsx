// AuthProvider
import { AuthProvider } from '@/context/AuthContext';
// Estilos globales
import "./ui/globals.css";
// metadatos
import type { Metadata } from "next";
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
  title: "TlaxApp | Entrar o registrarse",
  description: "Tlaxcala, en una sola app.",
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
