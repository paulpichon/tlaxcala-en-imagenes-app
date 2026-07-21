"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { resetPasswordSchema, ResetPasswordSchema } from "@/lib/validaciones";
import styles from "@/app/ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
import { apiPost, isApiError, isRateLimit, getUserMessage } from "@/lib/apiClient";

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

	const onSubmit = async (data: ResetPasswordSchema) => {
		setServerError("");
		setLoading(true);

		try {
			await apiPost(fetch, `/api/auth/cuentas/reestablecer-password/${token}`, {
				password: data.password,
			});

			sessionStorage.setItem('passwordResetSuccess', 'true');
			router.push("/cuentas/confirmacion/password-restablecido");
		} catch (err) {
			if (isApiError(err)) {
				if (isRateLimit(err)) {
					setServerError(getUserMessage(err, 'restablecer_password'));
				} else {
					setServerError(getUserMessage(err, 'restablecer_password'));
				}
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
					disabled={loading}
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
					disabled={loading}
				/>
				{errors.confirmPassword && <p className="text-danger mt-1">{errors.confirmPassword.message}</p>}
			</div>

			{serverError && <p className="text-danger mt-1">{serverError}</p>}

			<button 
				type="submit" 
				className={`btn ${styles.boton_registrarse}`} 
				disabled={loading}
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
