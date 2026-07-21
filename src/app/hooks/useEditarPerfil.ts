'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import { Municipio, UsuarioLogueado } from '@/types/types';
import { apiGet, apiPut, getUserMessage } from '@/lib/apiClient';

export const perfilSchema = z
  .object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
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
      .refine((val) => !val || val.length >= 8, 'La contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword,
    { message: 'Las contraseñas no coinciden', path: ['confirmPassword'] }
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
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'danger' | 'creacion' }>({ message: '' });
  const [loading, setLoading] = useState(false);

  // 🌐 Obtener municipios
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<{ municipios: Municipio[] }>(
          fetchWithAuth,
          '/api/municipios/'
        );
        setMunicipios(data.municipios || []);
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
      if (value === '') setErrors((prev) => ({ ...prev, password: '', confirmPassword: '' }));
      return;
    }

    if (name === 'confirmPassword') {
      setFormData((prev) => ({ ...prev, confirmPassword: value }));
      if (formData.password && value !== formData.password)
        setErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
      else setErrors((prev) => ({ ...prev, confirmPassword: '' }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // 💾 Guardar perfil
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

      const data = await apiPut<{ usuario: UsuarioLogueado }>(
        fetchWithAuth,
        '/api/usuarios/update',
        body
      );
      updateUser(data.usuario);
      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => (fieldErrors[err.path[0] as string] = err.message));
        setErrors(fieldErrors);
        setToast({ message: 'Por favor corrige los campos en rojo', type: 'danger' });
      } else {
        const msg = getUserMessage(error, 'actualizar_perfil');
        console.error(msg, error);
        setToast({ message: msg, type: 'danger' });
      }
    } finally {
      setLoading(false);
      setTimeout(() => setToast({ message: '', type: undefined }), 2500);
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
  };
}
