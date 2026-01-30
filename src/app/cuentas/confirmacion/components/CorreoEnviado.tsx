// Función para el envio de correo para las paginas de: restablecer contraseña y registro de usuarios
'use client';

import React, { useEffect, useState } from "react";
// useRouter para redireccionar a otra pagina
// usePathname para obtener la ruta actual
import { usePathname, useRouter } from 'next/navigation';
// CSS
import estilosCorreoEnviado from "../../../ui/cuentas/confirmacion/correo-enviado/CorreoEnviado.module.css";
// Modal para reenviar correo
import ModalReenviarCorreo from "./ModalReenviarCorreo";
// funcion para reenviar el correo electronico al usuario cuando se registra o restablece su contraseña dependiendo de la ruta en la que se encuentre
import  {  reenviarCorreo, 
          reenviarCorreoRestablecerPassword 
        } from "@/lib/actions";
// Header 
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer
import FooterMain from "@/app/components/FooterMain";
import Link from "next/link";
// Rutas de la paginas de registro y restablecer contraseña
const rutas = {
  registro: "/cuentas/confirmacion/correo-enviado",
  restablecer: "/cuentas/confirmacion/correo-enviado-restablecer-password"
};

// Funcion para obtener el token dependiendo de la ruta en la que se encuentre el usuario
// En ambos casos se guarda el token en el sessionStorage
function obtenerToken(pathname: string): string | null {
  // Se verifica de donde viene el token, si es de registro o de restablecer contraseña
  if (pathname === rutas.registro) return sessionStorage.getItem("registroToken");
  if (pathname === rutas.restablecer) return sessionStorage.getItem("passForgetToken");
  // Si no existe el token, se retorna null
  // Si no existe el token, se redirecciona a la pagina de inicio
  return null;
}

export default function CorreoEnviado() {
  // Redireccionar a otra pagina
  const router = useRouter();
  // Obtener la ruta actual
  const pathname = usePathname();
  // Estado de envio del formulario
  const [isValid, setIsValid] = useState(false);
  // Estado de mensaje de exito o error
  const [showModal, setShowModal] = useState(false);
  // Estado de mensaje de exito o error
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);
  // Estado de exito o error
  const [esExito, setEsExito] = useState<boolean | null>(null);
  // Estado de bloqueo del boton de reenvio
  const [bloqueado, setBloqueado] = useState(false);
  // Estado de cuenta verificada
  const [cuentaVerificada, setCuentaVerificada] = useState(false);
  // Estado de tiempo restante para el reenvio del correo
  const [tiempoRestante, setTiempoRestante] = useState<number | null>(null);
  // Abrir modal
  const openModal = () => setShowModal(true);
  // Cerrar modal
  const closeModal = () => setShowModal(false);
  // Iniciar bloqueo del boton de reenvio
  // Se guarda el tiempo de bloqueo en el localStorage por 5 minutos
  const iniciarBloqueo = () => {
    const tiempoDesbloqueo = Date.now() + 5 * 60 * 1000;
    localStorage.setItem("bloqueoReenvioCorreo", tiempoDesbloqueo.toString());
    setBloqueado(true);
    setTiempoRestante(5 * 60); // en segundos
  };
  // Verificar si el tiempo de bloqueo ya ha pasado
  useEffect(() => {
    // Verificar si ya se ha enviado un correo en los últimos 5 minutos
    const tiempoGuardado = localStorage.getItem("bloqueoReenvioCorreo");
    // Si existe el tiempo guardado, se calcula el tiempo restante
    // Si el tiempo restante es mayor a 0, se bloquea el boton de reenvio
    if (tiempoGuardado) {
      const tiempo = parseInt(tiempoGuardado);
      const restante = tiempo - Date.now();
      if (restante > 0) {
        setBloqueado(true);
        setTiempoRestante(Math.floor(restante / 1000));
      }
    }
  }, []);
  // Contador para el tiempo restante
  // Se inicia el contador cuando el boton de reenvio esta bloqueado
  useEffect(() => {
    if (bloqueado && tiempoRestante !== null) {
      const interval = setInterval(() => {
        setTiempoRestante(prev => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setBloqueado(false);
            localStorage.removeItem("bloqueoReenvioCorreo");
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [bloqueado, tiempoRestante]);
  // Verificar si el token existe y si la ruta es la correcta
  useEffect(() => {
    const token = obtenerToken(pathname);
    if (!token || ![rutas.registro, rutas.restablecer].includes(pathname)) {
      // Si no existe el token, se redirecciona a la pagina de inicio
      router.replace('/');
    } else {
      // Si existe el token, se valida la ruta
      setIsValid(true);
    }
  }, [pathname, router]);
  // Manejo del reenvio del correo electronico
  const handleReenviarCorreo = async () => {
    // Se obtiene el token de la ruta actual
    const token = obtenerToken(pathname);
    // Si no existe el token, se redirecciona a la pagina de inicio
    if (!token) return;
    // Se verifica si la ruta es la correcta
    const resultado =
      // Si la ruta es la de registro, se llama a la funcion de reenviar correo
      // Si la ruta es la de restablecer contraseña, se llama a la funcion de reenviar correo para restablecer contraseña
      pathname === rutas.registro
        ? await reenviarCorreo(token)
        : await reenviarCorreoRestablecerPassword(token);
    // Si el resultado es exitoso, se muestra el mensaje de exito
    setMensajeReenvio(resultado.mensaje ?? null);
    // Si el resultado es exitoso, se inicia el bloqueo del boton de reenvio
    setEsExito(resultado.esExito);
    setCuentaVerificada(resultado.cuentaVerificada ?? false);
    // Si el resultado es exitoso, se inicia el bloqueo del boton de reenvio
    if (resultado.esExito || (!resultado.cuentaVerificada && !resultado.esExito)) {
      iniciarBloqueo();
    }
  };
  // Si la ruta no es valida, se redirecciona a la pagina de inicio
  // Si la ruta es valida, se muestra el contenido
  if (!isValid) return null;
  // Contenido del mensaje dependiendo de la ruta
  // Se utiliza un objeto para almacenar los mensajes de cada ruta
  const mensajes = {
    [rutas.registro]: {
      titulo: "Cuenta registrada",
        textoUno: "Te enviamos un correo electrónico con un enlace para continuar la verificación de tu registro.",
        textoDos: "El enlace estará activo por 1 hora. Si no lo encuentras, revisa spam o correo no deseado."
    },
    [rutas.restablecer]: {
      titulo: "Correo enviado",
      textoUno: "Te enviamos un correo electrónico con un enlace para restablecer tu contraseña.",
      textoDos: "El enlace estará activo por 1 hora. Si no lo encuentras, revisa spam o correo no deseado."
    }
  };
  // Se obtiene el mensaje dependiendo de la ruta
  // Se utiliza el pathname para obtener el mensaje correspondiente
  const contenido = mensajes[pathname];

  return (
    <>
      <HeaderPrincipalTei />
      <div className="col-sm-9 col-md-7 col-lg-6">
        <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
          <div className={estilosCorreoEnviado.contenedor_titulos}>
            <h3 className={estilosCorreoEnviado.subtitulo_h3}>{contenido.titulo}</h3>
            <div className={estilosCorreoEnviado.icono}>
              ✓
            </div>

            <p className={estilosCorreoEnviado.texto}>{contenido.textoUno}</p>
            <p className={estilosCorreoEnviado.texto}>{contenido.textoDos}</p>
          </div>
          <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
            <a className={estilosCorreoEnviado.reenviar} onClick={openModal}>
              ¿No recibiste el correo electrónico?
            </a>
          </div>
          {pathname === rutas.restablecer && (
            <Link href="/" className="btn  btn-sm">
              ← Volver a iniciar sesión
            </Link>
          )}

        </div>
      </div>
      <FooterMain />
      <ModalReenviarCorreo
        show={showModal}
        onClose={closeModal}
        onReenviar={handleReenviarCorreo}
        estilos={estilosCorreoEnviado}
        mensaje={mensajeReenvio}
        esExito={esExito}
        bloqueado={bloqueado}
        cuentaVerificada={cuentaVerificada}
        tiempoRestante={tiempoRestante}
      />
    </>
  );
}
