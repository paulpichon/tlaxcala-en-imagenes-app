// Funcion para validar formulario de registro
// Zod
import { z } from "zod";

// ======================================
// 📦 Constantes de subida de imágenes (compartidas con el backend)
// ======================================
export const MAX_IMAGEN_BYTES = 8 * 1024 * 1024; // 8 MB
export const MAX_IMAGEN_MB = 8;
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

//* Esquema de validación para el formulario de registro
export const usuarioSchema = z.object({
    nombre: z
      .string()
      .trim()
      .min(1, { message: "El nombre es requerido" })
      .max(60, { message: "El nombre no puede exceder 60 caracteres" })
      .regex(/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$/, {
        message: "El nombre contiene caracteres no permitidos",
      }),
    apellido: z
      .string()
      .trim()
      .min(1, { message: "El apellido es requerido" })
      .max(60, { message: "El apellido no puede exceder 60 caracteres" })
      .regex(/^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$/, {
        message: "El apellido contiene caracteres no permitidos",
      }),
    correo: z.email({ message: "Ingresa un correo válido" }),
    password: z
        .string()
        .min(8, { message: "La contraseña debe tener al menos 8 caracteres" })
        .regex(/[A-Z]/, { message: "Debe contener al menos una mayúscula" })
        .regex(/[a-z]/, { message: "Debe contener al menos una minúscula" })
        .regex(/[0-9]/, { message: "Debe contener al menos un número" })
        .regex(/[^A-Za-z0-9]/, { message: "Debe contener al menos un carácter especial" })
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
        .refine((file) => file.size <= MAX_IMAGEN_BYTES, {
            //? Este mensaje de error debe ser igual al que se ponga en el archivo CrearPosteoModal.tsx, de lo contrario prodria crearse un error
        message: `La imagen no debe superar los ${MAX_IMAGEN_MB} MB`,
        })
        .refine(
        (file) => ALLOWED_MIME_TYPES.includes(file.type),
        {
            //? Mnesaje que se muestra de error en el formulario
            message: "No se admite este tipo de archivo.",
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

// Esquema para editar un posteo
/**
 * Bloquea spam típico y contenido repetido
 */
const spamRegex = /(http|www|free money|click here|suscríbete|followers|porno|xxx)/i;
export const editarPosteoSchema = z.object({
  texto: z
    .string()
    .trim()
    // .min(1, "El texto no puede estar vacío")
    .max(200, "Máximo 200 caracteres")
    // El regex permite strings vacíos por el '*' al final de la clase de caracteres
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/, {
      message: "La descripción contiene caracteres no permitidos",
    })
    .optional() // Permite que sea undefined
    .or(z.literal("")) // Permite que sea un string vacío
    .refine((val) => {
      // Si no hay texto, saltamos la validación de spam
      if (!val) return true;
      return !spamRegex.test(val);
    }, {
      message: "Tu texto parece contener spam ❌",
    })
});

// Schema para formulario de ayuda y soporte, envio de correo ellectronico
export const schemaAyudaSoporte = z.object({
  tipo_problema: z.enum([
    "cuenta",
    "publicacion",
    "seguridad",
    "reporte",
    "otro"
  ], {
    error: () => ({ message: "Debes seleccionar un tipo de ayuda." })
  }),
  descripcion_problema_usuario: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres.")
    .max(1000, "La descripción no puede exceder 1000 caracteres.")
});


export type PosteoSchema = z.infer<typeof posteoSchema>;

// Schema para crear comentarios (reusa spamRegex de editarPosteoSchema)
export const comentarioSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "El comentario no puede estar vacío")
    .max(250, "El comentario no puede exceder 250 caracteres")
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ.,!?¡¿()\s-]*$/, {
      message: "El comentario contiene caracteres no permitidos",
    })
    .refine((val) => !spamRegex.test(val), {
      message: "El comentario parece contener spam",
    }),
});
export type ComentarioFormData = z.infer<typeof comentarioSchema>;

// Validacion para extenciones de imagen de perfil
export const imageFileSchema = z
  .instanceof(File)
  .refine((file) => ALLOWED_MIME_TYPES.includes(file.type), {
    message: "Solo se permiten archivos de imagen (JPG, JPEG, PNG o WebP)",
  })
  .refine((file) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    return ext && ALLOWED_EXTENSIONS.includes(ext);
  }, {
    message: "Extensión no válida. Solo JPG, JPEG, PNG o WebP.",
  });

export const REGEX_NOMBRE = /^[a-zA-Z0-9áéíóúñÁÉÍÓÚÑ .'\-]+$/;
export const MAX_NOMBRE = 60;

export function validarNombre(valor: string): string | null {
  if (!valor.trim()) return "El campo es obligatorio";
  if (valor.length > MAX_NOMBRE) return `Máximo ${MAX_NOMBRE} caracteres`;
  if (!REGEX_NOMBRE.test(valor)) return "Sólo letras, números, espacios, '.', '-' y apóstrofo";
  return null;
}