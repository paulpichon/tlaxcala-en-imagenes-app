// Formulario de registro
'use client';
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import crearCuenta from "../../../ui/cuentas/crear-cuenta/CrearCuenta.module.css";
// para redireccionar a otra pagina
import { useRouter } from "next/navigation";
// Funcion para Crear usuario
import { createUsuario } from '@/lib/actions';
// UseState, formEvent
import { FormEvent, useState } from 'react';
// interfaces, types
import { APIError, 
		FormErrors, 
		IUsuarioData 
} from "@/types/types";
// Handle change, persistencia de datos en los campos
import handleChange from "@/utils/handleChange";
// Usuario schemas
import { usuarioSchema, UsuarioSchema } from "@/lib/validaciones";


export function FormularioRegistro() {
    const router = useRouter();
	// Estado de envio del formulario
	const [isLoading, setIsLoading ] = useState<boolean>(false);
	// Manejo de error dentro de la pagina: no maneja errores de validacion
	const [ error, setError ] = useState<string | null>(null);
	 // Estado para los errores de validación
	 const [validationErrors, setValidationErrors] = useState<FormErrors>({});
	// Funcion para enviar el formulario
	const [formData, setFormData] = useState<IUsuarioData>({
		nombre: '',
		apellido: '',
		correo: '',
		password: '',
	});
	// Función para validar un campo individual
	const validateField = (name: keyof UsuarioSchema, value: string) => {
		const result = usuarioSchema.shape[name].safeParse(value);
		if (!result.success) {
		  const errorMessage = result.error.errors[0]?.message || `El campo ${name} es inválido`;
		  setValidationErrors(prev => ({ ...prev, [name]: errorMessage }));
		  return false;
		} else {
		  setValidationErrors(prev => {
			const newErrors = { ...prev };
			delete newErrors[name];
			return newErrors;
		  });
		  return true;
		}
	};
	// Función modificada para manejar cambios en el formulario
	const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		
		// Actualizamos el estado del formulario
		handleChange(e, setFormData, formData);
		
		// Validamos el campo que cambió
		validateField(name as keyof UsuarioSchema, value);
		
		// Si previamente hubo un error de API para este campo, lo limpiamos
		if (name === 'correo' && validationErrors.correo?.includes('ya existe')) {
		  setValidationErrors(prev => {
			const newErrors = { ...prev };
			delete newErrors.correo;
			return newErrors;
		  });
		}
	};
	// Función para manejar errores de la API
	const handleAPIError = (apiError: APIError) => {
		// Si el error específica un campo, lo asignamos a ese campo
		if (apiError.field) {
		  setValidationErrors(prev => ({
			...prev,
			[apiError.field!]: apiError.message
		  }));
		} else {
		  // Si es un error general, lo mostramos en el mensaje de error general
		  setError(apiError.message);
		}
	};
	// Manejo del envio del formulario
	const handleSubmit = async ( event: FormEvent<HTMLFormElement>) => {
		
		// Evitar al recarga de la pagina
		event.preventDefault();
		// actualizamos el estado del boton
		setIsLoading(true); //set loading cuando la request empieza
		// Limpiar los errores previos cuando una request empieza
		setError(null);
		// Validamos todo el formulario antes de enviarlo
		const validationResult = usuarioSchema.safeParse(formData);
		// validamos validationResult para saber si hay errores
		if (!validationResult.success) {
			// Extraemos los errores de validación
			const errors: FormErrors = {};
			validationResult.error.errors.forEach(err => {
			  const path = err.path[0] as keyof UsuarioSchema;
			  errors[path] = err.message;
			});
			
			setValidationErrors(errors);
			setIsLoading(false);
			return;
		}
		try {
			// resultado 
			const resultado = await createUsuario(formData);
			// validar que fue un registro exitoso
			if (resultado.status === 200) {
				// Creamos una sessionstorage para guardar el token
				sessionStorage.setItem('registroToken', resultado.token);
				// Redireccionar a pagina de registro exitoso
				router.push(`/cuentas/confirmacion/correo-enviado`);
			} else {
				// Manejo de diferentes tipos de errores de la API
				if (resultado.status === 409) {
					// Error 409 - Conflict, típicamente usado para recursos duplicados
					handleAPIError({
						status: 409,
						message: "Este correo electrónico ya existe en nuestra base de datos",
						field: "correo"
					});
				} else if (resultado.status === 400) {
					// Error 400 - Bad Request
					// Asumimos que la API devuelve un campo específico con error
					if (resultado.data && resultado.data.field) {
						handleAPIError({
						status: 400,
						message: resultado.data.message || "Datos inválidos",
						field: resultado.data.field
						});
					} else {
						setError("Los datos enviados son inválidos. Por favor revisa el formulario.");
					}
				} else {
					// Otros errores de la API
					setError(resultado.data?.message || "Ha ocurrido un error en el servidor");
				}
				// mostramos en caso de que haya algun error de la API
				// Manejar el error si no fue exitosa la creación
				console.log(resultado, "error");
			}
			
		} catch (error) {
			// Esto muestra algun error general y no propia de la API
			// este error se muestra en consola del navegador y en el formulario
			// revisar si se debe mostrar en el formulario o mejor se debe de quitar
			console.error(error);
			if (error instanceof Error) {
				// Capture the error message to display to the user
				setError(error.message)
			} else {
				setError('Ocurrio un error desconocido')
			}
			
		} finally {
			setIsLoading( false ); //set loading a false cuando la request termina
		}
		
	}  

    return (
		<div className={`${crearCuenta.contenedor_formulario}`}>
        {error && <div className="alert alert-danger" role="alert">{error}</div>}
            {/* Existe un error debido a que falta el action del form */}
            <form 
                onSubmit={ handleSubmit }
            >
                <div className="row">
                    <div className="col-md-6">
                        <div className={`${crearCuenta?.contenedor_input}`}>
                            <input 
                                type="text"
                                name="nombre"
                                className={`form-control ${crearCuenta.inputs_crear_cuenta} ${validationErrors.nombre ? 'is-invalid' : ''}`}  
                                aria-describedby="nombre" 
                                placeholder="Nombre" 
                                value={formData.nombre}
                                onChange={handleFormChange}
                            />
                            {validationErrors.nombre && (
                                <div className="invalid-feedback text-start">{validationErrors.nombre}</div>
                            )}
                        </div>
                    </div>
                    <div className="col-md-6">
                        <div className={`${crearCuenta.contenedor_input}`}>
                            <input 
                                type="text"
                                name="apellido"
                                className={`form-control ${crearCuenta.inputs_crear_cuenta} ${validationErrors.apellido ? 'is-invalid' : ''}`}  
                                aria-describedby="apellido" 
                                placeholder="Apellido"
                                value={formData.apellido}
                                onChange={handleFormChange}
                            />
                            {validationErrors.apellido && (
                                <div className="invalid-feedback text-start">{validationErrors.apellido}</div>
                            )}
                        </div>
                    </div>
                </div>
                <div className={`${crearCuenta.contenedor_input}`}>
                    <input 
                        type="email" 
                        name="correo"
                        className={`form-control ${crearCuenta.inputs_crear_cuenta} ${validationErrors.correo ? 'is-invalid' : ''}`}
                        aria-describedby="correo" 
                        placeholder="Correo electrónico"
                        value={formData.correo}
                        onChange={handleFormChange}
                    />
                    {validationErrors.correo && (
                        <div className="invalid-feedback text-start">{validationErrors.correo}</div>
                    )}
                </div>
                <div className={`${crearCuenta.contenedor_input}`}>
                    <input 
                        type="password" 
                        name="password"
                        className={`form-control ${crearCuenta.inputs_crear_cuenta} ${validationErrors.password ? 'is-invalid' : ''}`}
                        aria-describedby="password"
                        placeholder="Contraseña"
                        value={formData.password}
                        onChange={handleFormChange}
                    />
                    {validationErrors.password && (
                        <div className="invalid-feedback text-start">{validationErrors.password}</div>
                    )}
                </div>
                <button 
                    type="submit" 
                    className={`${crearCuenta.boton_registrarse}`}
                    disabled={isLoading || Object.keys(validationErrors).length > 0}
                >
                    {isLoading ? 'Registrando...' : 'Registrarse'}
                </button>
            </form>
        </div>
    );
}