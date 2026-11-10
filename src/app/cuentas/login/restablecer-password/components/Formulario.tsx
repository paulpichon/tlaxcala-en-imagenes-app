"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import Link from "next/link";
import { resetPasswordSchema, ResetPasswordSchema } from "@/lib/validaciones";
import styles from "@/app/ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
import {
	apiPost,
	isApiError,
	isTokenExpired,
	isUnauthorized,
	getUserMessage,
} from "@/lib/apiClient";

// El enlace puede vencer (o usarse) mientras el formulario está abierto.
// 'expirado' = 401 TOKEN_EXPIRED; 'invalido' = 401 UNAUTHORIZED.
type EstadoEnlace = "vigente" | "expirado" | "invalido";

export default function FormularioNuevaPassword({ token }: { token: string }) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordSchema>({
		resolver: zodResolver(resetPasswordSchema),
	});

	const router = useRouter();
	const [serverError, setServerError] = useState("");
	const [loading, setLoading] = useState(false);
	const [estadoEnlace, setEstadoEnlace] = useState<EstadoEnlace>("vigente");
	const enlaceMuerto = estadoEnlace !== "vigente";

	const onSubmit = async (data: ResetPasswordSchema) => {
		setServerError("");
		setLoading(true);

		try {
			// fetch directo (no fetchWithAuth): los 401 de este endpoint son del
			// enlace, no de la sesión, y nunca deben disparar renovarSesion().
			await apiPost(fetch, `/api/auth/cuentas/reestablecer-password/${token}`, {
				password: data.password,
			});

			sessionStorage.setItem('passwordResetSuccess', 'true');
			router.push("/cuentas/confirmacion/password-restablecido");
		} catch (err) {
			// Se decide por code, nunca por detail (H6).
			if (isTokenExpired(err)) {
				setEstadoEnlace("expirado");
			} else if (isUnauthorized(err)) {
				setEstadoEnlace("invalido");
			} else if (isApiError(err)) {
				// 429 (incl. FLOOD_BLOCKED), validación, 5xx…
				setServerError(getUserMessage(err, 'restablecer_password'));
			} else {
				setServerError("Ocurrió un error desconocido");
			}
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="formulario_crear_cuenta">
			<div className="mb-4">
				<label className="form-label">Nueva contraseña</label>
				<input
					type="password"
					className="form-control"
					placeholder="Nueva contraseña"
					{...register("password")}
					disabled={loading || enlaceMuerto}
				/>
				{errors.password && <p className="text-danger mt-1">{errors.password.message}</p>}
			</div>

			<div className="mb-4">
			<label className="form-label">Repite tu contraseña</label>
				<input
					type="password"
					className="form-control"
					placeholder="Confirmar contraseña"
					{...register("confirmPassword")}
					disabled={loading || enlaceMuerto}
				/>
				{errors.confirmPassword && <p className="text-danger mt-1">{errors.confirmPassword.message}</p>}
			</div>

			{serverError && <p className="text-danger mt-1">{serverError}</p>}

			{estadoEnlace === "expirado" && (
				<div className="alert alert-warning mt-1" role="alert">
					<p className="mb-2">
						Este enlace expiró. Por seguridad, solo funciona durante 1 hora.
					</p>
					<Link
						href="/cuentas/login/password-olvidado"
						className="alert-link"
						aria-label="Solicitar nuevo enlace para restablecer contraseña"
					>
						Solicitar nuevo enlace
					</Link>
				</div>
			)}

			{estadoEnlace === "invalido" && (
				<div className="alert alert-danger mt-1" role="alert">
					Este enlace ya no es válido.
				</div>
			)}

			<button
				type="submit"
				className={`btn ${styles.boton_registrarse}`}
				disabled={loading || enlaceMuerto}
			>
				{loading ? (
					<>
						<span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
						Procesando...
					</>
				) : (
					"Confirmar"
				)}
			</button>
		</form>
	);
}
