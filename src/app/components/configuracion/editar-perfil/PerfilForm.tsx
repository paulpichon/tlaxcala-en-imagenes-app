// components/perfil/EditarPerfil/PerfilForm.tsx
'use client';

import { FormDataEditarPerfil, Municipio } from '@/types/types';
import { ChangeEvent, SubmitEvent, useState, ReactNode } from 'react';
import { FiEye, FiEyeOff, FiClock, FiInfo, FiChevronDown, FiChevronUp } from 'react-icons/fi';
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
  estadoCooldown: { tipo: 'libre' | 'disponible' | 'cooldown'; diasRestantes?: number; fechaLiberacion?: string };
  submitDeshabilitado: boolean;
  nombreCambio: boolean;
}

export default function PerfilForm({
  formData,
  errors,
  municipios,
  loading,
  handleChange,
  handleSubmit,
  estadoCooldown,
  submitDeshabilitado,
  nombreCambio,
}: PerfilFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showRequisitos, setShowRequisitos] = useState(false);

  const renderInput = (
    label: string,
    name: keyof FormDataEditarPerfil,
    type: string = 'text',
    extraProps: Record<string, unknown> = {}
  ) => {
    const hasError = !!errors[name];
    const hasValue = (formData[name] as string)?.trim?.()?.length > 0;
    const isValid = !hasError && hasValue;
    return (
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
        className={`form-control form-control-lg ${hasError ? 'is-invalid' : ''} ${isValid ? 'is-valid' : ''}`}
        {...extraProps}
      />
      {hasError && <div className="invalid-feedback">{errors[name]}</div>}
      {isValid && (name === 'nombre' || name === 'apellido') && (
        <div className="valid-feedback">Válido</div>
      )}
    </div>);}

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

  const tieneSufijoHex = /-[0-9a-f]{5}$/.test(formData.url);
  const sufijoHex = tieneSufijoHex ? formData.url.match(/-[0-9a-f]{5}$/)?.[0] ?? '' : '';

  function CollapsibleAlert({
    type,
    icon,
    summary,
    children,
    show = true,
  }: {
    type: 'info' | 'warning' | 'success';
    icon: ReactNode;
    summary: string;
    children: ReactNode;
    show?: boolean;
  }) {
    const [expanded, setExpanded] = useState(false);
    if (!show) return null;
    return (
      <>
        <button
          type="button"
          className={`d-md-none alert alert-${type} d-flex align-items-center gap-2 py-2 mb-2 w-100 text-start border-0`}
          style={{ fontSize: '0.85rem', cursor: 'pointer' }}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          <span className="flex-shrink-0">{icon}</span>
          <span className="fw-medium">{summary}</span>
          <span className="ms-auto">
            {expanded ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
          </span>
        </button>
        {expanded && (
          <div className={`d-md-none alert alert-${type} py-2 mb-2`} style={{ fontSize: '0.85rem' }}>
            {children}
          </div>
        )}
        <div
          className={`d-none d-md-flex alert alert-${type} align-items-center gap-2 py-2 mb-2`}
          style={{ fontSize: '0.85rem' }}
        >
          <span className="flex-shrink-0">{icon}</span>
          <span>{children}</span>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {renderInput('Nombre', 'nombre', 'text', { maxLength: 60 })}
      {renderInput('Apellido', 'apellido', 'text', { maxLength: 60 })}

      <CollapsibleAlert type="info" icon={<FiInfo size={18} />} summary={`@${formData.url}`}>
        Tu URL de perfil es <strong>@{formData.url}</strong>. Se regenera automáticamente cuando cambias tu nombre. Si tu nombre completo coincide con el de otra persona, se añadirá un sufijo aleatorio (ej. <strong>-7a3f9</strong>) para evitar duplicados.
      </CollapsibleAlert>

      <CollapsibleAlert
        type="warning"
        icon={<FiClock size={18} />}
        summary={`Podrás cambiar en ${estadoCooldown.diasRestantes} día(s)`}
        show={estadoCooldown.tipo === 'cooldown'}
      >
        Estás en periodo de espera: podrás volver a cambiar tu nombre en <strong>{estadoCooldown.diasRestantes} día(s)</strong> (aprox. el {estadoCooldown.fechaLiberacion}).
      </CollapsibleAlert>

      <CollapsibleAlert
        type="success"
        icon={<FiInfo size={18} />}
        summary="Puedes cambiar tu nombre"
        show={estadoCooldown.tipo !== 'cooldown' && nombreCambio}
      >
        Puedes cambiar tu nombre ahora. Tu URL se regenerará automáticamente y la anterior quedará como redirección.
      </CollapsibleAlert>

      <CollapsibleAlert
        type="info"
        icon={<FiInfo size={18} />}
        summary="URL con sufijo único"
        show={tieneSufijoHex}
      >
        Tu URL incluye un sufijo aleatorio (<strong>{sufijoHex}</strong>) porque otra persona tiene tu mismo nombre. Esto es normal y no afecta el funcionamiento de tu perfil.
      </CollapsibleAlert>

      {renderInput('Fecha de nacimiento', 'fecha_nacimiento', 'date')}

      {/* Correo electronico solo para mostralo en el input, no se modifica!!!*/}
      <div className="mb-3">
        <label className="form-label fw-medium">Correo electrónico</label>
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
        <button
          type="submit"
          className={`${editarPerfil.btnGuardarCambiarMedium} w-100`}
          disabled={loading || submitDeshabilitado}
          title={submitDeshabilitado ? `No puedes cambiar tu nombre aún. Faltan ${estadoCooldown.diasRestantes} días.` : undefined}
        >
          {loading ? 'Guardando...' : submitDeshabilitado ? 'Guardar cambios (bloqueado)' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
