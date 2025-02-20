// components/DynamicComponent.jsx
'use client';
// Reqact, useState
import React, { useState } from "react";// Link nextjs
// usePathName
import { usePathname } from 'next/navigation';
// estilos de la pagina son iguales para correo-enviado y para correo-enviado.restablecer-password
import estilosCorreoEnviado from "../../../ui/cuentas/confirmacion/correo-enviado/CorreoEnviado.module.css";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer
import FooterMain from "@/app/components/FooterMain";

export default function CorreoEnviado() {
  // Modal
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  // URL usePathname
  const pathname = usePathname();

  let content;
  switch (pathname) {
    case '/cuentas/confirmacion/correo-enviado':
      content = (
        <>
          <h3 className={`${ estilosCorreoEnviado.subtitulo_h3 }`}>Cuenta registrada</h3>
          <p className={`${ estilosCorreoEnviado.texto }`}>Te enviamos un correo electrónico con un link para poder verificar tu registro, ten en cuenta que el link solo estara activo por una hora. Si no lo encuentras en tu bandeja de entrada, busca en correo no deseado o en spam.</p>
        </>
      );
      break;
    case '/cuentas/confirmacion/correo-enviado-restablecer-password':
      content = (
        <>
          <h3 className={`${ estilosCorreoEnviado.subtitulo_h3 }`}>Correo enviado</h3>
          <p className={`${ estilosCorreoEnviado.texto }`}>Te enviamos un correo electrónico con un link para poder reestablecer tu contraseña, ten en cuenta que el link solo estara activo por una hora. Si no lo encuentras en tu bandeja de entrada, busca en correo no deseado o en spam.</p>
        </>
      );
      break;
    default:
  }
  // Retornar el componente
  return (
    <>
    {/* Hear principal */}
      <HeaderPrincipalTei />
      
      <div className="col-sm-9 col-md-7 col-lg-6">
          <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
              <div className={`${estilosCorreoEnviado.contenedor_titulos}`}>
                {content}
              </div>
              <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
                  <a href="#" className={`${estilosCorreoEnviado.texto} d-block`} onClick={openModal}>¿No recibiste el correo electrónico?</a>
              </div>
          </div>
      </div>
      {/* Footer */}
      <FooterMain />
                
      {/* MODAL */}
      {showModal && (
          <div
          className={`modal fade ${showModal ? "show" : ""}`}
            tabIndex={-1}
            style={{
              display: showModal ? "block" : "none",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
            role="dialog"
          >
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                    <h1 className="modal-title fs-5" id="exampleModalLabel">¿No recibiste el correo electrónico?</h1>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={closeModal}></button>
                    </div>
                    <div className="modal-body">
                        <button id="reenviar_correo" className={`${estilosCorreoEnviado.boton_reenviar_correo}`}>Reenviar correo electrónico</button>
                    </div>
                </div>
            </div>
          </div>
      )}
    </>
  );
};

