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
export interface Posteo {
  _idUsuario: UsuarioLogueado;
  public_id_img: string;
  texto: string;
  img: string;
  posteo_publico: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  idPost: string;
  _id: string;
  isFollowing: boolean;   // 👈 añadido
  isFavorito: boolean;    // 👈 añadido
}

// Response de la API para los posteos
// Esta interface es la que se espera recibir de la API al hacer una petición para obtener los posteos
// Contiene un array de posteos, y las URLs para paginación
export interface ApiResponsePosteos {
  page: number;
  next: string | null;
  prev: string | null;
  limite: number;
  total_registros: number;
  mostrando: number;
  posteosConEstado: Posteo[];
}
// Interface para ModalOpcionesPublicacion
export interface PropsModalOpcionesPublicacion {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
};
// 
// 📌 Respuesta para un post en detalle
export interface PosteoDetalleResponse {
  posteo: Posteo;        // El post en sí
  isFollowing: boolean;  // Si el usuario actual sigue al autor
  isFavorito: boolean;   // Si el usuario actual tiene en favoritos este post
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
// Tipos de dato para el usuario que esta logueado
// Se puede modificar los atributos que se pueden traer desde la API: quitar o agregar atributos, dependiendo de lo que queremos mostrar en el FRONTEND
export interface UsuarioLogueado { 
  nombre_completo: {
    nombre: string;
    apellido: string;
  };
  lugar_radicacion?: {
    nombre_estado: string;
  };
  correo: string;
  imagen_perfil?: {
    url: string;
  };
  url?: string; // slug del perfil
  uid: string;
  _id: string;
}
// Tipo de datos para el perfil de usuario
// Extiende de UsuarioLogueado y agrega estadísticas adicionales 
export interface UsuarioPerfil extends UsuarioLogueado {
  totaltPosteos: number;
  totalSeguidores: number;
  totalSeguidos: number;
}
// Tipo de datos para el contexto de autenticación
export interface IAuthContext {
  user: UsuarioLogueado | null;
  loading: boolean;
  login: (user: UsuarioLogueado) => void;
  logout: () => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>; // <-- agregamos esto
}
// Interface para el usuario que da like a un posteo
// Esta interface representa a un usuario que ha dado like a un posteo
// Contiene el ID del usuario, el nombre completo, la imagen de perfil y el ID del posteo al que le dio like
export interface LikeUsuario {
  _id: string;
  _idUsuario: {
    nombre_completo: {
      nombre: string;
      apellido: string;
    };
    imagen_perfil: {
      url: string;
    };
    url: string; // URL del perfil del usuario
    uid: string;
    _id: string;
  };
  _idPosteo: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
// Respuesta de la API para likes de un posteo
// Esta interface representa la respuesta de la API al solicitar los likes de un posteo
// Contiene un array de usuarios que han dado like al posteo
export interface LikesUsuariosResponse {
  likes_usuarios_posteo: LikeUsuario[];
}
// Interface para las props del componente FollowButton
export interface FavoritoButtonProps {
  posteoId: string;
  autorId: string;
  imagenUrl: string;
  initialFavorito: boolean; // 👈 estado inicial desde el post
  onToggle?: (newState: boolean) => void; // ✅ nueva prop opcional
}
// Interface para las props del componente FollowButton
export interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  onToggle?: (newState: boolean) => void; // 👈 notificación
}