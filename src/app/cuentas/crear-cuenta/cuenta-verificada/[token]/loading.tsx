// Esta pagina de loading, podri verse afectada porque RENDER se desactiva cada cierto tiempo,  entonces podria pasar que esta pagina se quede pegada cuando esta cargando, ya que al hacer la consulta de la API esta RENDER podria estar desactivada, pero de no estarlo deberia funciona normal.
export default function Loading() {
    return (
        <div className="d-flex vh-100 justify-content-center align-items-center">
            <p className="fs-4 fw-semibold">Verificando correo...</p>
        </div>
    );
}