// Funcion para crear el usuario
'use server';
// interface para tipo de datos de formulario de registro
import { IUsuarioData } from "@/types/types";
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
    // Fetch a la API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios`, {
        method: "POST",
        headers: myHeaders,
        body: raw,
    });
    // convertimos la respuesta en json
    const respuesta = await response.json();
    // retornamos la respuesta para obtener el JSON que viene desde la API
    return respuesta;
}