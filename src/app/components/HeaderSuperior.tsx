// Header superior de las páginas principales de la APP: inicio, perfil, notificaciones, etc etc
'use client';
export default function HeaderSuperior() {
    return (
        <>
            <nav className="navbar-expand-lg menu_superior_central">
                <h1 className="titulo_header_superior_app">
                    TLAXCALA EN 
                    <span className="display_inline_titulo"> IMÁGENES</span>
                </h1>
                <h6 className="mostrar_h6_por">por 
                    <span className="span_tad_header_app d-block" data-bs-toggle="tooltip" data-bs-placement="right" title="Tlaxcala Al Descubierto">
                        T A D
                    </span>
                </h6>
            </nav>
        </>
    );
}