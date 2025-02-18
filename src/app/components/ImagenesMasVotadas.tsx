'use cliente';
// Image next
import Image from "next/image";

export default function ImagenesMasVotadas() {

    return (
        <>  
            {/* <!-- titulo principal de sugerencias --> */}
            <h5 className="text-center titulo_h5_sugerencias_imagenesvotadas">Imagénes más votadas</h5>
            {/* <!-- imagenes mas votadas --> */}
            <div className="col-4">
                <div className="sugerencias_para_seguir">
                    <a className="link_imagen_mas_votadas" href="">
                        <div className="card text-center">
                            <Image 
                                src="/imagenes_votadas/votadas1.jpg" 
                                width={100}
                                height={100}
                                className="card-img-top"
                                alt="Card image cap"
                            />
                            <div className="p-1">
                                <h6 className="titulo_card">Samantha Flowers</h6>
                                <p className="numero_me_gustas">1872 Me gusta</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            {/* <!-- fin imagenes mas votadas -->
                <!-- imagenes mas votadas --> */}
            <div className="col-4">
                <div className="sugerencias_para_seguir">
                    <a className="link_imagen_mas_votadas" href="">
                        <div className="card text-center">
                            <Image 
                                src="/imagenes_votadas/votadas2.jpg" 
                                width={100}
                                height={100}
                                className="card-img-top"
                                alt="Card image cap"
                            />
                            <div className="p-1">
                                <h6 className="titulo_card">Samantha Flowers</h6>
                                <p className="numero_me_gustas">1872 Me gusta</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            {/* <!-- fin imagenes mas votadas --> */}
                {/* <!-- imagenes mas votadas --> */}
            <div className="col-4">
                <div className="sugerencias_para_seguir">
                    <a className="link_imagen_mas_votadas" href="">
                        <div className="card text-center">
                            <Image 
                                src="/imagenes_votadas/votadas3.jpg" 
                                width={100}
                                height={100}
                                className="card-img-top"
                                alt="Card image cap"
                            />
                            <div className="p-1">
                                <h6 className="titulo_card">Samantha Flowers</h6>
                                <p className="numero_me_gustas">1872 Me gusta</p>
                            </div>
                        </div>
                    </a>
                </div>
            </div>
            {/* <!-- fin imagenes mas votadas --> */}
        </>
    );
    
}