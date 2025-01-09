"use client";
// Icono
import { FiMoreHorizontal } from "react-icons/fi";
// Toldo - https://toldo.vercel.app/
import * as Dialog from "@radix-ui/react-dialog";

export default function ModalOpciones() {
    return (
        <>
            {/* https://toldo.vercel.app/ */}
            <Dialog.Root modal={true}>
                <Dialog.Trigger className="btn_opciones_modal">
                    <FiMoreHorizontal />
                </Dialog.Trigger>
                <Dialog.Portal>
                    {/* <Dialog.Overlay className="position-fixed top-0 right-0 bottom-0 left-0 bg-black opacity-10 " /> */}
                    <Dialog.Overlay className="modal-backdrop show" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }} />
                    {/* <Dialog.Content className="position-fixed top-50 start-50 translate-50 d-flex flex-column overflow-hidden rounded-3 border border-secondary bg-light w-90" */}
                    <Dialog.Content 
                        className="position-fixed top-50 start-50 translate-middle d-flex flex-column overflow-hidden rounded-3 border border-secondary bg-light w-100"
                        style={{ maxHeight: '85vh', maxWidth: '450px', width: '385px', zIndex: 1050 }}
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                            <Dialog.Title /> {/* no hay title  */}
                            </div>
                            <div className="modal-body">
                                <div className="row text-center">
                                    <div className="col-md-12">
                                        <a id="seguir_usuario" type="button" className="btn_opciones_publicaciones btn_seguir" href="#">
                                            Seguir
                                        </a>
                                    </div>
                                    <div className="col-md-12">
                                        <a type="button" className="btn_opciones_publicaciones btn_rojo">
                                            Denunciar
                                        </a>
                                    </div>
                                    <div className="col-md-12">
                                        <a type="button" className="btn_opciones_publicaciones" href="#">
                                            Añadir a favoritos
                                        </a>
                                    </div>
                                    <div className="col-md-12">
                                        <a href="#" type="button" className="btn_opciones_publicaciones">
                                            Ir a la publicación
                                        </a>
                                    </div>
                                    <div className="col-md-12">
                                        <Dialog.Close className="btn_opciones_publicaciones btn_toldo">
                                            Cancelar
                                        </Dialog.Close>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
        

        
    );
}