// Image next
import Image from "next/image";

export default function Publicidad() {
    return (
        <div className="sugerencias_para_seguir">
            {/* <!-- leyenda publicidad --> */}
                <p className="publicidad">Publicidad...</p>
            {/* <!-- fin leyenda publicidad --> */}
            <a href="http://">
                <div className="card">
                    <Image 
                        src="/publicidad/votadas1.jpg" 
                        width={100}
                        height={200}
                        className="card-img-top"
                        alt="Card image cap"
                    />
                </div>
            </a>
        </div>
    );
}