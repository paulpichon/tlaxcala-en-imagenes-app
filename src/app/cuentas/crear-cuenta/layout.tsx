// Se usara Layouts Anidados en la estructura del proyecto
// https://chatgpt.com/c/674542f3-d5bc-8002-847c-c817ca29ba97

// ❌ NO incluir metadata aquí - se define en page.tsx para mayor flexibilidad
// ❌ NO incluir <html>, <body>, <head> - solo en el layout raíz (src/app/layout.tsx)
// ✅ Este layout solo contiene el componente de redirección

// Redireccion de usuario autenticado
// Si el usuario ya tiene sesión activa, lo redirige a /inicio
// Esto evita que usuarios logueados accedan a la página de registro
import AlreadyAuthRedirect from "@/components/AlreadyAuthRedirect";
// Fonts globales
import "../../ui/fonts";

/**
 * Layout para la página de crear cuenta
 * - Redirige automáticamente a usuarios ya autenticados
 * - Permite acceso solo a visitantes sin sesión
 * - No incluye metadata (se define en page.tsx)
 */
export default function CrearCuentaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Wrapper que redirige si el usuario ya está autenticado
    <AlreadyAuthRedirect>
      {children}
    </AlreadyAuthRedirect>
  );
}