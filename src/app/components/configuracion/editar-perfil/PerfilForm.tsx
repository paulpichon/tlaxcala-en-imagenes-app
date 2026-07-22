// components/perfil/EditarPerfil/PerfilForm.tsx
'use client';

import { FormDataEditarPerfil, Municipio } from '@/types/types';
import { ChangeEvent, SubmitEvent, useState } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
// Estilos específicos de la página
import editarPerfil from '@/app/ui/configuracion/editar-perfil/EditarPerfil.module.css';
import PasswordRequisitos from './PasswordRequisitos';

interface PerfilFormProps {
  formData: FormDataEditarPerfil;
  errors: Record<keyof FormDataEditarPerfil | string, string>;
  municipios: Municipio[];
  loading: boolean;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  handleSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
}

export default function PerfilForm({
  formData,
  errors,
  municipios,
  loading,
  handleChange,
  handleSubmit,
}: PerfilFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequisitos, setShowRequisitos] = useState(false);

  const renderInput = (
    label: string,
    name: keyof FormDataEditarPerfil,
    type: string = 'text',
    extraProps: Record<string, unknown> = {}
  ) => (
    <div className="mb-3">
      <label className="form-label fw-medium" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        type={type}
        name={name}
        value={formData[name] as string}
        onChange={handleChange}
        className={`form-control form-control-lg ${errors[name] ? 'is-invalid' : ''}`}
        {...extraProps}
      />
      {errors[name] && <div className="invalid-feedback">{errors[name]}</div>}
    </div>
  );

  const renderPasswordInput = (
    label: string,
    name: keyof FormDataEditarPerfil,
    show: boolean,
    onToggle: () => void,
    placeholder: string,
    onFocus?: () => void,
    onBlur?: () => void
  ) => (
    <div className="mb-3">
      <label className="form-label fw-medium" htmlFor={name}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={name}
          type={show ? 'text' : 'password'}
          name={name}
          value={formData[name] as string}
          onChange={handleChange}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`form-control form-control-lg ${errors[name] ? 'is-invalid' : ''}`}
          placeholder={placeholder}
          style={{ paddingRight: '3rem' }}
        />
        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute',
            right: '0.75rem',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#6c757d',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {show ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </button>
      </div>
      {errors[name] && <div className="invalid-feedback d-block">{errors[name]}</div>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit}>
      {renderInput('Nombre', 'nombre')}
      {renderInput('Apellido', 'apellido')}
      {renderInput('Fecha de nacimiento', 'fecha_nacimiento', 'date')}

      {/* Correo electronico solo para mostralo en el input, no se modifica!!!*/}
      <div className="mb-3">
        <label className="form-label fw-medium">Correo electronico</label>
        <input
          type="text"
          value={formData.correo}
          readOnly
          className="form-control"
          style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
        />
      </div>

      {/* Entidad */}
      <div className="mb-3">
        <label className="form-label fw-medium">Entidad</label>
        <input
          type="text"
          value={formData.nombreEntidad}
          readOnly
          className="form-control"
          style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
        />
      </div>

      {/* Municipio */}
      <div className="mb-3">
        <label className="form-label fw-medium">Municipio</label>
        <select
          name="claveMunicipio"
          value={formData.claveMunicipio}
          onChange={handleChange}
          className={`form-select form-select-lg ${errors.claveMunicipio ? 'is-invalid' : ''}`}
        >
          <option value="">Seleccionar municipio...</option>
          {municipios.map((m) => (
            <option key={m.claveMunicipio} value={m.claveMunicipio}>
              {m.nombreMunicipio}
            </option>
          ))}
        </select>
        {errors.claveMunicipio && <div className="invalid-feedback">{errors.claveMunicipio}</div>}
      </div>

      {/* Género */}
      <div className="mb-3">
        <label className="form-label fw-medium">Género</label>
        <select
          name="genero"
          value={formData.genero}
          onChange={handleChange}
          className={`form-select ${errors.genero ? 'is-invalid' : ''}`}
        >
          <option value="">Seleccionar...</option>
          <option value="MASCULINO">Masculino</option>
          <option value="FEMENINO">Femenino</option>
          <option value="PREFIERO NO DECIR">Prefiero no decir</option>
        </select>
        {errors.genero && <div className="invalid-feedback">{errors.genero}</div>}
      </div>

      {/* Contraseña */}
      <div className="mb-3">
        <label className="form-label fw-medium" htmlFor="password">
          Cambiar contraseña
        </label>
        <small
          className="d-block mb-2"
          style={{ color: '#6c757d', fontSize: '0.85rem' }}
        >
          Deja vacío si no deseas cambiarla
        </small>
        {renderPasswordInput(
          '',
          'password',
          showPassword,
          () => setShowPassword(!showPassword),
          '••••••••',
          () => setShowRequisitos(true),
          () => setShowRequisitos(false)
        )}
        <PasswordRequisitos password={formData.password} visible={showRequisitos} />
      </div>

      {/* Confirmar contraseña */}
      {formData.password && (
        <div className="mb-3">
          <label className="form-label fw-medium" htmlFor="confirmPassword">
            Confirmar nueva contraseña
          </label>
          {renderPasswordInput(
            '',
            'confirmPassword',
            showConfirmPassword,
            () => setShowConfirmPassword(!showConfirmPassword),
            'Repite tu contraseña'
          )}
        </div>
      )}

      <div className="border-top p-4">
        <button type="submit" className={`${editarPerfil.btnGuardarCambiarMedium} w-100`} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
