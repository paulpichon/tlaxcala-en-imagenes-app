"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import styles from "./ui/Home.module.css";
import FooterMain from "./components/FooterMain";
import iconoTlaxapp from "@/../public/assets/icono-tlaxapp-blanco.png";
import { registerEarlyAccess } from "@/lib/early-access";

export default function Home() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [inputError, setInputError] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate" | "blocked"
  >("idle");

  const BLOCKED_KEY = "earlyAccessBlockedUntil";
  const blockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(BLOCKED_KEY);
    if (stored) {
      const until = parseInt(stored, 10);
      if (Date.now() < until) {
        setStatus("blocked");
        setMessage("Demasiados intentos. Intenta más tarde.");
      } else {
        localStorage.removeItem(BLOCKED_KEY);
      }
    }

    return () => {
      if (blockTimeoutRef.current) clearTimeout(blockTimeoutRef.current);
    };
  }, []);

  const handleChange = (value: string) => {
    setInput(value);
  
    if (value.includes("@") && !isValidEmail(value)) {
      setInputError("Correo inválido");
    } else {
      setInputError("");
    }
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleSubmit = async () => {
    if (!input) return;

    const looksLikeEmail = input.includes("@");

    if (looksLikeEmail && !isValidEmail(input)) {
      setStatus("error");
      setMessage("Por favor ingresa un correo válido");
      return;
    }

    setStatus("loading");
    setMessage("");

    const result = await registerEarlyAccess(input);

    if (!result.ok) {
      const { error } = result;

      switch (error.code) {
        case "VALIDATION_FAILED": {
          const fieldMsg = error.errors[0]?.message;
          setInputError(fieldMsg ?? error.detail);
          setStatus("error");
          break;
        }
        case "CONFLICT":
          setStatus("duplicate");
          setMessage(error.detail);
          setInput("");
          break;
        case "EARLY_ACCESS_BLOCKED": {
          const until = Date.now() + 10 * 60 * 1000;
          localStorage.setItem(BLOCKED_KEY, String(until));
          blockTimeoutRef.current = setTimeout(() => {
            localStorage.removeItem(BLOCKED_KEY);
            blockTimeoutRef.current = null;
            setStatus("idle");
            setMessage("");
          }, 10 * 60 * 1000);
          setStatus("blocked");
          setMessage(error.detail);
          break;
        }
        default:
          setStatus("error");
          setMessage("Ocurrió un error inesperado. Intenta más tarde.");
      }
      return;
    }

    setStatus("success");
    setMessage(result.data.msg);
    setInput("");
  };

  return (
    <main className={styles.wrapper} role="main">
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <Image
            src={iconoTlaxapp}
            alt="TlaxApp, la red social de Tlaxcala"
            width={200}
            height={200}
            priority
            className={styles.icono}
          />

          <h1 className={styles.title}>TlaxApp</h1>

          <p className={styles.subtitle}>
            La red social de Tlaxcala.
          </p>

          <p className={styles.subtitle}>
            TlaxApp está en acceso privado. Regístrate para obtener tu invitación y ser de los primeros en mapear el estado
          </p>

          {/* INPUT */}
          <div className={styles.inputContainer}>
            <input
              type="text"
              placeholder="Tu correo o usuario de Instagram"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              readOnly={status === "blocked"}
              className={styles.input}
            />

              {inputError && <span className={styles.inputError}>{inputError}</span>}

            <button
              onClick={handleSubmit}
              disabled={status === "loading" || status === "blocked"}
              className={styles.button}
            >
              {status === "loading"
                ? "Enviando..."
                : status === "blocked"
                  ? "Bloqueado temporalmente"
                  : "Quiero acceso anticipado"}
            </button>
          </div>

          {/* MENSAJES */}
          {status === "success" && (
            <p className={`${styles.feedback} ${styles.success}`}>
              ✅ {message}
            </p>
          )}

          {status === "duplicate" && (
            <p className={`${styles.feedback} ${styles.warning}`}>
              ⚠️ {message}
            </p>
          )}

          {status === "blocked" && (
            <p className={`${styles.feedback} ${styles.error}`}>
              ⏳ {message}
            </p>
          )}

          {status === "error" && (
            <p className={`${styles.feedback} ${styles.error}`}>
              ❌ {message}
            </p>
          )}
        </div>
      </section>

      <FooterMain />
    </main>
  );
}