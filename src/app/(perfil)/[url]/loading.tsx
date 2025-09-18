import Spinner from "@/app/components/spinner";

// Esta pagina de loading, podria verse afectada porque RENDER se desactiva cada cierto tiempo,  entonces podria pasar que esta pagina se quede pegada cuando esta cargando, ya que al hacer la consulta de la API esta RENDER podria estar desactivada, pero de no estarlo deberia funciona normal.
export default function Loading() {
    return (
        <div className="d-flex justify-content-center align-items-center vh-100">
            <Spinner />
        </div>
    );
}