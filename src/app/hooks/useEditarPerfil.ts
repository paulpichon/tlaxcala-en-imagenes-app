'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import { Municipio, UsuarioLogueado, ApiResponse } from '@/types/types';
import { apiGet, apiPut, getUserMessage, isApiError, getApiErrorMessage } from '@/lib/apiClient';
import { validarNombre, REGEX_NOMBRE } from '@/lib/validaciones';

export const perfilSchema = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, 'El nombre es requerido')
      .max(60, 'El nombre no puede exceder 60 caracteres')
      .regex(REGEX_NOMBRE, {
        message: 'El nombre contiene caracteres no permitidos',
      }),
    apellido: z
      .string()
      .trim()
      .min(1, 'El apellido es requerido')
      .max(60, 'El apellido no puede exceder 60 caracteres')
      .regex(REGEX_NOMBRE, {
        message: 'El apellido contiene caracteres no permitidos',
      }),
    fecha_nacimiento: z
      .string()
      .min(1, 'La fecha de nacimiento es obligatoria')
      .refine((date) => !isNaN(Date.parse(date)), 'Debe ingresar una fecha válida'),
    claveMunicipio: z.string().min(1, 'Debe seleccionar un municipio'),
    genero: z.enum(['MASCULINO', 'FEMENINO', 'PREFIERO NO DECIR'], {
      error: () => ({ message: 'Debe seleccionar un género' }),
    }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 8, 'La contraseña debe tener al menos 8 caracteres')
      .refine((val) => !val || /[A-Z]/.test(val), 'Debe contener al menos una mayúscula')
      .refine((val) => !val || /[a-z]/.test(val), 'Debe contener al menos una minúscula')
      .refine((val) => !val || /[0-9]/.test(val), 'Debe contener al menos un número')
      .refine(
        (val) => !val || /[!@#$%^&*(),.?":{}|<>\-+=\[\]_]/.test(val),
        'Debe contener al menos un carácter especial (!@#$%^&*...)'
      ),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.password) return true;
      if (!data.confirmPassword) return false;
      return data.password === data.confirmPassword;
    },
    {
      message: 'Debes confirmar la nueva contraseña',
      path: ['confirmPassword'],
    }
  );

export function useEditarPerfil() {
  const { user, fetchWithAuth, updateUser } = useAuth();
  
  const [formData, setFormData] = useState({
    nombre: user?.nombre_completo?.nombre || '',
    apellido: user?.nombre_completo?.apellido || '',
    correo: user?.correo || '',
    claveMunicipio: String(user?.lugar_radicacion?.claveMunicipio || ''), // 👈 fuerza a string
    nombreMunicipio: user?.lugar_radicacion?.nombreMunicipio || '',
    genero: user?.genero || '',
    password: '',
    confirmPassword: '',
    url: user?.url || '',
    fecha_nacimiento: user?.fecha_nacimiento?.split('T')[0] || '',
    nombreEntidad: user?.lugar_radicacion?.nombreEntidad || 'Tlaxcala',
    claveEntidad: user?.lugar_radicacion?.claveEntidad || 29,
  });
  

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [imagenPerfil, setImagenPerfil] = useState(obtenerImagenPerfilUsuario(user!, 'perfil'));
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'danger' | 'creacion'; duration?: number; actions?: Array<{ label: string; onClick: () => void; variant?: 'primary' | 'outline' }> }>({ message: '' });
  const [loading, setLoading] = useState(false);

  const changedAt = user?.nombre_completo_changed_at ?? null;
  const estadoCooldown = changedAt === null
    ? { tipo: 'libre' as const }
    : (() => {
        const TREINTA_DIAS = 30 * 24 * 60 * 60 * 1000;
        const diff = Date.now() - new Date(changedAt).getTime();
        return diff >= TREINTA_DIAS
          ? { tipo: 'disponible' as const }
          : { tipo: 'cooldown' as const, diasRestantes: Math.ceil((TREINTA_DIAS - diff) / (24 * 60 * 60 * 1000)), fechaLiberacion: new Date(Date.now() + TREINTA_DIAS - diff).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) };
      })();

  const nombreCambio =
    formData.nombre !== (user?.nombre_completo?.nombre || '') ||
    formData.apellido !== (user?.nombre_completo?.apellido || '');

  const submitDeshabilitado = estadoCooldown.tipo === 'cooldown' && nombreCambio;

  // 🌐 Obtener municipios
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<ApiResponse<{ municipios: Municipio[] }>>(
          fetchWithAuth,
          '/api/municipios/'
        );
        setMunicipios(data.data.municipios || []);
      } catch (err) {
        const msg = getUserMessage(err, 'actualizar_perfil');
        console.error(msg, err);
        setToast({ message: msg, type: 'danger' });
      }
    })();
  }, [fetchWithAuth]);

  // 🖊️ Manejo de inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'claveMunicipio') {
      const municipio = municipios.find((m) => String(m.claveMunicipio) === String(value));
      setFormData((prev) => ({
        ...prev,
        claveMunicipio: value,
        nombreMunicipio: municipio?.nombreMunicipio ?? '',
      }));
      return setErrors((prev) => ({ ...prev, claveMunicipio: '' }));
    }

    if (name === 'password') {
      setFormData((prev) => ({
        ...prev,
        password: value,
        confirmPassword: value ? prev.confirmPassword : '',
      }));
      if (value === '') {
        setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
        return;
      }
      // Validación en tiempo real de complejidad
      const newErrors: Record<string, string> = {};
      if (value.length < 8) {
        newErrors.password = 'La contraseña debe tener al menos 8 caracteres';
      } else if (!/[A-Z]/.test(value)) {
        newErrors.password = 'Debe contener al menos una mayúscula';
      } else if (!/[a-z]/.test(value)) {
        newErrors.password = 'Debe contener al menos una minúscula';
      } else if (!/[0-9]/.test(value)) {
        newErrors.password = 'Debe contener al menos un número';
      } else if (!/[!@#$%^&*(),.?":{}|<>\-+=\[\]_]/.test(value)) {
        newErrors.password = 'Debe contener al menos un carácter especial (!@#$%^&*...)';
      }
      setErrors((prev) => ({ ...prev, password: newErrors.password || '' }));
      return;
    }

    if (name === 'confirmPassword') {
      setFormData((prev) => ({ ...prev, confirmPassword: value }));
      if (formData.password && value && value !== formData.password)
        setErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      else setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      return;
    }

    if (name === 'nombre' || name === 'apellido') {
      setFormData((prev) => ({ ...prev, [name]: value }));
      const errorMsg = validarNombre(value);
      setErrors((prev) => ({ ...prev, [name]: errorMsg || '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // 💾 Guardar perfil con retry para conflictos de URL
  const actualizarPerfilConRetry = async (
    body: Record<string, unknown>,
    intentosMax = 2
  ): Promise<ApiResponse<{ usuario: UsuarioLogueado }>> => {
    for (let i = 0; i <= intentosMax; i++) {
      try {
        return await apiPut<ApiResponse<{ usuario: UsuarioLogueado }>>(
          fetchWithAuth,
          '/api/usuarios/update',
          body
        );
      } catch (err) {
        if (
          isApiError(err) &&
          err.data?.code === 'CONFLICT' &&
          err.data?.errors?.some(
            (e: { field: string }) => e.field === 'url'
          ) &&
          i < intentosMax
        ) {
          await new Promise((r) => setTimeout(r, 300 * (i + 1)));
          continue;
        }
        throw err;
      }
    }
    throw new Error('CONFLICT no resuelto tras reintentos');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      perfilSchema.parse(formData);
      setErrors({});
      setToast({ message: 'Guardando cambios...', type: 'creacion' });
      setLoading(true);

      const body = {
        nombre_completo: { nombre: formData.nombre, apellido: formData.apellido },
        password: formData.password || undefined,
        lugar_radicacion: {
          claveEntidad: 29,
          nombreEntidad: 'Tlaxcala',
          claveMunicipio: formData.claveMunicipio,
          nombreMunicipio: formData.nombreMunicipio,
          codigoPostal: undefined,
        },
        genero: formData.genero,
        fecha_nacimiento: formData.fecha_nacimiento || null,
      };

      const data = await actualizarPerfilConRetry(body);

      const nuevaUrl = data.data.usuario.url;
      const urlAnterior = formData.url;

      updateUser(data.data.usuario);

      if (nuevaUrl !== urlAnterior) {
        setFormData((prev) => ({
          ...prev,
          url: nuevaUrl,
          nombre: data.data.usuario.nombre_completo.nombre,
          apellido: data.data.usuario.nombre_completo.apellido,
          password: '',
          confirmPassword: '',
        }));
        setToast({
          message: `Tu URL de perfil cambió de @${urlAnterior} a @${nuevaUrl}. La URL anterior (@${urlAnterior}) redirige automáticamente, pero te recomendamos actualizar tus enlaces compartidos.`,
          type: 'success',
          duration: 8000,
          actions: [{
            label: 'Copiar URL nueva',
            onClick: () => navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/${nuevaUrl}`),
            variant: 'primary',
          }],
        });
      } else {
        setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
        setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => (fieldErrors[err.path[0] as string] = err.message));
        setErrors(fieldErrors);
        setToast({ message: 'Por favor corrige los campos en rojo', type: 'danger' });
      } else if (isApiError(error) && error.data?.code === 'RATE_LIMIT_EXCEEDED') {
        const segundos = (error.data.retry_after as number) || 2592000;
        const dias = Math.ceil(segundos / 86400);
        setToast({
          message: `Solo puedes cambiar tu nombre cada 30 días. Vuelve a intentarlo en ${dias} día(s).`,
          type: 'danger',
        });
      } else if (isApiError(error) && error.data?.code === 'CONFLICT') {
        setToast({
          message: 'Conflicto al actualizar. Intenta de nuevo en unos segundos.',
          type: 'danger',
        });
      } else {
        const msg = getApiErrorMessage(error, getUserMessage(error, 'actualizar_perfil'));
        console.error(msg, error);
        setToast({ message: msg, type: 'danger' });
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    formData,
    errors,
    municipios,
    imagenPerfil,
    showModal,
    loading,
    toast,
    setToast,
    setShowModal,
    setImagenPerfil,
    handleChange,
    handleSubmit,
    estadoCooldown,
    submitDeshabilitado,
    nombreCambio,
  };
}
