// components/perfil/EditarPerfil/useEditarPerfil.ts
'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { useAuth } from '@/context/AuthContext';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import { Municipio } from '@/types/types';

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
      errorMap: () => ({ message: 'Debe seleccionar un género' }),
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
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/municipios/`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Error al obtener municipios');
        setMunicipios(data.municipios || []);
      } catch (error) {
        console.error('Error al cargar municipios:', error);
        setToast({ message: 'No se pudieron cargar los municipios', type: 'danger' });
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

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error al actualizar perfil');

      updateUser(data.usuario);
      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => (fieldErrors[err.path[0] as string] = err.message));
        setErrors(fieldErrors);
        setToast({ message: 'Por favor corrige los campos en rojo', type: 'danger' });
      } else {
        console.error(error);
        setToast({ message: 'No se pudo actualizar el perfil', type: 'danger' });
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
