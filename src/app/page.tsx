"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./ui/Home.module.css";
import FooterMain from "./components/FooterMain";
import iconoTlaxapp from "@/../public/assets/icono-tlaxapp-blanco.png";

export default function Home() {
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const [inputError, setInputError] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate"
  >("idle");

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
  
    // 🧠 detectar si parece email
    const looksLikeEmail = input.includes("@");
  
    if (looksLikeEmail && !isValidEmail(input)) {
      setStatus("error");
      setMessage("Por favor ingresa un correo válido");
      return;
    }
  
    try {
      setStatus("loading");
      setMessage("");
  
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/early-access`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ contacto: input }),
        }
      );
  
      const data = await res.json();
  
      if (res.status === 409) {
        setStatus("duplicate");
        setMessage(data.msg);
        return;
      }
  
      if (!res.ok) {
        throw new Error(data.msg || "Error");
      }
  
      setStatus("success");
      setMessage(data.msg);
      setInput("");
    } catch (error: any) {
      console.error(error);
      setStatus("error");
      setMessage(error.message || "Ocurrió un error");
    }
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
              className={styles.input}
            />

              {inputError && <span className={styles.error}>{inputError}</span>}

            <button onClick={handleSubmit} className={styles.button}>
              {status === "loading" ? "Enviando..." : "Quiero acceso anticipado"}
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