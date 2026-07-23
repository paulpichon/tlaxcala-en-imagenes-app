'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import loginEstilos from "../../../ui/cuentas/login/login.module.css";
import { useState } from 'react';
import { z } from 'zod';
import { apiPost, isApiError, isRateLimit, ApiErrorCode, getUserMessage } from '@/lib/apiClient';
import { UsuarioLogueado, ApiResponse } from '@/types/types';

const schema = z.object({
    correo: z.string().email('Correo inválido'),
    password: z.string().min(1, 'La contraseña es obligatoria'),
});

export default function FormularioLogin() {
    const { login } = useAuth();
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
        result.error.issues.forEach((err) => {
          if (err.path[0]) {
            formErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(formErrors);
        return;
      }
  
      try {
        setLoading(true);
        const data = await apiPost<ApiResponse<{ usuario: UsuarioLogueado }>>(
          fetch,
          '/api/auth/login',
          formData
        );
  
        login(data.data.usuario);
        router.push('/inicio');
      } catch (error) {
        if (isApiError(error)) {
          const code = error.data?.code;
          if (isRateLimit(error)) {
            setServerError(getUserMessage(error, 'registro'));
          } else if (code === ApiErrorCode.UNAUTHORIZED) {
            setServerError('Correo o contraseña incorrectos.');
          } else if (code === ApiErrorCode.FORBIDDEN && error.data.detail === 'Cuenta no verificada') {
            setServerError('La cuenta no ha sido verificada, revisa tu correo.');
          } else if (code === ApiErrorCode.FORBIDDEN && error.data.detail === 'Cuenta no activada') {
            setServerError('Esta cuenta no está disponible. Contacta a soporte para más información.');
          } else {
            setServerError(getUserMessage(error, 'registro'));
          }
        } else {
          setServerError('Error en el servidor');
        }
      } finally {
          setLoading(false);
      }
    };
    
    return (
      <form
        className={loginEstilos.formulario_login}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Correo */}
        <div className={loginEstilos.contenedor_inputs_login}>
          <label htmlFor="correo" className={loginEstilos.label}>
            Correo electrónico
          </label>
          <input
            type="email"
            className={`form-control ${loginEstilos.inputs_crear_cuenta} ${
              errors.correo ? 'is-invalid' : ''
            }`}
            id="correo"
            placeholder="tucorreo@ejemplo.com"
            value={formData.correo}
            onChange={handleChange}
            autoComplete="email"
          />
          {errors.correo && (
            <div className="invalid-feedback">{errors.correo}</div>
          )}
        </div>
      
        {/* Password */}
        <div className={loginEstilos.contenedor_inputs_login}>
          <label htmlFor="password" className={loginEstilos.label}>
            Contraseña
          </label>
          <input
            type="password"
            className={`form-control ${loginEstilos.inputs_crear_cuenta} ${
              errors.password ? 'is-invalid' : ''
            }`}
            id="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
          />
          {errors.password && (
            <div className="invalid-feedback">{errors.password}</div>
          )}
        </div>
      
        {/* Error servidor */}
        {serverError && (
          <p className={loginEstilos.error_servidor}>
            {serverError}
          </p>
        )}
      
        {/* Botón */}
        <button
          type="submit"
          className={loginEstilos.boton_registrarse}
          disabled={loading}
        >
          {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </button>
      </form>
    
    );
}