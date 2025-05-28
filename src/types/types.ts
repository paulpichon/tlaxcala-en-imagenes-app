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
// Interface props para el reenvio de correo electronico
export interface ModalReenviarCorreoProps {
  show: boolean;
  onClose: () => void;
  onReenviar: () => void;
  estilos: { [key: string]: string };
  mensaje?: string | null;
  esExito?: boolean | null;
  bloqueado?: boolean;
  cuentaVerificada?: boolean;
  tiempoRestante?: number | null;
}
// Interface para ReenviarCorreoResponse
export interface ReenviarCorreoResponse {
  mensaje?: string; //El mensaje de la respuesta, es unicamente opcional en el return de (!response.ok)
  esExito: boolean;
  cuentaVerificada: boolean;
}
// Tipos de dato para el usuario que inicia sesión
export interface IUserLogin {
  nombre: string;
  correo: string;
};
// Tipo de datos para el contexto de autenticación
export interface IAuthContext {
  user: IUserLogin | null;
  loading: boolean;
  login: (user: IUserLogin) => void;
  logout: () => void;
};