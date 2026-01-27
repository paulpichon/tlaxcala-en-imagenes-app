'use client';

import Image from "next/image";
import Link from "next/link";

export default function HeaderSuperior() {
    return (
        <nav className="menu_superior_central">
            <Link href="/inicio" className="header_marca">
                <Image
                    src="/assets/icono-tlaxapp-beige.png"
                    alt="TlaxApp"
                    width={50}
                    height={50}
                    priority
                />
                <span className="titulo_header_superior_app">
                    TlaxApp
                </span>
            </Link>
        </nav>
    );
}
