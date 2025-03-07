// Uso de use client por el uso de useSte
'use client';
/**  
 ******* PAGINA CREAR CUENTA
 **/
// Link nextjs
import Link from "next/link";
// bootstrap
import "bootstrap/dist/css/bootstrap.css";
// Estilos de pagina
import crearCuenta from "../../ui/cuentas/crear-cuenta/crearCuenta.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer principal
import FooterMain from "../../components/FooterMain";
// Funcion para Crear usuario
import { createUsuario } from '@/lib/actions';
// UseState
import { FormEvent, useState } from 'react';
// interface
import { IUsuarioData } from "@/types/types";
// Handle change
import handleChange from "@/utils/handleChange";
import { useRouter } from "next/navigation";

export default function CrearCuenta() {
	const router = useRouter();
	// Estado de envio del formulario
	const [isLoading, setIsLoading ] = useState<boolean>(false);
	// Manejo de error al enviar el formulario
	const [ error, setError ] = useState<string | null>(null);

	// Funcion para enviar el formulario
	const [formData, setFormData] = useState<IUsuarioData>({
		nombre: '',
		apellido: '',
		correo: '',
		password: '',
	});

	// Manejo del envio del formulario
	const handleSubmit = async ( event: FormEvent<HTMLFormElement>) => {
		
		// Evitar al recarga de la pagina
		event.preventDefault();
		// actualizamos el estado del boton
		setIsLoading(true); //set loading cuando la request empieza
		// Limpiar los errores previos cuando una request empieza
		setError(null);
		
		try {
			// resultado 
			const resultado = await createUsuario(formData);
			// validar que fue un registro exitoso
			if (resultado.status === 200) {
				// console.log(resultado.token, 'respuesta 1');
				// Redireccionar a pagina de registro exitoso
				router.push(`/cuentas/confirmacion/correo-enviado`);
			} else {
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
		<div className="container-fluid container-xl">
			<div className="row justify-content-center contenedor_principal">
				{/* Header principal */}
                <HeaderPrincipalTei />
				<div className="col-sm-9 col-md-7 col-lg-6">
					<div className="text-center">
						<div className={`${crearCuenta.contenedor_titulos}`}>
							<h3 className={`${crearCuenta.subtitulo_h3}`}>Crear cuenta</h3>
						</div>
						<div className={`${crearCuenta.contenedor_formulario}`}>
							{error && <div style={{ color: 'red' }}>{error}</div>}
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
												className={`form-control ${crearCuenta.inputs_crear_cuenta}`}  
												aria-describedby="nombre" 
												placeholder="Nombre" 
												value={formData.nombre}
												onChange={ e => handleChange(e, setFormData, formData) } 
											/>
										</div>
									</div>
									<div className="col-md-6">
										<div className={`${crearCuenta.contenedor_input}`}>
											<input 
												type="text"
												name="apellido"
												
												className={`form-control ${crearCuenta.inputs_crear_cuenta}`}  
												aria-describedby="apellido" 
												placeholder="Apellido"
												value={formData.apellido}
												onChange={ e => handleChange(e, setFormData, formData)  } 
											/>
										</div>
									</div>
								</div>
								<div className={`${crearCuenta.contenedor_input}`}>
								  	<input 
										type="email" 
										name="correo"
										className={`form-control ${crearCuenta.inputs_crear_cuenta}`}
										aria-describedby="correo" 
										placeholder="Correo electrónico"
										value={formData.correo}
										onChange={ e => handleChange(e, setFormData, formData)  } 
									/>
								</div>
								<div className={`${crearCuenta.contenedor_input}`}>
								  	<input 
										type="password" 
										name="password"
										className={`form-control ${crearCuenta.inputs_crear_cuenta}`} 
										aria-describedby="password"
										placeholder="Contraseña"
										value={formData.password}
										onChange={ e => handleChange(e, setFormData, formData)  } 
									/>
								</div>
								<button 
									type="submit" 
									className={`${crearCuenta.boton_registrarse}`}
									disabled={ isLoading }
								>
									{isLoading ? 'Registrando...' : 'Registrarse'}
								</button>
							</form>
						</div>
					</div>
				</div>
				<div className="cool-md-12 text-center mt-2">
					<p className={`${crearCuenta.pregunta}`}>¿Tienes una cuenta? 
                        <Link href="/cuentas/login" className={`${crearCuenta.enlace_iniciar_sesion}`}>Entrar</Link>
                    </p>
				</div>
				{/* Footer */}
                <FooterMain />
			</div>
	    </div>
    );
}
