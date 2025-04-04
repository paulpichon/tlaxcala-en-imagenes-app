// Página cuenta verificada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import cuentaVerificada from "../../../../ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";

export default async function CuentaVerificada ({ 
    params
 }: { 
    params: Promise<{ token: string }> 
}) {
    try {
        // Obtenemos el token de la URL
        const { token } = await params;

        // Verificamos el token con una API
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verificar-correo/${token}`, {
            cache: "no-store", // evita cache y fuerza nueva petición
        });
        if (!response.ok) {
            throw new Error("Error al verificar el correo");
        }
        const data = await response.json();

        return (
            <div className="container-fluid container-xl">
                <div className="row justify-content-center contenedor_principal">
                    <HeaderPrincipalTei />
                        <div className="col-sm-9 col-md-7 col-lg-6">
                            <div className={cuentaVerificada.contenedor_formulario}>
                                {data.ok ? (
                                    <div className={cuentaVerificada.contenedor_titulos}>   
                                        <h3 className={cuentaVerificada.subtitulo_h3}>Cuenta verificada</h3>
                                        <p className={cuentaVerificada.texto}>Ahora puedes  
                                            <a className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión.</a>
                                        </p>
                                    </div>    
                                ) : (
                                    <div className={cuentaVerificada.contenedor_titulos}>   
                                        <h3 className={cuentaVerificada.subtitulo_h3}>Token inválido o ha expirado.</h3>
                                        <p className={cuentaVerificada.texto}><a className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión</a>
                                        </p>
                                    </div> 
                                )}
                            </div>
                        </div>
                    <FooterPrincipal />
                </div>
            </div>
        );
    } catch (error) {
        console.log(error);
        return <h3 className={cuentaVerificada.subtitulo_h3}>Hubo un error al verificar el correo.</h3>;
    }
}
