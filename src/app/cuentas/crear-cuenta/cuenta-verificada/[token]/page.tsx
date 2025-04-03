// Página cuenta verificada
// "use client";
// Use effect, use state
// import { useEffect, useState } from "react";
// import { useRouter, useSearchParams } from "next/navigation";

// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// estilos de la pagina
import cuentaVerificada from "../../../ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterPrincipal from "@/app/components/FooterMain";


export default async function CuentaVerificada ({ 
    params
 }: { 
    params: Promise<{ token: string }> 
}) {

    // const router = useRouter();
    // const searchParams = useSearchParams();
    // const token = searchParams.get("token");

    // const [mensaje, setMensaje] = useState<string>("Verificando...");
    // const [error, setError] = useState<boolean>(false);
    // console.log(token);
    

    // useEffect(() => {
    //     if (!token) return; // Esperar a que Next.js obtenga el token

    //     const verificarToken = async () => {
    //         try {
    //             const response = await fetch(`https://login-autenticacion.onrender.com/api/auth/verificar-correo/${token}`);
    //             console.log(response, "respuesta");
                
    //             const data: { ok: boolean; msg: string } = await response.json();

    //             if (data.ok) {
    //                 setMensaje("¡Correo verificado con éxito! 🎉");
    //                 setTimeout(() => router.push("/cuentas/crear-cuenta"), 3000);
    //             } else {
    //                 setMensaje("El token no es válido o ha expirado.");
    //                 setError(true);
    //             }
    //         } catch (err) {
    //             console.log(err);
                
    //             setMensaje("Hubo un error al verificar el correo.");
    //             setError(true);
    //         }
    //     };

    //     verificarToken();
    // }, [token, router]);

    const { token } = await params;

    // Verificamos el token con una API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verificar-correo/${token}`);
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
                                    <h3 className={cuentaVerificada.subtitulo_h3}>Esta cuenta ya ha sido verificada</h3>
                                    <p className={cuentaVerificada.texto}>Ahora puedes  
                                        <a className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión</a>
                                    </p>
                                </div> 
                            )}
                        </div>
                    </div>
                <FooterPrincipal />
            </div>
        </div>
        // <div className="flex flex-col items-center justify-center h-screen">
        //     <h2 className={`text-xl ${error ? "text-red-500" : "text-green-500"}`}>
        //         {mensaje}
        //     </h2>
        // </div>
        // <div className="container-fluid container-xl">
        //     <div className="row justify-content-center contenedor_principal">
        //         {/* Header */}
        //         <HeaderPrincipalTei />
        //         <div className="col-sm-9 col-md-7 col-lg-6">
        //             <div className={cuentaVerificada.contenedor_formulario}>
        //                 <div className={cuentaVerificada.contenedor_titulos}>
        //                     <h3 className={cuentaVerificada.subtitulo_h3}>Cuenta verificada</h3>
        //                     <p className={cuentaVerificada.texto}>Ahora puedes  
        //                         <a className={cuentaVerificada.link_inciar_sesion} href="/cuentas/login"> iniciar sesión</a>.
        //                     </p>
        //                 </div>
        //             </div>
        //         </div>
        //         {/* footer */}
        //         <FooterPrincipal />
        //     </div>
        // </div> 
    );
}
