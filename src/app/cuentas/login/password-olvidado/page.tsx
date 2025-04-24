'use client';
// Página Password olvidado
import { useState } from "react";
// para redireccionar a otra pagina
import { useRouter } from "next/navigation";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import passwordOlvidado from "../../../ui/cuentas/login/password-olvidado/PasswordOlvidado.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "../../../components/FooterMain";
// Funcion API para enviar el correo de restablecer password
import { envioCorreoRestablecerPassword } from "@/lib/actions";


export default function PasswordOlvidada() {
	// Redireccionar a otra pagina
	const router = useRouter();
	// Estado de envio del formulario
	const [correo, setCorreo] = useState("");
	const [mensaje, setMensaje] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);

	// manejo del submit del formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setCargando(true);
		setMensaje("");
		setError("");
	  
		try {
			// Consulta de la API para enviar el correo de restablecer password
			const data = await envioCorreoRestablecerPassword( correo );
			// Si la respuesta es correcta, creamos el TOKEN y redireccionar a la pagina de confirmacion
			if (data.status === 200) {
				// crear token de sesion
				sessionStorage.setItem('passForgetToken', data.token);
				// Redireccionar a pagina de registro exitoso
				router.push(`/cuentas/confirmacion/correo-enviado-restablecer-password`);
			} else {
				// Si la respuesta no es correcta, mostramos el mensaje de error
				setError(data?.mensaje || "Ocurrió un error");
			}
		} catch (err) {
			console.log( err );
			// error de conexion
		  	setError("Error al conectar con el servidor");
		} 	finally {
		  	setCargando(false);
		}
	};

    return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				{/* Header */}
                <HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className={`${passwordOlvidado.contenedor_formulario}`}>
						<div className={`${passwordOlvidado.contenedor_titulos}`}>
							<h3 className={`${passwordOlvidado.subtitulo_h3}`}>Recuperar contraseña</h3>
                            <p className={`${passwordOlvidado.texto}`}>Introduce tu correo electrónico</p>
						</div>
						<div className={`${passwordOlvidado.contenedor_formulario}`}>
						<form className="formulario_crear_cuenta" id="iniciar_sesion" onSubmit={handleSubmit}>
							<div className="mb-4">
								<input
								type="email"
								className={`form-control ${passwordOlvidado.inputs_crear_cuenta}`}
								id="correo"
								placeholder="Correo electrónico"
								value={correo}
								onChange={(e) => setCorreo(e.target.value)}
								required
								/>
							</div>
							<button type="submit" className={`${passwordOlvidado.boton_registrarse}`} disabled={cargando}>
								{cargando ? "Enviando..." : "Recuperar contraseña"}
							</button>
								{mensaje && <div className="alert alert-success mt-3">{mensaje}</div>}
								{error && <div className="alert alert-danger mt-3">{error}</div>}
							</form>
						</div>
					</div>
				</div>
				{/* Footer */}
                <FooterMain />
			</div>
		</div>
    );
}
