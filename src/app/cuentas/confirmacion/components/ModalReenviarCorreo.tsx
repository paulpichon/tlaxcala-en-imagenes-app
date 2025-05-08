'use client';
// interface ModalReenviarCorreoProps 
import { ModalReenviarCorreoProps } from "@/types/types";

const ModalReenviarCorreo: React.FC<ModalReenviarCorreoProps> = ({
  show,
  onClose,
  onReenviar,
  estilos,
  mensaje,
  esExito,
  bloqueado,
  cuentaVerificada,
  tiempoRestante,
}) => {
    // Si el modal no se debe mostrar, se retorna null
    if (!show) return null;
    // estilos del mensaje dependiendo de si es un error o un exito
    const estiloMensaje = esExito == null ? {} : { color: esExito ? 'green' : 'red' };

    const renderBotonReenvio = () => {
        // Si la cuenta ya fue verificada, no se muestra el boton de reenvio
        if (cuentaVerificada) return null;
        // Boton de reenvio
        return (
            <button
                id="reenviar_correo"
                className={`btn ${estilos.boton_reenviar_correo}`}
                onClick={onReenviar}
                disabled={bloqueado}
            >
                {bloqueado ? (
                <span className="text-danger">
                    Puedes reenviar en {Math.floor((tiempoRestante || 0) / 60)}:
                    {String((tiempoRestante || 0) % 60).padStart(2, '0')} minutos
                </span>
                ) : (
                "Reenviar correo electrónico"
                )}
            </button>
        );
    };

    return (
        <div
        className={`modal fade show`}
        tabIndex={-1}
        style={{
            display: 'block',
            backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5">¿No recibiste el correo electrónico?</h1>
                        <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={onClose}
                        />
                    </div>
                    <div className="modal-body text-center">
                        {renderBotonReenvio()}
                        {mensaje && <p style={estiloMensaje}>{mensaje}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalReenviarCorreo;
