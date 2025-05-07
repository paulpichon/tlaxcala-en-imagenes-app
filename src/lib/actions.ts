// Funcion para crear el usuario

import {    IUsuarioData,  // interface para tipo de datos de formulario de registro
            ReenviarCorreoResponse  // Interface para el reenvio de correo electronico
} from "@/types/types";


//Headers 
const myHeaders = new Headers();
myHeaders.append("Content-Type", "application/json");

// requests options
// Al usar requestOptions, no es necesario definir el tipo de datos
// ya que el fetch lo infiere automáticamente: RequestInit
let requestOptions: RequestInit;
function funcionRequestOptions(raw: BodyInit) {
    requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };
}

// Esta funcion se encarga de crear el usuario en la base de datos
export async function createUsuario( formData: IUsuarioData) {
    // desestructuracion de formData
    const {nombre, apellido, correo, password} = formData;
    // creamos el raw
    const raw = JSON.stringify({
        "nombre_completo": {
            "nombre": nombre,
            "apellido": apellido
        },
        "correo": correo,
        "password": password
    });
    // Request options
    funcionRequestOptions( raw );
    // Fetch a la API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios`, requestOptions);
    // convertimos la respuesta en json
    const respuesta = await response.json();
    // retornamos la respuesta para obtener el JSON que viene desde la API
    return respuesta;
}
// Esta funcion se encarga de reenviar el correo electronico al usuario cuando se registra en caso de ser necesario
export async function reenviarCorreo(token: string): Promise<ReenviarCorreoResponse> {
    try {
        // Convertir el token a JSON
        const raw = JSON.stringify({
            token,
        });
        // Request options
        funcionRequestOptions( raw );
        // Cambiar la URL a la de producción
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reenviar-correo`)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/reenviar-correo`, requestOptions);
        // Resultado de la respuesta
        const data = await response.json();
        // Si la respuesta no es ok, retornamos el mensaje de error
        // Dependiendo del error que venga desde la API
        // Si el error es 400 y el mensaje es "Cuenta ya verificada", retornamos un mensaje diferente
        if (!response.ok) {
            if (data.status === 400 && data.msg === 'Cuenta ya verificada') {
                return {
                    mensaje: "Esta cuenta ya ha sido verificada.",
                    esExito: false, //sirve para cambiar el color de el mensaje
                    cuentaVerificada: true, //Quita el boton de reenvio si status === a algun codigo de error/exito
                };
            }
            return {
                // mensaje: data.msg || "Error al reenviar el correo",
                esExito: false, //sirve para cambiar el color de el mensaje
                cuentaVerificada: false, //Quitar boton si status === 400
            };
        }
        // En caso de respuesta OK, retornamos el mensaje de éxito
        // y el estado de la cuenta verificada
        return {
            mensaje: "Correo reenviado con éxito",
            esExito: true,
            cuentaVerificada: false, //Quitar boton si status === 400
        };
    } catch (error) {
        // En caso de error, retornamos un mensaje de error genérico
        console.error(error);
        return {
            mensaje: "Error de red al reenviar el correo",
            esExito: false, //sirve para cambiar el color de el mensaje
            cuentaVerificada: false, //Quitar boton si status === 400
        };
    }
}
// Esta funcion se encarga de reenviar el correo electronico al usuario cuando quiera restablecer su contraseña, el reenvio es en caso de ser necesario
export async function reenviarCorreoRestablecerPassword(token: string): Promise<ReenviarCorreoResponse> {
    try {
        // Convertir el token a JSON
        const raw = JSON.stringify({
            token,
        });
        // Request options
        funcionRequestOptions( raw );
        // Cambiar la URL a la de producción
        // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/reenviar-correo`)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/reenviar-correo-restablecer-password`, requestOptions);
        // Resultado de la respuesta   
        const data = await response.json();
        // Si la respuesta no es ok, retornamos el mensaje de error
        // Dependiendo del error que venga desde la API
        // Si el error es 400 y el mensaje es "Cuenta ya verificada", retornamos un mensaje diferente
        if (!response.ok) {
            // Correo no existe
            if (data.status === 401 && data.msg === 'Correo no existe') {
                return {
                    mensaje: "El correo no esta asociado a ninguna cuenta.",
                    esExito: false, //sirve para cambiar el color de el mensaje
                    cuentaVerificada: true, //Quitar boton si status === 400
                };
            }
            // Cuenta no verificada
            if (data.status === 403 && data.msg === 'Cuenta no verificada') {
                return {
                    mensaje: "Esta cuenta no ha sido verificada.",
                    esExito: false, //sirve para cambiar el color de el mensaje
                    cuentaVerificada: true, //Quitar boton si status === 400
                };
            }
            // Cuenta no activada
            if (data.status === 403 && data.msg === 'Cuenta no activada') {
                return {
                    mensaje: "Esta cuenta esta desactivada, contactar a soporte.",
                    esExito: false, //sirve para cambiar el color de el mensaje 
                    cuentaVerificada: true, //Quitar boton si status === 400
                };
            }
            // Error 500, token invalido o a expirado
            if (data.status === 500 && data.error === 'jwt expired') {
                // Token invalido o a expirado
                return {
                    mensaje: "Reinicia el proceso para restablecer contraseña.",
                    esExito: false, //sirve para cambiar el color de el mensaje
                    cuentaVerificada: true, //Quitar boton si status === 400
                };
            }
            // Esperar 5 minutos
            // if (data.status === 429) {
            //     return {
            //         mensaje: "Espera 5 minutos para poder reenviar el correo.",
            //         esExito: false, //sirve para cambiar el color de el mensaje
            //         cuentaVerificada: true, //Quitar boton si status === 400
            //     };
            // }
            return {
                // mensaje: data.msg || "Error al reenviar el correo",
                esExito: false, //sirve para cambiar el color de el mensaje
                cuentaVerificada: false, //Quitar boton si status === 400
            };
        }
        // Si el correo fue reenviado correctamente, retornamos el mensaje de éxito
        return {
            mensaje: "Correo reenviado con éxito",
            esExito: true,
            cuentaVerificada: false, //Quitar boton si status === 400
        };
    }catch (error) {
        console.log(error);
        return {
            mensaje: "Error de red al reenviar el correo",
            esExito: false, //sirve para cambiar el color de el mensaje
            cuentaVerificada: false, //Quitar boton si status === 400
        };
    }
}
// Funcion para enviar el correo con el link de restablecer el password
export const envioCorreoRestablecerPassword = async (correo: string) => {
    // creamos el raw
    const raw = JSON.stringify({
        "correo": correo
    });
    // Request options
    funcionRequestOptions( raw );
    // debemos cambiar el url por el de la api: NEXT_PUBLIC_API_URL
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/cuentas/password-olvidado`, requestOptions);
    // Respuesta desde la API
    const data = await res.json();
    // retornamos la respuesta
    return data;
}