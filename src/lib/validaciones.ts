// Funcion para validar formulario de registro
// Zod
import { z } from "zod";

//* Esquema de validación para el formulario de registro
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
//* Confirmar la contraseña
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

// Esquema base sin refine
export const posteoBaseSchema = z.object({
    texto: z
    .string()
    .max(200, { message: "La descripción no puede superar los 200 caracteres" })
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/, {
      message: "La descripción contiene caracteres no permitidos",
    })
    .optional(),
    file: z
        .instanceof(File)
        .refine((file) => file.size <= 5 * 1024 * 1024, {
            //? Este mensaje de error debe ser igual al que se ponga en el archivo CrearPosteoModal.tsx, de lo contrario prodria crearse un error
        message: "La imagen no debe superar los 5 MB",
        })
        .refine(
        (file) => ["image/jpeg", "image/jpg", "image/webp"].includes(file.type),
        {
            //? Este mensaje de error debe ser igual al que se ponga en el archivo CrearPosteoModal.tsx, de lo contrario prodria crearse un error
            message: "No se admite este archivo. Solo se permiten .jpg, .jpeg y .webp",
        }
        )
        .optional(),
    posteo_publico: z.boolean(),
});

// Esquema completo con la regla extra
export const posteoSchema = posteoBaseSchema.refine(
  (data) => data.texto?.trim() !== "" || data.file,
  {
    message: "Debes escribir una descripción o subir una imagen",
    path: ["file"],
  }
);

export type PosteoSchema = z.infer<typeof posteoSchema>;