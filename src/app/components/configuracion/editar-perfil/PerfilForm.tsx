// components/perfil/EditarPerfil/PerfilForm.tsx
'use client';

import { FormDataEditarPerfil, Municipio } from '@/types/types';
import { ChangeEvent, SubmitEvent } from 'react';


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
      {renderInput('Nueva contraseña (opcional)', 'password', 'password', { placeholder: '••••••••' })}
      {formData.password &&
        renderInput('Confirmar nueva contraseña', 'confirmPassword', 'password', {
          placeholder: 'Repite tu contraseña',
        })}

      <div className="border-top p-4">
        <button type="submit" className="btnGuardarCambiar w-100" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
