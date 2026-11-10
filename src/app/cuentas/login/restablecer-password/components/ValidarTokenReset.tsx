"use client";
// Validación del token de restablecimiento desde el navegador.
//
// La llamada a GET /validar-token-reset-password se hace aquí (Client Component)
// y no en el Server Component de la página: si la hiciera el servidor de Next,
// el backend vería la IP del servidor y el techo por IP (flujoTokenIpLimiter,
// 60/15 min) lo compartirían todos los usuarios (H5 en el backend).

import { useEffect, useState } from "react";
import Link from "next/link";
import restaPasssword from "@/app/ui/cuentas/login/restablecer-password/RestablecerPassword.module.css";
import FormularioNuevaPassword from "./Formulario";
import { validarTokenRestablecerPassword, type ValidacionTokenReset } from "@/lib/actions";

export default function ValidarTokenReset({ token }: { token: string }) {
  // null = validando
  const [resultado, setResultado] = useState<ValidacionTokenReset | null>(null);
  // Se incrementa con "Intentar de nuevo" (reintento manual, nunca automático).
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    setResultado(null);
    validarTokenRestablecerPassword(token).then((r) => {
      if (!cancelado) setResultado(r);
    });
    return () => {
      cancelado = true;
    };
  }, [token, intento]);

  // ⏳ Validando el enlace
  if (!resultado) {
    return (
      <div className="text-center mt-5" role="status" aria-live="polite">
        <div className="spinner-border text-secondary" aria-hidden="true" />
        <p className="text-muted mt-3">Validando tu enlace…</p>
      </div>
    );
  }

  // 🚦 429: el enlace NO es inválido. No se ofrece "Solicitar nuevo enlace":
  // pedir uno nuevo invalidaría el enlace que sigue vigente.
  if (resultado.rateLimited) {
    return (
      <div className="text-center mt-5" role="alert">
        <h2>Demasiadas solicitudes</h2>
        <p className="text-muted mt-3">{resultado.mensaje}</p>
        <p className="text-muted">
          Tu enlace sigue siendo válido: vuelve a abrirlo en unos minutos.
        </p>
        <p className="mt-3">
          <Link
            className="text-decoration-none text-secondary"
            href="/cuentas/login"
            aria-label="Volver a iniciar sesión"
          >
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  // ⚠️ Red / 5xx: no se sabe si el enlace es válido. Tampoco se ofrece
  // "Solicitar nuevo enlace" (invalidaría el enlace si sigue vigente).
  if (resultado.error) {
    return (
      <div className="text-center mt-5" role="alert">
        <h2>No pudimos comprobar tu enlace</h2>
        <p className="text-muted mt-3">{resultado.mensaje}</p>
        <button
          type="button"
          className="btn btn-primary mt-3"
          onClick={() => setIntento((n) => n + 1)}
        >
          Intentar de nuevo
        </button>
        <p className="mt-3">
          <Link
            className="text-decoration-none text-secondary"
            href="/cuentas/login"
            aria-label="Volver a iniciar sesión"
          >
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    );
  }

  // ✅ Token válido: formulario de nueva contraseña
  if (resultado.valid) {
    return (
      <div className={`${restaPasssword.contenedor_formulario}`}>
        <div className={`${restaPasssword.contenedor_titulos}`}>
          <h1 className={`${restaPasssword.subtitulo_h3}`}>Restablecer contraseña</h1>
          <div className={restaPasssword.icono} role="img" aria-label="Candado">
            🔒
          </div>
          <p className={restaPasssword.texto}>
            Elige una nueva contraseña segura para tu cuenta.
          </p>
        </div>
        <FormularioNuevaPassword token={token} />
      </div>
    );
  }

  // ❌ Token inválido o expirado
  return (
    <div className="text-center mt-5">
      <h2>Este enlace ya no es válido</h2>
      <p className="text-muted mt-3">
        Por seguridad, los enlaces para cambiar contraseña solo
        funcionan por tiempo limitado y se invalidan después de usarse.
      </p>

      <Link
        className="btn btn-primary mt-3"
        href="/cuentas/login/password-olvidado"
        aria-label="Solicitar nuevo enlace para restablecer contraseña"
      >
        Solicitar nuevo enlace
      </Link>

      <p className="mt-3">
        <Link
          className="text-decoration-none text-secondary"
          href="/cuentas/login"
          aria-label="Volver a iniciar sesión"
        >
          ← Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
