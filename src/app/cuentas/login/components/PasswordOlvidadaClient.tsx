'use client';
// Componente Cliente para Password Olvidado
// Contiene toda la lógica interactiva del formulario de recuperación

// React hooks
import { useState, useEffect } from "react";
// Redireccionar a otra página
import { useRouter } from "next/navigation";
// Estilos de página
import passwordOlvidado from "../../../ui/cuentas/login/password-olvidado/PasswordOlvidado.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "../../../components/FooterMain";
// Función API para enviar el correo de restablecer password
import { envioCorreoRestablecerPassword } from "@/lib/actions";
import { isApiError, isRateLimit, isApiErrorCode, ApiErrorCode, getUserMessage } from "@/lib/apiClient";
// Validación de correo electrónico desde usuarioSchema usando un .pick()
import { correoSchema } from "@/lib/validaciones";
import Link from "next/link";

// Constante: Tiempo de espera entre solicitudes (5 minutos)
// Previene abuso del sistema de recuperación de contraseñas
const FIVE_MINUTES_MS = 5 * 60 * 1000;
// RECOVERY_BLOCKED: ambos cubos de password-olvidado (IP + correo, 3/15 min, y
// el techo por IP de H2, 10/15 min) usan ventana de 15 minutos.
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
// localStorage: guarda el instante (ms) en que se desbloquea el botón.
const CLAVE_BLOQUEO = "lastPasswordRequest";

const guardarBloqueo = (duracionMs: number) => {
	localStorage.setItem(CLAVE_BLOQUEO, (Date.now() + duracionMs).toString());
};

/**
 * Componente Cliente principal de Password Olvidado
 * 
 * Funcionalidad:
 * - Formulario para solicitar recuperación de contraseña
 * - Validación de email en tiempo real
 * - Envío de email con enlace de recuperación
 * - Rate limiting (máximo 1 solicitud cada 5 minutos)
 * - Contador visual del tiempo restante
 * - Persistencia del bloqueo temporal con localStorage
 * 
 * Flujo:
 * 1. Usuario ingresa su email
 * 2. Sistema valida formato del email
 * 3. Sistema verifica que el email existe y la cuenta está activa
 * 4. Sistema envía email con enlace único temporal
 * 5. Usuario recibe email y hace clic en el enlace
 * 6. Sistema redirige a /login/[token] para crear nueva contraseña
 * 
 * Seguridad:
 * - Rate limiting por IP/email (5 minutos entre solicitudes)
 * - Tokens de un solo uso con expiración
 * - No revela si el email existe (previene enumeración de usuarios)
 * - Validación de formato de email antes de enviar
 */
export default function PasswordOlvidadaClient() {
	// Hook de navegación para redireccionar
	const router = useRouter();

	// Estados del formulario y validación
	const [correo, setCorreo] = useState("");
	const [mensaje, setMensaje] = useState("");
	const [error, setError] = useState("");
	const [cargando, setCargando] = useState(false);
	const [validationError, setValidationError] = useState("");

	// Estados del rate limiting (control de spam)
	const [botonDeshabilitado, setBotonDeshabilitado] = useState(false);
	const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);

	// Effect: Verificar si hay un bloqueo activo al cargar la página
	// Restaura el contador si el usuario recarga la página durante el bloqueo
	useEffect(() => {
		// localStorage para guardar la fecha de la última solicitud
		// Verificar si ya se ha enviado un correo en los últimos 5 minutos
		const desbloqueo = localStorage.getItem(CLAVE_BLOQUEO);
		if (desbloqueo) {
			const restante = Number(desbloqueo) - Date.now();

			// Tope de seguridad: un valor corrupto o en el futuro lejano no deja
			// el botón bloqueado más de la ventana máxima.
			if (restante > 0 && restante <= FIFTEEN_MINUTES_MS) {
				// Aún está dentro del período de bloqueo
				iniciarContador(Math.floor(restante / 1000));
			} else {
				// El bloqueo ya expiró (o el valor no es válido), limpiar localStorage
				localStorage.removeItem(CLAVE_BLOQUEO);
			}
		}
	}, []);

	/**
	 * Función para iniciar el contador regresivo de bloqueo
	 * @param segundos - Tiempo restante en segundos
	 * 
	 * Actualiza el estado cada segundo y desbloquea el botón cuando llega a 0
	 */
	const iniciarContador = (segundos: number) => {
		setBotonDeshabilitado(true);
		setTiempoRestante(segundos);

		const interval = setInterval(() => {
			setTiempoRestante((prev) => {
				if (prev && prev > 1) {
					return prev - 1;
				} else {
					// Contador llegó a 0
					clearInterval(interval);
					setBotonDeshabilitado(false);
					localStorage.removeItem(CLAVE_BLOQUEO);
					return null;
				}
			});
		}, 1000);
	};

	/**
	 * Manejador del submit del formulario
	 * 
	 * Proceso:
	 * 1. Valida formato del email con Zod schema
	 * 2. Llama a la API para enviar email de recuperación
	 * 3. Maneja respuestas exitosas y errores
	 * 4. Activa rate limiting para prevenir spam
	 * 5. Redirige a página de confirmación si es exitoso
	 */
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setCargando(true);
		setMensaje("");
		setError("");
		setValidationError("");

		// Paso 1: Validar el formato del correo electrónico
		// Usando el correoSchema de Zod para validación robusta
		const validation = correoSchema.safeParse({ correo });
		if (!validation.success) {
			setValidationError(validation.error.issues[0].message);
			setCargando(false);
			return;
		}
	  
		try {
			const data = await envioCorreoRestablecerPassword(correo);

			sessionStorage.setItem('passForgetToken', data.data.token);

			guardarBloqueo(FIVE_MINUTES_MS);

			router.push(`/cuentas/confirmacion/correo-enviado-restablecer-password`);
		} catch (err) {
			if (isApiError(err)) {
				const code = err.data?.code;
				if (isRateLimit(err)) {
					// RECOVERY_BLOCKED → ventana de 15 min; otro 429 → 5 min (cooldown previo).
					const bloqueoMs = isApiErrorCode(err, ApiErrorCode.RECOVERY_BLOCKED)
						? FIFTEEN_MINUTES_MS
						: FIVE_MINUTES_MS;
					setError(getUserMessage(err, 'recuperar_password'));
					guardarBloqueo(bloqueoMs);
					iniciarContador(bloqueoMs / 1000);
				} else if (code === ApiErrorCode.VALIDATION_FAILED) {
					setError(getUserMessage(err, 'recuperar_password'));
				} else {
					setError(getUserMessage(err, 'recuperar_password'));
				}
			} else {
				console.error(err);
				setError(getUserMessage(err, 'recuperar_password'));
			}
		} finally {
			setCargando(false);
		}
	};

	return (
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				
				{/* Header principal para visitantes */}
				<HeaderPrincipalTei />

				{/* Contenedor principal del formulario */}
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className={`${passwordOlvidado.contenedor_formulario}`}>
						
						{/* Títulos y descripción */}
						<div className={`${passwordOlvidado.contenedor_titulos}`}>
							<h1 className={`${passwordOlvidado.subtitulo_h3}`}>
								Recuperar contraseña
							</h1>
							<p className={passwordOlvidado.texto}>
								Te enviaremos un correo con instrucciones para restablecer tu contraseña.
							</p>
						</div>

						{/* Formulario de recuperación */}
						<div className={`${passwordOlvidado.contenedor_formulario}`}>
							<form 
								className="formulario_crear_cuenta" 
								id="recuperar_password" 
								onSubmit={handleSubmit}
							>
								{/* Campo de correo electrónico */}
								<div className="mb-4">
									<label 
										className={passwordOlvidado.label} 
										htmlFor="correo"
									>
										Correo electrónico
									</label>
									<input
										type="email"
										id="correo"
										name="correo"
										className={`form-control ${passwordOlvidado.inputs_crear_cuenta} ${
											validationError ? "is-invalid" : ""
										}`}
										placeholder="tu@email.com"
										value={correo}
										onChange={(e) => setCorreo(e.target.value)}
										disabled={cargando || botonDeshabilitado}
										aria-describedby={validationError ? "correo-error" : undefined}
										aria-invalid={validationError ? "true" : "false"}
										required
									/>
									
									{/* Mensaje de error de validación de input */}
									{validationError && (
										<div 
											id="correo-error" 
											className="invalid-feedback"
											role="alert"
										>
											{validationError}
										</div>
									)}
								</div>

								{/* Botón de submit con estados */}
								<button
									type="submit"
									className={`${passwordOlvidado.boton_registrarse}`}
									disabled={cargando || botonDeshabilitado}
									aria-busy={cargando}
								>
									{cargando
										? "Enviando..."
										: botonDeshabilitado
										? "Correo enviado"
										: "Recuperar contraseña"}
								</button>

								{/* Contador visual del tiempo restante */}
								{botonDeshabilitado && tiempoRestante !== null && (
									<p className="text-muted mt-2 small" role="status" aria-live="polite">
										Puedes volver a intentarlo en{" "}
										{Math.floor(tiempoRestante / 60)}:
										{String(tiempoRestante % 60).padStart(2, '0')} minutos
									</p>
								)}

								{/* Mensajes de éxito y error */}
								{mensaje && (
									<div className="alert alert-success mt-3" role="alert">
										{mensaje}
									</div>
								)}
								{error && (
									<div className="alert alert-danger mt-3" role="alert">
										{error}
									</div>
								)}
							</form>

							{/* Enlaces adicionales */}
							<div className="text-center mt-4">
								{/* Enlace de regreso a login */}
								<p className="text-muted small mb-2">
									¿Recordaste tu contraseña?{" "}
									<Link 
										href="/cuentas/login" 
										className="btn btn-sm"
										aria-label="Volver a iniciar sesión"
									>
										Inicia sesión
									</Link>
								</p>

								{/* Botón para volver al inicio */}
								<Link 
									href="/" 
									className="btn btn-sm"
									aria-label="Volver a la página de inicio"
								>
									← Volver al inicio
								</Link>
							</div>
						</div>
						{/* Fin contenedor_formulario interno */}

					</div>
					{/* Fin contenedor_formulario principal */}
				</div>
				{/* Fin columna */}

				{/* Footer principal */}
				<FooterMain />
				
			</div>
			{/* Fin row */}
		</div>
		// Fin container
	);
}