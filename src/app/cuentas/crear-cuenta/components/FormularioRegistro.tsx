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
import { 
  APIError, 
  FormErrors, 
  IUsuarioData 
} from "@/types/types";
// Handle change, persistencia de datos en los campos
import handleChange from "@/utils/handleChange";
// Usuario schemas
import { usuarioSchema, UsuarioSchema } from "@/lib/validaciones";

export function FormularioRegistro() {
  const router = useRouter();

  // Estados
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<IUsuarioData>({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
  });

  // Validar campo individual
  const validateField = (name: keyof UsuarioSchema, value: string) => {
    const result = usuarioSchema.shape[name].safeParse(value);

    if (!result.success) {
      const errorMessage =
        result.error.errors[0]?.message || `El campo ${name} es inválido`;

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

  // Manejar cambios del formulario
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    handleChange(e, setFormData, formData);
    validateField(name as keyof UsuarioSchema, value);

    // Limpieza de error API previo
    if (name === 'correo' && validationErrors.correo?.includes('existe')) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.correo;
        return newErrors;
      });
    }
  };

  // Manejar errores de la API
  const handleAPIError = (apiError: APIError) => {
    if (apiError.field) {
      setValidationErrors(prev => ({
        ...prev,
        [apiError.field!]: apiError.message,
      }));
    } else {
      setError(apiError.message);
    }
  };

  // Envío del formulario
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const validationResult = usuarioSchema.safeParse(formData);

    if (!validationResult.success) {
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
      const resultado = await createUsuario(formData);

      if (resultado.status === 200) {
        sessionStorage.setItem('registroToken', resultado.token);
        router.push('/cuentas/confirmacion/correo-enviado');
      } else if (resultado.status === 409) {
        handleAPIError({
          status: 409,
          message: "Este correo electrónico ya existe en nuestra base de datos",
          field: "correo",
        });
      } else if (resultado.status === 400) {
        if (resultado.data?.field) {
          handleAPIError({
            status: 400,
            message: resultado.data.message || "Datos inválidos",
            field: resultado.data.field,
          });
        } else {
          setError("Los datos enviados son inválidos.");
        }
      } else {
        setError(resultado.data?.message || "Error en el servidor");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={crearCuenta.contenedor_formulario}>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="row">
          {/* Nombre */}
          <div className="col-md-6">
            <div className={crearCuenta.contenedor_input}>
              <label htmlFor="nombre" className={crearCuenta.label}>
                Nombre
              </label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                className={`form-control ${crearCuenta.inputs_crear_cuenta} ${
                  validationErrors.nombre ? 'is-invalid' : ''
                }`}
                placeholder="Tu nombre"
                value={formData.nombre}
                onChange={handleFormChange}
              />
              {validationErrors.nombre && (
                <div className="invalid-feedback text-start">
                  {validationErrors.nombre}
                </div>
              )}
            </div>
          </div>

          {/* Apellido */}
          <div className="col-md-6">
            <div className={crearCuenta.contenedor_input}>
              <label htmlFor="apellido" className={crearCuenta.label}>
                Apellido
              </label>
              <input
                id="apellido"
                type="text"
                name="apellido"
                className={`form-control ${crearCuenta.inputs_crear_cuenta} ${
                  validationErrors.apellido ? 'is-invalid' : ''
                }`}
                placeholder="Tu apellido"
                value={formData.apellido}
                onChange={handleFormChange}
              />
              {validationErrors.apellido && (
                <div className="invalid-feedback text-start">
                  {validationErrors.apellido}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Correo */}
        <div className={crearCuenta.contenedor_input}>
          <label htmlFor="correo" className={crearCuenta.label}>
            Correo electrónico
          </label>
          <input
            id="correo"
            type="email"
            name="correo"
            className={`form-control ${crearCuenta.inputs_crear_cuenta} ${
              validationErrors.correo ? 'is-invalid' : ''
            }`}
            placeholder="correo@ejemplo.com"
            value={formData.correo}
            onChange={handleFormChange}
          />
          {validationErrors.correo && (
            <div className="invalid-feedback text-start">
              {validationErrors.correo}
            </div>
          )}
        </div>

        {/* Contraseña */}
        <div className={crearCuenta.contenedor_input}>
          <label htmlFor="password" className={crearCuenta.label}>
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            name="password"
            className={`form-control ${crearCuenta.inputs_crear_cuenta} ${
              validationErrors.password ? 'is-invalid' : ''
            }`}
            placeholder="Mínimo 8 caracteres"
            value={formData.password}
            onChange={handleFormChange}
          />
          {validationErrors.password && (
            <div className="invalid-feedback text-start">
              {validationErrors.password}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={crearCuenta.boton_registrarse}
          disabled={isLoading || Object.keys(validationErrors).length > 0}
        >
          {isLoading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}
