'use client';
import { useState } from "react";
import Link from "next/link";
import { FiChevronRight } from "react-icons/fi";
import { useLogout } from "../hooks/auth/logout";

export default function Configuraciones() {
  const [showModal, setShowModal] = useState(false);
  const { handleLogout } = useLogout();

  const confirmarCierreSesion = async () => {
    await handleLogout();
    setShowModal(false);
  };

  return (
    <div className="d-flex flex-column vh-100 bg-light">
      <main className="flex-grow-1 overflow-auto">
        <header className="bg-white border-bottom shadow-sm">
          <div className="container">
            <div className="d-flex align-items-center justify-content-center py-3">
              <h1 className="h4 mb-0 fw-bold">Configuración</h1>
              <div style={{ width: '32px' }}></div>
            </div>
          </div>
        </header>
        
        <div className="container-fluid py-4">
          <div className="d-flex flex-column gap-3">
            {/* Sección Cuenta */}
            <div className="card border">
              <div className="card-header bg-light border-bottom">
                <h2 className="h5 mb-0 fw-semibold">Cuenta</h2>
              </div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/editar-perfil"
                  >
                    <span>Editar perfil</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li>
                <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/eliminar-cuenta"
                  >
                    <span>Eliminar cuenta</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li>
                {/* <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/privacidad-y-seguridad"
                  >
                    <span>Privacidad y seguridad</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li> */}
              </ul>
            </div>

            {/* Sección General */}
            <div className="card border">
              <div className="card-header bg-light border-bottom">
                <h2 className="h5 mb-0 fw-semibold">General</h2>
              </div>
              <ul className="list-group list-group-flush">
                <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/notificaciones"
                  >
                    <span>Notificaciones</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li>
                <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/ayuda-y-soporte"
                  >
                    <span>Ayuda y soporte</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li>
                <li className="list-group-item p-0">
                  <Link 
                    className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                    href="/configuracion/faq"
                  >
                    <span>FAQ (Preguntas frecuentes)</span>
                    <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Botón Cerrar Sesión */}
            <div className="mt-2">
              <button 
                className="btn btn-danger w-100 fw-bold py-2"
                onClick={() => setShowModal(true)}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modal de confirmación */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          role="dialog"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirmar cierre de sesión</h5>
              </div>
              <div className="modal-body text-center">
                <p>¿Estás seguro de que quieres cerrar sesión?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmarCierreSesion}
                >
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}