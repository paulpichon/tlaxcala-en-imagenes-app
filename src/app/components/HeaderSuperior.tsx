'use client';

import Image from "next/image";
import Link from "next/link";

export default function HeaderSuperior({ href = "/inicio" }: { href?: string }) {
    return (
        <div className="menu_superior_central" role="banner">
            <Link 
                href={href} 
                className="header_marca"
                aria-label="Banner de bienvenida"
                >
                <Image
                    src="/assets/icono-tlaxapp-beige.png"
                    alt="Logotipo de la app"
                    width={50}
                    height={50}
                    priority
                />
                <span className="titulo_header_superior_app">
                    TlaxApp
                </span>
            </Link>
        </div>
    );
}
