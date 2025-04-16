// Estilos de pagina
import login from "../../../ui/cuentas/login/login.module.css";

export default function FormularioLogin() {
    return (
        <form className="formulario_crear_cuenta" id="iniciar_sesion">
            <div className={`${login.contenedor_inputs_login}`}>
                <input type="text" className={`form-control ${login.inputs_crear_cuenta}`} id="correo" aria-describedby="correo" placeholder="Correo electrónico" />
            </div>
            <div className={`${login.contenedor_inputs_login}`}>
                <input type="password" className={`form-control ${login.inputs_crear_cuenta}`} id="password" placeholder="Contraseña" />
            </div>
            <button type="submit" className={`${login.boton_registrarse}`}>Iniciar sesión</button>
        </form>
    );
}