"use client";
// Componente Cliente para Confirmación de que la ocntraseña ha sido restablecida exitosamente
// Valida que el usuario llegó aquí desde el flujo correcto
// Redirige automáticamente después de mostrar el mensaje de confirmación

// React hooks
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de la página CSS modules
import styPassRes from "../../../ui/cuentas/confirmacion/password-restablecido/PasswordRestablecido.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterPrincipal from "@/app/components/FooterMain";
import Link from "next/link";

/**
 * Componente Cliente de Confirmación - Email Enviado para Restablecer Password
 * 
 * Funcionalidad:
 * - Valida que el usuario llegó aquí desde /password-olvidado
 * - Verifica token de sesión (passForgetToken en sessionStorage)
 * - Muestra mensaje de confirmación con instrucciones
 * - Redirige automáticamente a /login después de 7 segundos
 * - Previene acceso directo a la URL sin contexto previo
 * 
 * Seguridad:
 * - Requiere token en sessionStorage (creado en /password-olvidado)
 * - Redirige a /login si no hay token (acceso directo no permitido)
 * - Limpia el token después de mostrar la confirmación
 * - Auto-redirección para evitar que el usuario se quede en la página
 * 
 * Flujo de validación:
 * 1. useEffect verifica sessionStorage al montar el componente
 * 2. Si existe 'passForgetToken': muestra confirmación
 * 3. Si NO existe 'passForgetToken': redirige a /login
 * 4. Después de 7 segundos: limpia token y redirige a /login
 * 5. Si el usuario desmonta el componente: limpia el timer
 */
export default function ConfirmacionPasswordRestablecidoClient() {
    // Hook para redireccionar
    // useRouter es un hook de Next.js que permite acceder a la instancia del router
    const router = useRouter();
    // Hook para manejar el estado de la confirmación
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    // Hook para manejar el estado de la carga
    useEffect(() => {
        // Verifica si el sessionStorage tiene el flag de éxito
        const success = sessionStorage.getItem("passwordResetSuccess");
        // Si el flag existe, significa que la contraseña fue restablecida exitosamente
        if (success) {
            // Muestra la confirmación
            setMostrarConfirmacion(true);
            // Redirige después de 5 segundos
            const timer = setTimeout(() => {
                // Limpia el sessionStorage
                // Esto es para evitar que el usuario acceda a esta página directamente sin haber restablecido la contraseña
                sessionStorage.removeItem("passwordResetSuccess");
                // Redirige al usuario a la página de inicio de sesión
                // Esto es para evitar que el usuario acceda a esta página directamente sin haber restablecido la contraseña
                router.replace("/cuentas/login");
            }, 7000);
            // Limpieza en caso de desmontaje
            return () => clearTimeout(timer); 
        } else {
            // Si no hay un flag en el sessionStorage, redirigir al usuario a la página de inicio de sesión
            // Esto es para evitar que el usuario acceda a esta página directamente sin haber restablecido la contraseña
            router.replace("/cuentas/login");
        }
    }, [router]);
    // Si no hay un flag en el sessionStorage, redirigir al usuario a la página de inicio de sesión
    // Esto es para evitar que el usuario acceda a esta página directamente sin haber restablecido la contraseña
    if (!mostrarConfirmacion) return null;

  return (
    <div className="container-fluid container-xl">
        <div className="row justify-content-center contenedor_principal">
            {/* Header principal */}
            < HeaderPrincipalTei />
            <div className="col-sm-9 col-md-7 col-lg-6">
                <div className={`${styPassRes.contenedor_formulario}`}>
                    <div className={`${ styPassRes.contenedor_titulos}`}>
                        <h3 className={`${ styPassRes.subtitulo_h3}`}>Contraseña restablecida</h3>
                        <p className={`${ styPassRes.texto}`}>Ahora puedes iniciar sesión</p>
                    </div>
                    <div className="cool-md-12 text-center mt-2">
                        <p className={`${ styPassRes.pregunta}`}>
                            <Link href="/cuentas/login" className={`${ styPassRes.boton_registrarse}`}>Iniciar sesión</ Link>
                        </p>
                    </div>
                </div>
            </div>
            {/* Footer principal */}
            <FooterPrincipal />
        </div>
    </div>
    // Fin container
  );
}