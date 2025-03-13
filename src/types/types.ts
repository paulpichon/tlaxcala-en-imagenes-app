// Usuario schema
import { UsuarioSchema } from "@/lib/validaciones";

// Tipo para los errores de validación del formulario
export type FormErrors = {
  [key in keyof UsuarioSchema]?: string;
};
// Interface para definir los tipos de datos del formulario de registro
// Interface
export interface IUsuarioData {
	nombre: string;
	apellido: string;
	correo: string;
	password: string;
}
// Interfaz para errores de la API
export interface APIError {
  status: number;
  message: string;
  field?: keyof UsuarioSchema; // Campo opcional que indica qué campo específico tiene el error
}
// Tipo para datos adicionales en la respuesta de la API
export interface APIResponseData {
    message?: string;
    field?: string;
    // Utiliza un índice de firma con tipos más específicos
    [key: string]: string | number | boolean | object | undefined;
  }
// Respuesta de la API (ajusta según la estructura real de tu API)
export interface APIResponse {
    status: number;
    data?: APIResponseData;
    token?: string;
  }
// Interface de datos de imagenes para perfil de usuario
// Estos datos deben de ser cambios despues por los datos traidos por la API
export interface ImageData {
    id: number;
    src: string;
    title: string;
    description: string;
}

