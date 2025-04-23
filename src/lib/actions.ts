// Funcion para crear el usuario

import {    IUsuarioData,  // interface para tipo de datos de formulario de registro
            ReenviarCorreoResponse  // Interface para el reenvio de correo electronico
} from "@/types/types";

// Esta funcion se encarga de crear el usuario en la base de datos
export async function createUsuario( formData: IUsuarioData) {
    // desestructuracion de formData
    const {nombre, apellido, correo, password} = formData;
    // headers
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    // creamos el raw
    const raw = JSON.stringify({
        "nombre_completo": {
            "nombre": nombre,
            "apellido": apellido
        },
        "correo": correo,
        "password": password
    });
    // requests options
    const requestOptions: RequestInit  = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };
    // Fetch a la API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios`, requestOptions);
    // convertimos la respuesta en json
    const respuesta = await response.json();
    // retornamos la respuesta para obtener el JSON que viene desde la API
    return respuesta;
}
// Esta funcion se encarga de reenviar el correo electronico al usuario
export async function reenviarCorreo(token: string): Promise<ReenviarCorreoResponse> {
    try {
        // Headers
        const myHeaders: HeadersInit = {
            "Content-Type": "application/json",
        };
        // Convertir el token a JSON
        const raw = JSON.stringify({
            token,
        });
        // requests options
        const requestOptions: RequestInit  = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow",
        };
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
                    esExito: false,
                    cuentaVerificada: true,
                };
            }
            return {
                // mensaje: data.msg || "Error al reenviar el correo",
                esExito: false,
                cuentaVerificada: false,
            };
        }
        // En caso de respuesta OK, retornamos el mensaje de éxito
        // y el estado de la cuenta verificada
        return {
            mensaje: "Correo reenviado con éxito",
            esExito: true,
            cuentaVerificada: false,
        };
    } catch (error) {
        // En caso de error, retornamos un mensaje de error genérico
        console.error(error);
        return {
            mensaje: "Error de red al reenviar el correo",
            esExito: false,
            cuentaVerificada: false,
        };
    }
}
// Funcion para enviar el correo con el link de restablecer el password
export const envioCorreoRestablecerPassword = async (correo: string) => {
    //Headers 
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    // creamos el raw
    const raw = JSON.stringify({
        "correo": correo
    });
    // requests options
    // Al usar requestOptions, no es necesario definir el tipo de datos
    // ya que el fetch lo infiere automáticamente: RequestInit
    const requestOptions: RequestInit  = {
        method: "POST",
        headers: myHeaders,
        body: raw,
        redirect: "follow",
    };
    // debemos cambiar el url por el de la api: NEXT_PUBLIC_API_URL
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/cuentas/password-olvidado`, requestOptions);
    // Respuesta desde la API
    const data = await res.json();
    // retornamos la respuesta
    return data;
}