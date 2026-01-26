'use client';
// interface ModalReenviarCorreoProps 
import { ModalReenviarCorreoProps } from "@/types/types";
// CSS
import styles from "../../../ui/cuentas/confirmacion/correo-enviado/CorreoEnviado.module.css";

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
                <small className="text-muted">
                    Puedes reenviar en {Math.floor((tiempoRestante || 0) / 60)}:
                    {String((tiempoRestante || 0) % 60).padStart(2, '0')} minutos
                </small>
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
                        <h1 className="modal-title fs-5">Reenviar correo</h1>
                        <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={onClose}
                        />
                    </div>
                    <div className="modal-body text-center">
                        <p className="text-muted small mb-3">
                            El correo puede tardar unos minutos en llegar.
                        </p>
                        {mensaje && (
                            <p className={esExito ? styles.mensajeExito : styles.mensajeError}>
                                {mensaje}
                            </p>
                        )} 
                        {/* Reenviar correo */}
                        {renderBotonReenvio()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalReenviarCorreo;
