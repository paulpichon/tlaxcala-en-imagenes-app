"use client";
// Verificación del correo desde el navegador.
//
// GET /api/auth/verificar-correo/:token se hace aquí (Client Component) y no en
// el Server Component de la página: si la hiciera el servidor de Next, el backend
// vería la IP del servidor y el techo por IP (flujoTokenIpLimiter, 60/15 min) lo
// compartirían todos los usuarios (H5 en el backend).

import { useEffect, useState } from "react";
import Link from "next/link";
import cuentaVerificada from "@/app/ui/cuentas/crear-cuenta/cuenta-verificada/CuentaVerificada.module.css";
import { apiGet, getUserMessage, isRateLimit, isUnauthorized } from "@/lib/apiClient";

type ResultadoVerificacion =
  | { estado: "verificada" }
  | { estado: "invalido" }
  | { estado: "limite"; mensaje: string }
  | { estado: "error" };

// La verificación consume el token (un solo uso). En desarrollo, React
// StrictMode monta el efecto dos veces: la segunda petición respondería 401 y
// pisaría el éxito. Se comparte la promesa en vuelo por token para enviar una
// sola petición; se libera al terminar para que recargar vuelva a intentarlo.
const verificacionesEnCurso = new Map<string, Promise<ResultadoVerificacion>>();

function verificarCorreo(token: string): Promise<ResultadoVerificacion> {
  const enCurso = verificacionesEnCurso.get(token);
  if (enCurso) return enCurso;

  const promesa = apiGet(
    fetch,
    `/api/auth/verificar-correo/${token}`,
    undefined,
    { cache: "no-store" }
  )
    .then((): ResultadoVerificacion => ({ estado: "verificada" }))
    .catch((error: unknown): ResultadoVerificacion => {
      if (isRateLimit(error)) {
        return { estado: "limite", mensaje: getUserMessage(error, "registro") };
      }
      console.error("Error verificando cuenta:", error);
      if (isUnauthorized(error)) return { estado: "invalido" };
      return { estado: "error" };
    })
    .finally(() => {
      verificacionesEnCurso.delete(token);
    });

  verificacionesEnCurso.set(token, promesa);
  return promesa;
}

export default function VerificacionCuenta({ token }: { token: string }) {
  // null = verificando
  const [resultado, setResultado] = useState<ResultadoVerificacion | null>(null);

  useEffect(() => {
    let cancelado = false;
    setResultado(null);
    verificarCorreo(token).then((r) => {
      if (!cancelado) setResultado(r);
    });
    return () => {
      cancelado = true;
    };
  }, [token]);

  // ⏳ Verificando
  if (!resultado) {
    return (
      <div className={cuentaVerificada.contenedor_formulario}>
        <div className={cuentaVerificada.contenedor_titulos} role="status" aria-live="polite">
          <div className="spinner-border text-secondary my-4" aria-hidden="true" />
          <p>Verificando tu cuenta…</p>
        </div>
      </div>
    );
  }

  // ✅ Cuenta verificada
  if (resultado.estado === "verificada") {
    return (
      <div className={cuentaVerificada.contenedor_formulario}>
        <div className={cuentaVerificada.contenedor_titulos}>
          <h1>¡Tu cuenta ha sido verificada!</h1>
          <p>
            Ya puedes iniciar sesión y comenzar a usar TlaxApp para
            descubrir y compartir los mejores lugares de Tlaxcala.
          </p>

          <div
            className={cuentaVerificada.icono}
            role="img"
            aria-label="Cuenta verificada exitosamente"
          >
            ✅
          </div>

          <Link
            href="/cuentas/login"
            className={cuentaVerificada.boton_login}
            aria-label="Ir a iniciar sesión"
          >
            Iniciar sesión
          </Link>

          <p className="text-muted small mt-3">
            ¡Bienvenido a la comunidad de TlaxApp!
          </p>
        </div>
      </div>
    );
  }

  // 🚦 429: el enlace no se usó; no es "enlace no válido".
  if (resultado.estado === "limite") {
    return (
      <div className={cuentaVerificada.contenedor_formulario}>
        <div className={cuentaVerificada.contenedor_titulos} role="alert">
          <h2>Demasiadas solicitudes</h2>
          <p>{resultado.mensaje}</p>
          <p className="text-muted small">
            Tu cuenta aún no se ha verificado, pero tu enlace sigue siendo
            válido: vuelve a abrirlo en unos minutos.
          </p>

          <div className="text-center my-4" style={{ fontSize: "4rem" }} aria-hidden="true">
            ⏳
          </div>

          <Link
            href="/cuentas/login"
            className={cuentaVerificada.boton_login}
            aria-label="Volver a inicio de sesión"
          >
            Volver a inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  // ❌ Token inválido o expirado
  if (resultado.estado === "invalido") {
    return (
      <div className={cuentaVerificada.contenedor_formulario}>
        <div className={cuentaVerificada.contenedor_titulos}>
          <h2>Este enlace ya no es válido</h2>

          <p>
            Por seguridad, los enlaces de verificación tienen un tiempo
            limitado y solo pueden usarse una vez.
          </p>

          <div className="alert alert-warning mt-3" role="alert">
            <p className="mb-2"><strong>Posibles causas:</strong></p>
            <ul className="mb-0 text-start small">
              <li>El enlace ya fue usado anteriormente</li>
              <li>Han pasado más de 24 horas desde que se envió</li>
              <li>El enlace está incompleto o fue modificado</li>
            </ul>
          </div>

          <div className="mt-4">
            <p className="mb-3">¿Qué puedes hacer?</p>

            <p className={cuentaVerificada.texto}>
              <Link
                className={cuentaVerificada.link_inciar_sesion}
                href="/cuentas/login"
                aria-label="Intentar iniciar sesión"
              >
                Intentar iniciar sesión
              </Link>
            </p>

            <p className="text-muted small">
              ¿Necesitas un nuevo enlace?{" "}
              <Link
                href="/contacto"
                className="text-primary"
                aria-label="Contactar a soporte"
              >
                Contacta a soporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ⚠️ Error genérico (red, 5xx…)
  return (
    <div className={cuentaVerificada.contenedor_formulario}>
      <div className={cuentaVerificada.contenedor_titulos}>
        <h2>Error al verificar la cuenta</h2>
        <p>
          Hubo un problema al procesar tu solicitud.
          Por favor, intenta nuevamente más tarde.
        </p>

        <div className="text-center my-4" style={{ fontSize: "4rem" }}>
          ⚠️
        </div>

        <div className="mt-4">
          <Link
            href="/cuentas/login"
            className={cuentaVerificada.boton_login}
            aria-label="Volver a inicio de sesión"
          >
            Volver a inicio de sesión
          </Link>

          <p className="text-muted small mt-3">
            Si el problema persiste,{" "}
            <Link href="/contacto" className="text-primary">
              contacta a soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
