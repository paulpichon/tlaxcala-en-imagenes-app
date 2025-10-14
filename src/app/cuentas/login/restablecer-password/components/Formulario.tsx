"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { resetPasswordSchema, ResetPasswordSchema } from "@/lib/validaciones";

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
		setServerError(""); //limpia errores anteriores.
		setLoading(true); //activa un spinner o desactiva el formulario.
	
		try {
			// hace una petición POST a tu API, enviando el nuevo password y el token (ya recibido en la URL).
			const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/cuentas/reestablecer-password/${token}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					password: data.password, // es el valor del campo password del formulario
				}),
			});
			// Si la respuesta del servidor no es 200 OK, extrae el mensaje de error de la API y lanza una excepción.
			if (!res.ok) {
				const result = await res.json();
				throw new Error(result.message || "Error al restablecer contraseña, favor de reiniciar el proceso.");
			}
			// Después de restablecer la contraseña exitosamente, creamos un sessionStorage para indicar que la contraseña fue restablecida.
			// Esto puede ser útil para mostrar un mensaje de éxito en la página de confirmación.
			sessionStorage.setItem('passwordResetSuccess', 'true');
			// Si todo sale bien: redirige a una página de confirmación.
			router.push("/cuentas/confirmacion/password-restablecido");
		} catch (err) {
			// Si hay errores (de red, validación, token inválido), los muestra con setServerError(...).
			if (err instanceof Error) {
				setServerError(err.message);
			} else {
				setServerError("Ocurrió un error desconocido");
			}
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="formulario_crear_cuenta">
			<div className="mb-4">
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

			<button type="submit" className="btn btn-primary" disabled={loading}>
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
