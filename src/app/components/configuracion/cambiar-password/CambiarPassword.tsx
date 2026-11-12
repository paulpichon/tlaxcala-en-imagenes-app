"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FiArrowLeft, FiEye, FiEyeOff, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "@/context/AuthContext";
import {
  apiPut,
  isApiErrorCode,
  isForbidden,
  isRateLimit,
  isValidationFailed,
  getValidationErrors,
  getUserMessage,
  isApiError,
  ApiErrorCode,
} from "@/lib/apiClient";
import {
  cambiarPasswordSchema,
  CambiarPasswordSchema,
  MAX_PASSWORD,
} from "@/lib/validaciones";
import type { ApiResponse } from "@/types/types";
import PasswordRequisitos from "../editar-perfil/PasswordRequisitos";

type Campo = keyof CambiarPasswordSchema;

export default function CambiarPassword() {
  const router = useRouter();
  const { fetchWithAuth } = useAuth();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<CambiarPasswordSchema>({
    resolver: zodResolver(cambiarPasswordSchema),
    defaultValues: { passwordActual: "", passwordNueva: "", confirmPassword: "" },
  });

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [sesionesCerradas, setSesionesCerradas] = useState<number | null>(null);
  const [visibles, setVisibles] = useState<Record<Campo, boolean>>({
    passwordActual: false,
    passwordNueva: false,
    confirmPassword: false,
  });
  const [showRequisitos, setShowRequisitos] = useState(false);

  const passwordNueva = watch("passwordNueva");
  const exito = sesionesCerradas !== null;

  const onSubmit = async (data: CambiarPasswordSchema) => {
    setServerError("");
    setLoading(true);
    try {
      const resp = await apiPut<ApiResponse<{ sesionesCerradas?: number }>>(
        fetchWithAuth,
        "/api/usuarios/password",
        { passwordActual: data.passwordActual, passwordNueva: data.passwordNueva }
      );
      reset();
      setShowRequisitos(false);
      setSesionesCerradas(resp.data?.sesionesCerradas ?? 0);
    } catch (err) {
      // Se decide siempre por code, nunca por detail.
      if (isApiErrorCode(err, ApiErrorCode.INVALID_CURRENT_PASSWORD)) {
        setError("passwordActual", { message: "La contraseña actual es incorrecta." });
      } else if (isValidationFailed(err)) {
        const lista = getValidationErrors(err) ?? [];
        const codigos = isApiError(err) ? err.data.errors ?? [] : [];
        let asignado = false;
        for (const e of lista) {
          if (e.field === "passwordNueva" || e.field === "passwordActual") {
            const igual = codigos.some(
              (c) => c.field === e.field && c.code === "SAME_AS_CURRENT"
            );
            setError(e.field, {
              message: igual
                ? "La nueva contraseña no puede ser igual a la actual."
                : e.message,
            });
            asignado = true;
          }
        }
        if (!asignado) setServerError(getUserMessage(err, "cambiar_password"));
      } else if (isRateLimit(err)) {
        setServerError(
          isApiErrorCode(err, ApiErrorCode.PASSWORD_BLOCKED)
            ? "Demasiados intentos con contraseña incorrecta. Espera unos minutos e intenta de nuevo."
            : getUserMessage(err, "cambiar_password")
        );
      } else if (isForbidden(err)) {
        setServerError(
          "Tu sesión ya no es válida. Inicia sesión de nuevo para cambiar tu contraseña."
        );
      } else {
        setServerError(
          isApiError(err)
            ? getUserMessage(err, "cambiar_password")
            : "Ocurrió un error al cambiar tu contraseña."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const renderCampo = (
    name: Campo,
    label: string,
    autoComplete: string,
    extra?: { onFocus?: () => void; onBlur?: () => void }
  ) => (
    <div className="mb-3 text-start">
      <label className="form-label fw-medium" htmlFor={name}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <input
          id={name}
          type={visibles[name] ? "text" : "password"}
          autoComplete={autoComplete}
          maxLength={MAX_PASSWORD}
          disabled={loading || exito}
          className={`form-control form-control-lg ${errors[name] ? "is-invalid" : ""}`}
          style={{ paddingRight: "3rem" }}
          {...register(name, { onBlur: extra?.onBlur })}
          onFocus={extra?.onFocus}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisibles((v) => ({ ...v, [name]: !v[name] }))}
          aria-label={visibles[name] ? "Ocultar contraseña" : "Mostrar contraseña"}
          style={{
            position: "absolute",
            right: "0.75rem",
            top: "50%",
            transform: "translateY(-50%)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#6c757d",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
          }}
        >
          {visibles[name] ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
      {errors[name] && (
        <div className="invalid-feedback d-block">{errors[name]?.message}</div>
      )}
    </div>
  );

  return (
    <div className="d-flex flex-column bg-light vh-100">
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button
            onClick={() => router.back()}
            className="btn btn-link text-dark p-2"
            style={{ fontSize: "24px" }}
          >
            <FiArrowLeft />
          </button>
          <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
            Cambiar contraseña
          </h2>
        </div>
      </div>

      <div className="flex-grow-1 p-4">
        <div className="container mt-4" style={{ maxWidth: "500px" }}>
          <div className="bg-white shadow-sm rounded-4 p-4 border">
            {exito && (
              <div className="alert alert-success d-flex align-items-start gap-2" role="status">
                <FiCheckCircle size={20} className="flex-shrink-0 mt-1" />
                <div>
                  <strong>Contraseña actualizada.</strong>{" "}
                  {sesionesCerradas > 0
                    ? `Por seguridad, se cerraron ${sesionesCerradas} ${
                        sesionesCerradas === 1 ? "otra sesión" : "otras sesiones"
                      } en tus demás dispositivos. Esta sesión sigue activa.`
                    : "No había otras sesiones abiertas. Esta sesión sigue activa."}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {renderCampo("passwordActual", "Contraseña actual", "current-password")}
              {renderCampo("passwordNueva", "Nueva contraseña", "new-password", {
                onFocus: () => setShowRequisitos(true),
                onBlur: () => setShowRequisitos(false),
              })}
              <PasswordRequisitos password={passwordNueva ?? ""} visible={showRequisitos} />
              <div className="mt-3" />
              {renderCampo("confirmPassword", "Confirmar nueva contraseña", "new-password")}

              {serverError && (
                <p className="text-danger fw-semibold text-center">{serverError}</p>
              )}

              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-bold"
                disabled={loading || exito}
              >
                {loading ? "Guardando..." : "Cambiar contraseña"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
