// Manejo de cambios en los inputs
// Funciona para cualquier cantidad de inputs sin modificar la lógica.
// No necesitas escribir una función handleChange específica para cada campo.
// Mantiene los datos previos del estado.

// React change event
import { ChangeEvent } from "react";
// Interface
import { IUsuarioData } from "@/types/types";

const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFormData: React.Dispatch<React.SetStateAction<IUsuarioData>>,
    formData: IUsuarioData
 ) => {
    // 
    setFormData({
            ...formData,
            [e.target.name]: e.target.value // Actualiza la propiedad correspondiente
    });
}
// export
export default handleChange;