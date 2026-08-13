// Usuario schema
import { UsuarioSchema } from "@/lib/validaciones";

// Tipo para los errores de validación del formulario
export type FormErrors = {
  [key in keyof UsuarioSchema]?: string;
};
// Interface para definir los tipos de datos del formulario de registro
export interface IUsuarioData {
	nombre: string;
	apellido: string;
	correo: string;
	password: string;
}
// Interfaz para errores de campo devueltos por la API y mostrados en formularios
export interface FormFieldError {
  message: string;
  field?: keyof UsuarioSchema; // Campo opcional que indica qué campo específico tiene el error
}
// Interface para el posteo 
export interface Posteo {
  _idUsuario: UsuarioLogueado;
  public_id: string;
  texto: string;
  ubicacion?: { // ubicacion opcional
    municipio?: string;
    ciudad?: string;
    estado?: string;
    pais?: string;
    coordinates?: {
      type: "Point",
      coordinates: [number, number] //[lng, lat]
    }
  }
  posteo_publico: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  idPost: string;
  _id: string;
  isFollowing: boolean;
  isFavorito: boolean;
  likesCount?: number;
  comentariosCount?: number;
  hasLiked?: boolean;
  comentariosActivos?: boolean;
}
// Interface para crear Posteo Modal
export interface CrearPosteoModalProps {
  show: boolean;
  onClose: () => void;
  onPostCreated?: (newPost?: Posteo) => void;
}
//  interface para las props del componente PosteoCard
export interface PosteoCardProps {
  post: Posteo;
  isDetail?: boolean;
  showUserUrl?: boolean;
}

// ======================================
// 📦 Wrappers genericos de respuesta API
// ======================================
// Estructura de paginacion unificada (HIGH-01)
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  next: string | null;
  prev: string | null;
}

// Patron B: respuesta con datos (un recurso o varios campos)
export interface ApiResponse<T> {
  success: boolean;
  msg?: string;
  data: T;
}

// Patron C: respuesta paginada (listas)
export interface ApiResponsePaginado<T> {
  success: boolean;
  data: T[];
  pagination: Pagination;
}

// Interface para ModalOpcionesPublicacion
export interface PropsModalOpcionesPublicacion {
  isOpen: boolean;
  selectedImage: Posteo | null;
  onClose: () => void;
};

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
    claveEntidad: number;
    nombreEntidad: string;
    claveMunicipio: number;
    nombreMunicipio: string;
    codigoPostal: string;
  };
  correo: string;
  imagen_perfil?: {
    public_id?: string;
  };
  genero?: string;
  fecha_nacimiento?: string;
  nombre_completo_changed_at: string | null;
  url: string; // slug del perfil
  uid: string;
  _id: string;
}
// Tipo de datos para el perfil de usuario
// Extiende de UsuarioLogueado y agrega estadísticas adicionales 
export interface UsuarioPerfil extends UsuarioLogueado {
  totalPosteos: number;
  totalSeguidores: number;
  totalSeguidos: number;
  isFollowing: boolean; // Si el usuario actual sigue a este usuario
}
// Password
export interface PasswordConfirm extends UsuarioLogueado {
  confirmPassword: string;
}
// Tipo de datos para el contexto de autenticación
export interface IAuthContext {
  user: UsuarioLogueado | null;
  loading: boolean;
  login: (user: UsuarioLogueado) => void;
  logout: () => void;
  fetchWithAuth: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
  /** 🔄 Actualiza parcialmente los datos del usuario en memoria */
  updateUser: (newData: Partial<UsuarioLogueado>) => void;
}
// Interface para el usuario que da like a un posteo
// Esta interface representa a un usuario que ha dado like a un posteo
// Contiene el ID del usuario, el nombre completo, la imagen de perfil y el ID del posteo al que le dio like
export interface LikeUsuario {
  _id: string;
  _idUsuario: UsuarioLogueado;
  posteoId: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}
// Interface Props LikeButton.tsx
export interface LikeButtonProps {
  postId: string;
  likesCount?: number;
  hasLiked?: boolean;
  onOpenLikesModal?: () => void;
  readOnly?: boolean;
}
// Interface para las props del componente FollowButton
export interface FavoritoButtonProps {
  posteoId: string;
  autorId: string;
  initialFavorito: boolean;
  className?: string;
  onRemoved?: (posteoId: string) => void;
  iconOnly?: boolean; // 👈 nuevo: solo muestra el icono si es true
}

// Interface para las props del componente FollowButton
export interface FollowButtonProps {
  userId: string;
  initialFollowing: boolean;
  className?: string; // solo estilos base, no color
  onToggle?: (newState: boolean) => void;
}
// Interface para todo lo que tenga que ver con publicaciones de usuario props 
export interface PublicacionesUsuarioProps {
  usuarioId?: string;
  refreshTrigger?: number;
  onPostCountChange?: (count: number) => void; // ✅ nuevo
}
// Interface props de TOAST
export interface ToastGlobalProps {
  message: string;
  type?: "success" | "danger" | "warning" | "creacion";
  onClose?: () => void;
  duration?: number;
  actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'outline' }>;
}
// Predefinidos de Cloudinary
export type CloudinaryPreset =
  | "feed"
  | "detalle"
  | "perfil"
  | "grid"
  | "mini"
  | "custom";
// Interface para las opciones custom de Cloudinary
export interface CloudinaryCustomOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "limit" | "fit" | "scale" | "thumb" | "pad";
  gravity?: "auto" | "face" | "center" | string;
  background?: string;
  quality?: "auto" | number | null;
  format?: "auto" | "jpg" | "webp" | "avif" | "png" | null;
  useAutoTransforms?: boolean;
}
// ======================================
// 📦 Comentarios
// ======================================

export interface Comentario {
  _id: string;
  texto: string;
  createdAt: string;
  autorId: {
    _id: string;
    nombre_completo: {
      nombre: string;
      apellido: string;
    };
    imagen_perfil?: {
      public_id?: string;
    };
    url: string;
  };
}

export interface ComentariosCountResponse {
  count: number;
}

// Props para cambio de imagen de perfil modal
export interface CambiarImagenModalProps {
  usuario: UsuarioLogueado;
  show: boolean;
  onClose: () => void;
  onSuccess: (newUrl: string) => void;
}
// Municipios
export interface Municipio {
  _id: string;
  claveEntidad: number;
  nombreEntidad: string;
  claveMunicipio: number;
  nombreMunicipio: string;
  codigoPostal: string;
}
// Datos de ubicación cuando se selecciona un municipio manualmente
export interface DatosUbicacion {
  ciudad: string | null; // nombre de la ciudad o municipio
  estado: string | null; // nombre de la entidad federativa
  pais: string | null; // nombre del país
}

// FormData para Editar Perfil
export interface FormDataEditarPerfil {
  nombre: string;
  apellido: string;
  correo: string;
  claveMunicipio: string;
  nombreMunicipio: string;
  genero: string;
  password: string;
  confirmPassword: string;
  url: string;
  fecha_nacimiento: string;
  nombreEntidad: string;
  claveEntidad: number;
}
// Iterface para las notificaciones
export interface Notificacion {
  _id: string;
  tipo: "follow" | "like" | "comentario" | "nueva_publicacion";
  mensaje: string;
  createdAt: string;
  notificacion_leida: boolean;
  emisor: {
    _id: UsuarioLogueado["_id"];
    nombre_completo: UsuarioLogueado["nombre_completo"];
    url: UsuarioLogueado["url"];
    imagen_perfil?: UsuarioLogueado["imagen_perfil"];
  };
};
// ======================================
// 📦 Favoritos
// ======================================

// Tipo para cada elemento de la lista de favoritos
export interface Favorito {
  _id: string;
  usuarioId: string; // usuario que guardó el favorito
  posteoId: Posteo;
  autorId: UsuarioLogueado;
  createdAt: string;
  __v: number;
}

// ======================================
// 📦 Editar el posteo modal
// ======================================
export interface EditarPosteoModalProps {
  isOpen: boolean;
  posteo: {
    _id: string;
    texto?: string;
    ubicacion?: { // ubicacion opcional
      municipio?: string;
      ciudad?: string;
      estado?: string;
      pais?: string;
    }
  } | null;
  onClose: (updated: boolean, newText?: string) => void;
}
// ======================================
// 📦 Interface para mostrar Followers del usuario logueado
// ======================================
export interface FollowerUserItemProps {
  follower: {
    _id: string;
    url: string;
    nombre_completo: {
      nombre: string;
      apellido: string;
    };
    imagen_perfil?: {
      public_id?: string;
    };
  };
  following: string;
  createdAt: string;
  uid: string;
  isFollowing?: boolean; // Para verificar si el usuario logueado sigue a este follower
}
// ======================================
// 📦 Interface para mostrar Followings en el modal
// ======================================
export interface FollowingUserItemProps {
  _id: string; // ID del registro Follow
  following: {
    _id: string;
    url: string;
    nombre_completo: {
      nombre: string;
      apellido: string;
    };
    imagen_perfil?: {
      public_id?: string;
    };
  };
  isFollowing: boolean; // si el usuario logueado sigue a este usuario
}
