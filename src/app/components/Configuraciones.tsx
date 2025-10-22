import { FiChevronRight } from "react-icons/fi";

export default function Configuraciones() {
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
                    <a 
                      className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                      href="#"
                    >
                      <span>Editar perfil</span>
                      <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                    </a>
                  </li>
                  <li className="list-group-item p-0">
                    <a 
                      className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                      href="#"
                    >
                      <span>Privacidad y seguridad</span>
                      <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                    </a>
                  </li>
                </ul>
              </div>
  
              {/* Sección General */}
              <div className="card border">
                <div className="card-header bg-light border-bottom">
                  <h2 className="h5 mb-0 fw-semibold">General</h2>
                </div>
                <ul className="list-group list-group-flush">
                  <li className="list-group-item p-0">
                    <a 
                      className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                      href="#"
                    >
                      <span>Notificaciones</span>
                      <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                    </a>
                  </li>
                  <li className="list-group-item p-0">
                    <a 
                      className="d-flex align-items-center justify-content-between p-3 text-decoration-none text-dark"
                      href="#"
                    >
                      <span>Ayuda y soporte</span>
                      <span className="material-symbols-outlined text-secondary"><FiChevronRight size={18} /></span>
                    </a>
                  </li>
                </ul>
              </div>
  
              {/* Botón Cerrar Sesión */}
              <div className="mt-2">
                <button className="btn btn-danger w-100 fw-bold py-2">
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }