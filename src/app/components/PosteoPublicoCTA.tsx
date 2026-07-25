"use client";

import Link from "next/link";

export default function PosteoPublicoCTA() {
  return (
    <div
      className="fixed-bottom bg-white border-top shadow-lg p-3"
      style={{ zIndex: 1020 }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-12 col-md-7 mb-2 mb-md-0">
            <p className="mb-0 fw-semibold">
              Inicia sesión para comentar y dar like
            </p>
            <small className="text-muted">
              Únete a TlaxApp para interactuar con las publicaciones
            </small>
          </div>
          <div className="col-12 col-md-5 d-flex gap-2 justify-content-md-end">
          {/* // "Iniciar sesión" — outline gold */}
            <Link href="/cuentas/login" style={{
              backgroundColor: "#FFFFFF",
              border: "2px solid #EBCA9A",
              color: "#EBCA9A",
              borderRadius: "999px",
              padding: "0.3rem 1rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}>
              Iniciar sesión
            </Link>

            {/* // "Crear cuenta" — gold sólido   */}
            <Link href="/cuentas/crear-cuenta" style={{
              backgroundColor: "#EBCA9A",
              border: "2px solid #EBCA9A",
              color: "#FFFFFF",
              borderRadius: "999px",
              padding: "0.3rem 1rem",
              fontWeight: 500,
              textDecoration: "none",
              transition: "all 0.3s ease",
            }}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
