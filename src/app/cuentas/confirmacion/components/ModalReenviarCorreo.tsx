'use client';

interface ModalReenviarCorreoProps {
    show: boolean;
    onClose: () => void;
    onReenviar: () => void;
    estilos: { [key: string]: string };
    mensaje?: string | null;
    // reenviando?: boolean;
    esExito?: boolean | null;
    bloqueado?: boolean;
    cuentaVerificada?: boolean;
  }

const ModalReenviarCorreo: React.FC<ModalReenviarCorreoProps> = ({
    show,
    onClose,
    onReenviar,
    estilos,
    mensaje,
    // reenviando,
    esExito,
    bloqueado,
    cuentaVerificada
}) => {
    
    if (!show) return null;

    //mensaje
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
                    <button
                    id="reenviar_correo"
                    className={`btn ${estilos.boton_reenviar_correo}`}
                    onClick={onReenviar}
                    disabled={bloqueado}
                    >
                    {bloqueado
                        ? "Espera 5 minutos para volver a reenviar el correo..."
                        : "Reenviar correo electrónico"}
                    </button>
                )}
                {mensaje && (
                    <p style={{ marginTop: '1rem', ...mensajeEstilo }}>{mensaje}</p>
                )} 
            </div>
        </div>
      </div>
    </div>
  );
};

export default ModalReenviarCorreo;