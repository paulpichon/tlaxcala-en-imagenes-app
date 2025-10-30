// Página cuenta verificada
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import cuentaVerificada from "../../../../ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";
import Link from "next/link";

export default async function CuentaVerificada ({ 
    params
 }: { 
    params: Promise<{ token: string }> 
}) {
    try {
        // Obtenemos el token de la URL
    const { token } = await params;
    // Verificamos el token con una API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL_LOCAL}/api/auth/verificar-correo/${token}`, 
        { cache: "no-store"}
    );
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
                                        <Link className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión.</Link>
                                    </p>
                                </div>    
                            ) : (
                                <div className={cuentaVerificada.contenedor_titulos}>   
                                    <h3 className={cuentaVerificada.subtitulo_h3}>Token inválido o ha expirado.</h3>
                                    <p className={cuentaVerificada.texto}><Link className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión</Link>
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
        // Verificar el manejo de este error, en caso de que haya
        console.log(error);
    }
}
