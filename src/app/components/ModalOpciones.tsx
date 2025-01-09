import { FiMoreHorizontal } from "react-icons/fi";
import * as Dialog from "@radix-ui/react-dialog";

export default function ModalOpciones() {
    return (
        <>
            {/* <button type="button" className="btn_opciones_modal" data-bs-toggle="modal" data-bs-target="#modalOpciones"> 
                <FiMoreHorizontal />
            </button> */}
            
            <Dialog.Root>
                <Dialog.Trigger className="btn_opciones_modal">
                    <FiMoreHorizontal />
                </Dialog.Trigger>
                <Dialog.Portal>
                    {/* <Dialog.Overlay className="position-fixed top-0 right-0 bottom-0 left-0 bg-black opacity-10 " /> */}
                    <Dialog.Overlay className="modal-backdrop show" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 1040 }} />
                    {/* <Dialog.Content className="position-fixed top-50 start-50 translate-50 d-flex flex-column overflow-hidden rounded-3 border border-secondary bg-light w-90" */}
                    <Dialog.Content className="position-fixed top-50 start-50 translate-middle d-flex flex-column overflow-hidden rounded-3 border border-secondary bg-light w-100"
                    style={{ maxHeight: '85vh', maxWidth: '450px', width: '385px', zIndex: 1050 }}>
                    <div className="modal-content">
            <div className="modal-header">
              <Dialog.Title className="modal-title">Change Username</Dialog.Title>
              <Dialog.Close className="btn-close" aria-label="Close"></Dialog.Close>
            </div>
            <div className="modal-body">
              <Dialog.Description className="mb-3 text-muted">
                Make changes to your username here.
              </Dialog.Description>
              <fieldset className="mb-3">
                <input
                  id="name"
                  placeholder="@raphaelsalaja"
                  className="form-control"
                />
              </fieldset>
            </div>
            <div className="modal-footer">
              <Dialog.Close className="btn btn-secondary">
                Cancel
              </Dialog.Close>
              <Dialog.Close className="btn btn-primary">
                Save Changes
              </Dialog.Close>
            </div>
          </div>
                    </Dialog.Content>
                </Dialog.Portal>
                </Dialog.Root>

        </>
        

        
    );
}