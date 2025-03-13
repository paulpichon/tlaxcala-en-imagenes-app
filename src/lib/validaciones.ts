// Funcion para validar formulario de registro
// Zod
import { z } from "zod";

// Esquema de validación para el formulario de registro
export const usuarioSchema = z.object({
    nombre: z.string().min(1, { message: "El nombre es requerido" }),
    apellido: z.string().min(1, { message: "El apellido es requerido" }),
    correo: z.string().email({ message: "Correo electrónico inválido" }),
    password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  });
  
  // Tipo derivado del esquema
  export type UsuarioSchema = z.infer<typeof usuarioSchema>;