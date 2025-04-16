// components/DynamicComponent.jsx
'use client';
// Reqact, useState
import React, { useEffect, useState } from "react";// Link nextjs
// usePathName
import { usePathname, useRouter } from 'next/navigation';
// estilos de la pagina son iguales para correo-enviado y para correo-enviado.restablecer-password
import estilosCorreoEnviado from "../../../ui/cuentas/confirmacion/correo-enviado/CorreoEnviado.module.css";
// Reenviar correo
import ModalReenviarCorreo from "./ModalReenviarCorreo";
// Header principal
import { HeaderPrincipalTei } from "@/app/components/HeaderPrincipalTei";
// Footer
import FooterMain from "@/app/components/FooterMain";
// *********PRUEBA DE REENVIAR CORREO********* 
import { reenviarCorreo } from "@/lib/actions";

export default function CorreoEnviado() {
  // validar session storage
  const router = useRouter();
  // URL usePathname
  const pathname = usePathname();
  // validar si hay token
  const [isValid, setIsValid] = useState(false);
  // Modal
  const [showModal, setShowModal] = useState(false);
  const openModal = () => setShowModal(true);
  const closeModal = () => setShowModal(false);
  // Mensajes
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);
  const [esExito, setEsExito] = useState<boolean | null>(null);
  // bloquear el reenvio boton
  const [bloqueado, setBloqueado] = useState(false);
  // Quitar boton si status === 400
  const [cuentaVerificada, setCuentaVerificada] = useState(false);

  useEffect(() => {
    const tiempoGuardado = localStorage.getItem("bloqueoReenvioCorreo");
    if (tiempoGuardado) {
      const tiempoRestante = parseInt(tiempoGuardado) - Date.now();
      if (tiempoRestante > 0) {
        setBloqueado(true);
        setTimeout(() => {
          setBloqueado(false);
          localStorage.removeItem("bloqueoReenvioCorreo");
        }, tiempoRestante);
      }
    }
  }, []);
  // bloquear el boton de reenvio
  const iniciarBloqueo = () => {
    const tiempoDesbloqueo = Date.now() + 5 * 60 * 1000; // 5 minutos desde ahora
    localStorage.setItem("bloqueoReenvioCorreo", tiempoDesbloqueo.toString());
    setBloqueado(true);
  
    setTimeout(() => {
      setBloqueado(false);
      localStorage.removeItem("bloqueoReenvioCorreo");
    }, 5 * 60 * 1000); // 5 minutos
  }; 


  // Validar session storage
  useEffect(() => {
    // Solo aplicamos la lógica de sessionStorage para la ruta '/cuentas/confirmacion/correo-enviado'
    if (pathname === '/cuentas/confirmacion/correo-enviado') {
      const token = sessionStorage.getItem('registroToken');
      if (!token) {
        router.replace('/'); // Redirige si no hay token
      } else {
        setIsValid(true);
      }
    } else {
      // Si es otra ruta, no hacemos nada y permitimos el acceso normalmente
      setIsValid(true);
    }
  }, [pathname, router]);


  // prueba de reenviar correo separacion
  const handleReenviarCorreo = async () => {
    const token = sessionStorage.getItem("registroToken");
    if (!token) return;
    
    const resultado = await reenviarCorreo(token);
    
    setMensajeReenvio(resultado.mensaje ? resultado.mensaje : null);
    setEsExito(resultado.esExito);
    setCuentaVerificada(resultado.cuentaVerificada);
  
    if (resultado.esExito || (!resultado.cuentaVerificada && !resultado.esExito)) {
      iniciarBloqueo();
    }
  };

  if (!isValid) return null; // No muestra nada hasta que se valide


  // contenido del correo enviado
  let content;
  switch (pathname) {
    case '/cuentas/confirmacion/correo-enviado':
      content = (
        <>
          <h3 className={`${ estilosCorreoEnviado.subtitulo_h3 }`}>Cuenta registrada</h3>
          <p className={`${ estilosCorreoEnviado.texto }`}>Te enviamos un correo electrónico con un link para poder verificar tu registro, ten en cuenta que el link solo estara activo por una hora. Si no lo encuentras en tu bandeja de entrada, busca en correo no deseado o en spam.</p>
        </>
      );
      break;
    case '/cuentas/confirmacion/correo-enviado-restablecer-password':
      content = (
        <>
          <h3 className={`${ estilosCorreoEnviado.subtitulo_h3 }`}>Correo enviado</h3>
          <p className={`${ estilosCorreoEnviado.texto }`}>Te enviamos un correo electrónico con un link para poder reestablecer tu contraseña, ten en cuenta que el link solo estara activo por una hora. Si no lo encuentras en tu bandeja de entrada, busca en correo no deseado o en spam.</p>
        </>
      );
      break;
    default:
      router.replace('/'); // Redirige si la URL no es válida
  }
  // Retornar el componente
  return (
    <>
    {/* Hear principal */}
      <HeaderPrincipalTei />
      
      <div className="col-sm-9 col-md-7 col-lg-6">
          <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
              <div className={`${estilosCorreoEnviado.contenedor_titulos}`}>
                {content}
              </div>
              <div className={`${estilosCorreoEnviado.contenedor_formulario} d-block`}>
                  <a href="#" className={`${estilosCorreoEnviado.texto} d-block`} onClick={openModal}>¿No recibiste el correo electrónico?</a>
              </div>
          </div>
      </div>
      {/* Footer */}
      <FooterMain />
                
      {/* MODAL */}
      <ModalReenviarCorreo
        show={showModal}
        onClose={closeModal}
        // onReenviar={reenviarCorreo}
        onReenviar={handleReenviarCorreo}
        estilos={estilosCorreoEnviado}
        mensaje={mensajeReenvio}
        esExito={esExito}
        bloqueado={bloqueado}
        cuentaVerificada={cuentaVerificada}
      />
    </>
  );
};

