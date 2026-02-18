
// =============================
// 📦 IMPORTACIONES CLIENT
// =============================

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiArrowLeft } from "react-icons/fi";

// =============================
// 📄 Página de FAQ
// =============================

export default function PreguntasFrecuentes() {

  const router = useRouter();

  // Estado que controla qué pregunta está abierta
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Lista de preguntas y respuestas
  // Esto facilita mantenimiento futuro
  const faqs = [
    {
      question: "¿Cómo creo una cuenta en TlaxApp?",
      answer: "Puedes registrarte con tu correo electrónico desde la pantalla de inicio. Recibirás un correo de verificación antes de comenzar a usar la plataforma."
    },
    {
      question: "Olvidé mi contraseña, ¿qué hago?",
      answer: "En la pantalla de inicio de sesión selecciona '¿Olvidaste tu contraseña?' y sigue las instrucciones enviadas a tu correo."
    },
    {
      question: "¿Cómo elimino una publicación?",
      answer: "En el menú de opciones de cada publicación puedes eliminarla si eres el propietario. Esta acción es permanente."
    },
    {
      question: "¿Cómo reporto a un usuario?",
      answer: "Desde la página de ayuda y soporte puedes reportar usuarios. Nuestro equipo revisará el caso."
    },
    {
      question: "¿Cómo funciona el sistema de seguidores?",
      answer: "Puedes seguir usuarios para ver sus publicaciones en tu feed. También puedes dejar de seguirlos cuando quieras."
    },
    {
      question: "¿Cómo protegen mi información?",
      answer: "Utilizamos medidas de seguridad modernas como cifrado y autenticación segura para proteger tu información."
    },
    {
      question: "¿Cuánto tarda soporte en responder?",
      answer: "Normalmente respondemos en un plazo de 24 a 48 horas hábiles. Recibirás un número de ticket."
    },
    {
      question: "¿Cómo elimino mi cuenta?",
      answer: "Puedes solicitar la eliminación desde configuración o contactando a soporte. La eliminación es permanente."
    }
  ];

  return (
    <div className="d-flex flex-column bg-light vh-100">

      {/* HEADER */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">

          <button
            onClick={() => router.back()}
            className="btn btn-link text-dark p-2"
            style={{ fontSize: '24px' }}
          >
            <FiArrowLeft />
          </button>

          <h1 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">
            Preguntas frecuentes
          </h1>
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container" style={{ maxWidth: '600px' }}>

          <div className="card shadow-sm border-0">
            <div className="card-body">

              <h2 className="fw-bold mb-4" style={{ fontSize: "16px" }}>
                Resolvemos tus dudas más comunes
              </h2>

              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <div key={index} className="border-bottom py-3">

                    <button
                      onClick={() =>
                        setOpenIndex(isOpen ? null : index)
                      }
                      className="w-100 text-start bg-transparent border-0 d-flex justify-content-between align-items-center fw-semibold"
                    >
                      {faq.question}
                      <span
                        style={{
                          transition: "transform 0.3s ease",
                          transform: isOpen ? "rotate(180deg)" : "rotate(0deg)"
                        }}
                      >
                        ▼
                      </span>
                    </button>

                    <div
                      style={{
                        maxHeight: isOpen ? "200px" : "0px",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                      }}
                    >
                      <p className="text-muted mt-2 mb-0 small">
                        {faq.answer}
                      </p>
                    </div>

                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
