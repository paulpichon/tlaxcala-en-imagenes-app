// Use client.
"use client"
// Reqact, useState
import React, { useState } from "react";
// Footer
import FooterMain from "@/app/components/FooterMain";

export default function CorreoEnviado() {
  const [showModal, setShowModal] = useState(false);

  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);

  return (
    <>
      {/* Botón para abrir el modal */}
        <div className="col-md-12">
            <div className="contenedor_tei_index">
                <h1 className="titulo_principal_h1">TLAXCALA EN <span className="d-block">IMÁGENES</span></h1>
                <h6 className="subtitulo_h6">por <span className="span_tad d-block">T A D</span></h6>
            </div>
        </div>
        <div className="col-sm-9 col-md-7 col-lg-6">
            <div className="contenedor_formulario ">
                <div className="contenedor_titulos">
                    <h3 className="subtitulo_h3">Cuenta registrada</h3>
                    <p className="texto">Te enviamos un correo electrónico con un link para poder verificar tu registro, ten en cuenta que el link solo estara activo por una hora. Si no lo encuentras en tu bandeja de entrada, busca en correo no deseado o en spam.</p>
                </div>
                <div className="contenedor_formulario">
                    <a href="#" className="texto d-block" onClick={openModal}>¿No recibiste el correo electrónico?</a>
                </div>
            </div>
        </div>
        {/* Footer */}
        <FooterMain />

      {/* Modal */}
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
                      <button id="reenviar_correo" className="boton_reenviar_correo">Reenviar correo electrónico</button>
                  </div>
              </div>
          </div>
        </div>
      )}
    </>
  );
};