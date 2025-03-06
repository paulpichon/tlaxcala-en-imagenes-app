// Interface de datos de imagenes para perfil de usuario
// Estos datos deben de ser cambios despues por los datos traidos por la API
export interface ImageData {
    id: number;
    src: string;
    title: string;
    description: string;
}
// Interface para definir los tipos de datos del formulario de registro
// Interface
export interface IUsuarioData {
	nombre: string;
	apellido: string;
	correo: string;
	password: string;
}