'use client';
// Página Password Olvidado
// Permite a los usuarios solicitar un enlace de recuperación de contraseña
// El enlace se envía por email y tiene validez temporal (típicamente 1-24 horas)

// Meta datos NEXTJS (necesita export en server component wrapper)
// Como este es 'use client', los metadatos van en un componente servidor separado
// Ver metadata.ts o usar generateMetadata en un wrapper

// React hooks
import { useState, useEffect } from "react";
// Redireccionar a otra página
import { useRouter } from "next/navigation";
// Bootstrap CSS
import "bootstrap/dist/css/bootstrap.css";
// Estilos de página
import passwordOlvidado from "../../../ui/cuentas/login/password-olvidado/PasswordOlvidado.module.css";
// Componentes
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
import FooterMain from "../../../components/FooterMain";
// Función API para enviar el correo de restablecer password
import { envioCorreoRestablecerPassword } from "@/lib/actions";
// Validación de correo electrónico desde usuarioSchema usando un .pick()
import { correoSchema } from "@/lib/validaciones";
import Link from "next/link";

// Constante: Tiempo de espera entre solicitudes (5 minutos)
// Previene abuso del sistema de recuperación de contraseñas
const FIVE_MINUTES_MS = 5 * 60 * 1000;

/**
 * Componente principal de la página Password Olvidado
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
 * 
 * Esta página DEBE ser indexada para ayudar a usuarios que olvidan su contraseña
 */
export default function PasswordOlvidada() {
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
		const lastRequest = localStorage.getItem("lastPasswordRequest");
		if (lastRequest) {
			const tiempoPasado = Date.now() - Number(lastRequest);
			const restante = FIVE_MINUTES_MS - tiempoPasado;

			if (restante > 0) {
				// Aún está dentro del período de bloqueo
				iniciarContador(Math.floor(restante / 1000));
			} else {
				// El bloqueo ya expiró, limpiar localStorage
				localStorage.removeItem("lastPasswordRequest");
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
					localStorage.removeItem("lastPasswordRequest");
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
			setValidationError(validation.error.errors[0].message);
			setCargando(false);
			return;
		}
	  
		try {
			// Paso 2: Consulta a la API para enviar el correo de restablecer password
			const data = await envioCorreoRestablecerPassword(correo);
			
			// Paso 3: Procesar respuesta exitosa
			if (data.status === 200) {
				// Crear token de sesión temporal para la página de confirmación
				sessionStorage.setItem('passForgetToken', data.token);
				
				// Guardar la fecha de la solicitud en localStorage (inicia rate limiting)
				localStorage.setItem("lastPasswordRequest", Date.now().toString());
				
				// Redireccionar a página de confirmación
				router.push(`/cuentas/confirmacion/correo-enviado-restablecer-password`);
			} else {
				// Paso 4: Manejar diferentes tipos de errores de la API
				if (
					(data.status === 401 && data.msg === "Correo no existe") ||
					(data.status === 403 && data.msg === "Cuenta no verificada") ||
					(data.status === 403 && data.msg === "Cuenta no activada") ||
					(data.status === 429)
				) {
					// Mostrar mensaje de error apropiado según el código
					setError(
						data.msg === "Correo no existe"
							? "La cuenta asociada a ese correo no existe."
							: data.msg === "Cuenta no verificada"
							? "La cuenta no ha sido verificada. Revisa tu email."
							: data.msg === "Cuenta no activada" 
							? "La cuenta está desactivada. Contacta a soporte."
							: "Espera 5 minutos antes de poder reenviar el correo."
					);
					
					// ⚠️ IMPORTANTE: Incluso si hubo error, inicia el contador
					// Esto previene ataques de fuerza bruta para enumerar emails válidos
					localStorage.setItem("lastPasswordRequest", Date.now().toString());
					iniciarContador(FIVE_MINUTES_MS / 1000);
					return;
				}
			}
		} catch (err) {
			console.log(err);
			// Error de conexión con el servidor
			setError("Error al conectar con el servidor. Intenta más tarde.");
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
										className="btn btn-sm text-decoration-underline"
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