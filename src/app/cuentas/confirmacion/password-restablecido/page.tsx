// Página password restablecida
"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina CSS modules
import styPassRes from "../../../ui/cuentas/confirmacion/password-restablecido/PasswordRestablecido.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default function ConfirmacionPasswordRestablecido() {
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
                                <a href="/cuentas/login" className={`${ styPassRes.boton_registrarse}`}>Iniciar sesión</a>
                            </p>
                        </div>
                    </div>
                </div>
                {/* Footer principal */}
                <FooterPrincipal />
            </div>
        </div>
    );
}