// Componente para: reenvio de correo electronico
'use client';
// Interface ModalReenviarCorreoProps
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
    tiempoRestante
}) => {
    // Modal
    if (!show) return null;

    //mensaje cambia color dependiendo de la respuesta de la API
    const mensajeEstilo = esExito === null
    ? ''
    : esExito
        ? { color: 'green' }
        : { color: 'red' };   

    return (
        <div
        className={`modal fade ${show ? 'show' : ''}`}
        tabIndex={-1}
        style={{
            display: show ? 'block' : 'none',
            backgroundColor: 'rgba(0,0,0,0.5)',
        }}
        role="dialog"
        >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h1 className="modal-title fs-5" id="exampleModalLabel">
                        ¿No recibiste el correo electrónico?
                        </h1>
                        <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body text-center">
                        {!cuentaVerificada && (
                            // Si la cuenta ya esta verificada, se quita el boton de reenvio de correo 
                            <button
                                id="reenviar_correo"
                                className={`btn ${estilos.boton_reenviar_correo}`}
                                onClick={onReenviar}
                                disabled={bloqueado}
                            >
                                {bloqueado
                                    ? (
                                        <p className={`text-danger`}>
                                          Puedes reenviar en {Math.floor((tiempoRestante || 0) / 60)}:{String((tiempoRestante || 0) % 60).padStart(2, '0')} minutos
                                          
                                        </p>
                                      )
                                    : "Reenviar correo electrónico"
                                }
                            </button>
                        )}
                        {mensaje && (
                            // Si hay mensaje, se muestra
                            // Se cambia el color del mensaje dependiendo de la respuesta de la API
                            <p style={{ ...mensajeEstilo }}>{mensaje}</p>
                        )} 
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalReenviarCorreo;