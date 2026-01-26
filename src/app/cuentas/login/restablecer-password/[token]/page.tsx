// Pagina restablecer password
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import restaPasssword from "@/app/ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "@/app/components/FooterMain";
// Importar el formulario para restablecer la contraseña
import FormularioNuevaPassword from "../components/Formulario";
// Importar la funcion para validar el token
import { validarTokenRestablecerPassword } from "@/lib/actions";
import Link from "next/link";

// export default async function RestablecerPassword({ params }: Props) {
export default async function RestablecerPassword({ 
    params
 }: { 
    params: Promise<{ token: string }> 
}) {
	// Extraer el token de la URL
	const { token } = await params;
	// Funcion para verificar el token
	// La fguncion validarTokenRestablecerPassword se encarga de hacer la peticion a la API para validar si el token que esta en la URL es valido o no
	const res = await validarTokenRestablecerPassword(token);
	// Respuesta de la API
	const data = await res.json();
	
	// Verificar si la respuesta es exitosa y si el data.valid es válido
	const tokenValido = res.ok && data.valid;
	// Si es válido, renderiza el formulario
	return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				<HeaderPrincipalTei />

				<div className="col-sm-9 col-md-7 col-lg-6">
					{tokenValido ? (
						<div className={`${restaPasssword.contenedor_formulario}`}>
							<div className={`${restaPasssword.contenedor_titulos}`}>
								<h3 className={`${restaPasssword.subtitulo_h3}`}>Reestablecer contraseña</h3>
								<div className={restaPasssword.icono}>
									🔒
								</div>
								<p className={restaPasssword.texto}>
									Elige una nueva contraseña segura para tu cuenta.
								</p>

							</div>
							{/* Formulario para restablecer la contraseña */}
							{/* Se le pasa el token como prop al formulario */}
							{/* El formulario se encarga de hacer la peticion a la API para restablecer la contraseña */}
							{/* El formulario se encarga de validar el token y el nuevo password */}
							{/* El formulario se encarga de mostrar los errores si los hay */}
							{/* El formulario se encarga de redirigir al usuario a la pagina de confirmacion si todo sale bien */}
							<FormularioNuevaPassword token={token} />
						</div>
					) : (
						<div className="text-center mt-5">
							<h3>Este enlace ya no es válido</h3>
							<p>Por seguridad, los enlaces para cambiar contraseña solo funcionan por tiempo limitado.</p>
							<Link className="text-decoration-none text-black" href="/cuentas/login/password-olvidado">
								Solicitar uno nuevo
							</Link>
						</div>
					)}
				</div>

				<FooterMain />
			</div>
		</div>
	);
}
