'use client';
// Página Password olvidado
import { useState, useEffect  } from "react";
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
// Validacion de correo electronico desde usuarioschema usando un .pick()
import { correoSchema } from "@/lib/validaciones";

// Tiempo 5 minutos
const FIVE_MINUTES_MS = 5 * 60 * 1000;


export default function PasswordOlvidada() {
	// Redireccionar a otra pagina
	const router = useRouter();
	// Estado de envio del formulario
	const [correo, setCorreo] = useState("");
	const [mensaje, setMensaje] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);
	// Validacion de correo
	const [validationError, setValidationError] = useState("");
	// Desabilitar el boton de enviar
	const [botonDeshabilitado, setBotonDeshabilitado] = useState(false);
	// tiempo restante
	const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

	// Validar el correo al cambiar el input
	useEffect(() => {
		// Localstorage para guardar la fecha de la solicitud
		// Verificar si ya se ha enviado un correo en los últimos 5 minutos
		const lastRequest = localStorage.getItem("lastPasswordRequest");
		if (lastRequest) {
			if (lastRequest) {
				const tiempoPasado = Date.now() - Number(lastRequest);
				const restante = FIVE_MINUTES_MS - tiempoPasado;
	
				if (restante > 0) {
					iniciarContador(Math.floor(restante / 1000));
				} else {
					localStorage.removeItem("lastPasswordRequest");
				}
			}
		}
	}, []);

	// contador para el tiempo restante
	const iniciarContador = (segundos: number) => {
		setBotonDeshabilitado(true);
		setTiempoRestante(segundos);
		// Guardar la fecha de la solicitud en localStorage
		const interval = setInterval(() => {
			setTiempoRestante((prev) => {
				if (prev && prev > 1) {
					return prev - 1;
				} else {
					clearInterval(interval);
					setBotonDeshabilitado(false);
					localStorage.removeItem("lastPasswordRequest");
					return null;
				}
			});
		}, 1000);
	};

	// manejo del submit del formulario
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setCargando(true);
		setMensaje("");
		setError("");
		// Validacion de input de correo
		setValidationError("");

		// Validar el input del correo
		// Usando el usarioSchema de mi archivo validaciones.ts
		const validation = correoSchema.safeParse({ correo });
		if (!validation.success) {
			setValidationError(validation.error.errors[0].message);
			setCargando(false);
			return;
		}
	  
		try {
			// Consulta de la API para enviar el correo de restablecer password
			const data = await envioCorreoRestablecerPassword( correo );
			// Si la respuesta es correcta, creamos el TOKEN y redireccionar a la pagina de confirmacion
			
			if (data.status === 200) {
				// crear token de sesion
				sessionStorage.setItem('passForgetToken', data.token);
				// Guardar la fecha de la solicitud en localStorage
				localStorage.setItem("lastPasswordRequest", Date.now().toString());
				// Redireccionar a pagina de registro exitoso
				router.push(`/cuentas/confirmacion/correo-enviado-restablecer-password`);
			} else {
				// Si la respuesta es un error, mostrar el mensaje de error
				if (
					(data.status === 401 && data.msg === "Correo no existe") ||
					(data.status === 403 && data.msg === "Cuenta no verificada") ||
					(data.status === 403 && data.msg === "Cuenta no activada") ||
					(data.status === 429)
				) {
					// Si el error es 401, 403 o 429, mostrar el mensaje de error
					setError(data.msg === "Correo no existe"
						? "La cuenta asociada a ese correo no existe."
						: data.msg === "Cuenta no verificada"
						? "La cuenta no ha sido verificada."
						: data.msg === "Cuenta no activada" 
						? "La cuenta está desactivada, contacta a soporte."
						: "Espera 5 minutos antes de poder reenviar el correo."
						
					);
					// y guardar la fecha de la solicitud en localStorage
					// ⚠️ Incluso si hubo error, empieza el contador
					localStorage.setItem("lastPasswordRequest", Date.now().toString());
					iniciarContador(FIVE_MINUTES_MS / 1000);
					return;
				}

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
									className={`form-control ${passwordOlvidado.inputs_crear_cuenta} ${validationError ? "is-invalid" : ""}`}
									placeholder="Correo electrónico"
									value={correo}
									onChange={(e) => setCorreo(e.target.value)}
								/>
								{/* Mensaje de error de validacion de input */}
								{validationError && (
									<div className="invalid-feedback">
										{validationError}
									</div>
								)}
							</div>
							{/* bloqueo boton */}
							<button
								type="submit"
								className={`${passwordOlvidado.boton_registrarse}`}
								disabled={cargando || botonDeshabilitado}
							>
								{cargando ? "Enviando..." : botonDeshabilitado ? "Espera unos minutos..." : "Recuperar contraseña"}
							</button>
								{botonDeshabilitado && tiempoRestante !== null && (
								<p className="text-danger mt-2">
									Puedes volver a intentarlo en {Math.floor(tiempoRestante / 60)}:
									{String(tiempoRestante % 60).padStart(2, '0')} minutos
								</p>
							)}
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
