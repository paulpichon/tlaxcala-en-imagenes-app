'use client';
// Auth context
import { useAuth } from '@/context/AuthContext';
// Userouter redirigir al usuario
import { useRouter } from 'next/navigation';
// Estilos de pagina
import loginEstilos from "../../../ui/cuentas/login/login.module.css";

import { useState } from 'react';
import { z } from 'zod';

const schema = z.object({
    correo: z.string().email('Correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export default function FormularioLogin() {
    // useAuth: Hook para acceder al contexto de autenticación
    const { login } = useAuth();
    // Redirigir al usuario
    const router = useRouter();

    const [formData, setFormData] = useState({ correo: '', password: '' });
    const [errors, setErrors] = useState<{ correo?: string; password?: string }>({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
  
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
      setErrors({ ...errors, [e.target.id]: '' });
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setServerError('');
      
      const result = schema.safeParse(formData);
  
      if (!result.success) {
        const formErrors: typeof errors = {};
        result.error.errors.forEach((err) => {
          if (err.path[0]) {
            formErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(formErrors);
        return;
      }
  
      try {
        setLoading(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          credentials: 'include'
        });
  
        const data = await res.json();
        // Manejo de errores de la API
        if (!res.ok) {
            // No existe correo en la BD
            if ( data.status === 401 && data.msg === 'Correo no existe') {
              setServerError('Correo o contraseña incorrectos.');
              return;  
            }
            // Contraseña incorrecta
            if ( data.status === 401 && data.msg === 'Password incorrecto') {
              setServerError('Correo o contraseña incorrectos.');
              return;
            }
            // Cuenta no verificada
            if (data.status === 403 && data.msg === 'Cuenta no verificada') {
              setServerError('La cuenta no ha sido verificada, revisa tu correo.');
              return;
            }
            // Cuenta no activada/bloqueada
            if ( data.status === 403 && data.msg === 'Cuenta no activada') {
              setServerError('Esta cuenta no está disponible. Contacta a soporte para más información.');
              return;
            }
        }
  
        login(data.usuario); // el backend debe devolver los datos del usuario
        // Redirigir al usuario a la página de inicio
        router.push('/inicio');
      } catch (error) {
          console.log(error);
        
          setServerError('Error en el servidor');
      }   finally {
          setLoading(false);
      }
    };
    
    return (
        <form className="formulario_crear_cuenta" onSubmit={handleSubmit} noValidate>
            <div className={`${loginEstilos.contenedor_inputs_login}`}>
                <input 
                    type="text" 
                    className={`form-control ${loginEstilos.inputs_crear_cuenta} ${errors.correo ? 'is-invalid' : ''}`} 
                    id="correo" 
                    aria-describedby="correo" 
                    placeholder="Correo electrónico" 
                    value={formData.correo}
                    onChange={handleChange}
                />
                {errors.correo && <div className="invalid-feedback">{errors.correo}</div>}
            </div>
            <div className={`${loginEstilos.contenedor_inputs_login}`}>
                <input 
                    type="password" 
                    className={`form-control ${loginEstilos.inputs_crear_cuenta} ${errors.password ? 'is-invalid' : ''}`} 
                    id="password" 
                    placeholder="Contraseña" 
                    value={formData.password}
                    onChange={handleChange}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
            </div>
            {serverError && <div className="alert alert-danger">{serverError}</div>}
            <button type="submit" className={`${loginEstilos.boton_registrarse}`} disabled={loading}>
                {loading ? 'Iniciando...' : 'Iniciar sesión'}
            </button>
        </form>
    );
}