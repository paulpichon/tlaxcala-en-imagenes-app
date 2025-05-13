// Funcion para validar formulario de registro
// Zod
import { z } from "zod";

// Esquema de validación para el formulario de registro
export const usuarioSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es requerido" }),
    apellido: z.string().min(1, { message: "El apellido es requerido" }),
    correo: z.string().email({ message: "Ingresa un correo válido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
});
// Tipo derivado del esquema
export type UsuarioSchema = z.infer<typeof usuarioSchema>;

// Validar el input para envio de correo para restablecer la contraseña 
// extencion del esquema de usuarioSchema
export const correoSchema = usuarioSchema.pick({ correo: true });
// Validar la contraseña de la pagina para restablecer contraseña
// extension del esquema de usuarioSchema
export const passwordSchema = usuarioSchema.pick({ password: true });
// Confirmar la contraseña
// extension del esquema de usuarioSchema
export const resetPasswordSchema = passwordSchema.extend({
	confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
	message: "Las contraseñas no coinciden",
	path: ["confirmPassword"],
});
// tipo de resetPasswordSchema
// Restablecer contraseña
export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;