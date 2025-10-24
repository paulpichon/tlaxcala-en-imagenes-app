'use client';

import { useState, useEffect } from 'react';
import { FiArrowLeft, FiCamera } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import CambiarImagenModal from './CambiarImagenModal';
import { obtenerImagenPerfilUsuario } from '@/lib/cloudinary/obtenerImagenPerfilUsuario';
import Image from 'next/image';
import ToastGlobal from './ToastGlobal';
import { z } from 'zod';

interface Municipio {
  claveMunicipio: string;
  nombreMunicipio: string;
}

// ✅ Esquema de validación Zod
const perfilSchema = z
  .object({
    nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    apellido: z.string().min(2, 'El apellido debe tener al menos 2 caracteres'),
    fecha_nacimiento: z
      .string()
      .min(1, 'La fecha de nacimiento es obligatoria')
      .refine((date) => !isNaN(Date.parse(date)), 'Debe ingresar una fecha válida'),
    claveMunicipio: z.string().min(1, 'Debe seleccionar un municipio'),
    genero: z.enum(['MASCULINO', 'FEMENINO', 'OTRO'], {
      errorMap: () => ({ message: 'Debe seleccionar un género' }),
    }),
    password: z
      .string()
      .optional()
      .refine((val) => !val || val.length >= 6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword,
    {
      message: 'Las contraseñas no coinciden',
      path: ['confirmPassword'],
    }
  );

export default function EditarPerfil() {
  const router = useRouter();
  const { user, fetchWithAuth, updateUser } = useAuth();

  const [formData, setFormData] = useState({
    nombre: user?.nombre_completo?.nombre || '',
    apellido: user?.nombre_completo?.apellido || '',
    claveMunicipio: user?.lugar_radicacion?.claveMunicipio || '',
    nombreMunicipio: user?.lugar_radicacion?.nombreMunicipio || '',
    genero: user?.genero || '',
    password: '',
    confirmPassword: '',
    url: user?.url || '',
    fecha_nacimiento: user?.fecha_nacimiento ? user.fecha_nacimiento.split('T')[0] : '',
    nombreEntidad: user?.lugar_radicacion?.nombreEntidad || 'Tlaxcala',
    claveEntidad: user?.lugar_radicacion?.claveEntidad || 29,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [imagenPerfil, setImagenPerfil] = useState(obtenerImagenPerfilUsuario(user!, 'perfil'));
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'danger' | 'creacion' }>({ message: '' });

  // 🔹 Cargar municipios desde el backend
  useEffect(() => {
    const fetchMunicipios = async () => {
      try {
        const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/municipios/`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Error al obtener municipios');
        setMunicipios(data.municipios || []);
      } catch (error) {
        console.error('Error al cargar municipios:', error);
        setToast({ message: 'No se pudieron cargar los municipios', type: 'danger' });
      }
    };
    fetchMunicipios();
  }, [fetchWithAuth]);

  // ✅ Control de inputs (mejorado para validación en vivo)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Si cambia el municipio, actualizamos nombreMunicipio
    if (name === 'claveMunicipio') {
      const municipioSeleccionado = municipios?.find((m) => String(m.claveMunicipio) === String(value));
      setFormData((prev) => ({
        ...prev,
        claveMunicipio: value,
        nombreMunicipio: municipioSeleccionado?.nombreMunicipio ?? '',
      }));
      // limpiar error de municipio si existía
      setErrors((prev) => ({ ...prev, claveMunicipio: '' }));
      return;
    }

    // Si el usuario borra la contraseña, limpiamos confirmPassword y errores relacionados
    if (name === 'password') {
      setFormData((prev) => {
        // si borra (valor vacío) limpiamos confirmPassword
        if (value === '') {
          setErrors((prevErr) => ({ ...prevErr, password: '', confirmPassword: '' }));
          return { ...prev, password: '', confirmPassword: '' };
        }
        // si escribe algo y ya existe confirmPassword, hacemos una comprobación rápida en vivo
        if (prev.confirmPassword && value !== prev.confirmPassword) {
          setErrors((prevErr) => ({ ...prevErr, confirmPassword: 'Las contraseñas no coinciden' }));
        } else {
          setErrors((prevErr) => ({ ...prevErr, confirmPassword: '' }));
        }
        return { ...prev, password: value };
      });
      return;
    }

    // Si cambian confirmPassword, comprobación en vivo de coincidencia (solo si hay password)
    if (name === 'confirmPassword') {
      setFormData((prev) => {
        if (prev.password && value !== prev.password) {
          setErrors((prevErr) => ({ ...prevErr, confirmPassword: 'Las contraseñas no coinciden' }));
        } else {
          setErrors((prevErr) => ({ ...prevErr, confirmPassword: '' }));
        }
        return { ...prev, confirmPassword: value };
      });
      return;
    }

    // Para los demás campos
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiamos error de ese campo en concreto
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ✅ Enviar formulario con validación
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Validación adicional previa: si se ingresó password, confirmar que confirmPassword exista y coincida
      if (formData.password) {
        if (!formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: 'Por favor confirma tu nueva contraseña' }));
          setToast({ message: 'Por favor confirma tu nueva contraseña', type: 'danger' });
          return;
        }
        if (formData.password !== formData.confirmPassword) {
          setErrors((prev) => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
          setToast({ message: 'Las contraseñas no coinciden', type: 'danger' });
          return;
        }
      }

      // Validar datos con Zod
      perfilSchema.parse(formData);
      setErrors({});

      setLoading(true);
      setToast({ message: 'Guardando cambios...', type: 'creacion' });

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL}/api/usuarios/update`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_completo: {
            nombre: formData.nombre,
            apellido: formData.apellido,
          },
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
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Error al actualizar perfil');

      updateUser(data.usuario);
      setToast({ message: 'Perfil actualizado correctamente', type: 'success' });
      // opcional: limpiar campos de contraseña tras éxito
      setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      // Si el error viene de Zod
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          fieldErrors[field] = err.message;
        });
        setErrors(fieldErrors);
        setToast({ message: 'Por favor corrige los campos en rojo', type: 'danger' });
        return;
      }

      console.error(error);
      setToast({ message: 'No se pudo actualizar el perfil', type: 'danger' });
    } finally {
      setLoading(false);
      setTimeout(() => setToast({ message: '', type: undefined }), 3000);
    }
  };

  const handleImageChange = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);
  const handleSuccessImageChange = (newUrl: string) => setImagenPerfil(newUrl);

  return (
    <div className="d-flex flex-column bg-light">
      {toast.message && (
        <ToastGlobal message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: undefined })} />
      )}

      {/* Top App Bar */}
      <div className="bg-white border-bottom p-3">
        <div className="d-flex align-items-center justify-content-between">
          <button onClick={() => router.back()} className="btn btn-link text-dark p-2" style={{ fontSize: '24px' }}>
            <FiArrowLeft />
          </button>
          <h2 className="h5 mb-0 fw-bold flex-grow-1 text-center pe-5">Editar perfil</h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow-1 overflow-auto p-4">
        <div className="container" style={{ maxWidth: '448px' }}>
          {/* Profile Header */}
          <div className="d-flex justify-content-center p-4">
            <div className="d-flex flex-column gap-4 align-items-center w-100">
              <div className="position-relative">
                <div className="text-center mb-3">
                  <em className="fs-5 fw-bold">{`@` + formData.url}</em>
                </div>
                <div className="rounded-circle overflow-hidden position-relative" style={{ width: '128px', height: '128px' }}>
                  <Image src={imagenPerfil} alt="Foto de perfil" fill className="object-cover rounded-circle" />
                </div>
                <button
                  onClick={handleImageChange}
                  className="btn btn-primary rounded-circle position-absolute bottom-0 end-0"
                  style={{ width: '40px', height: '40px', padding: 0, border: '2px solid white' }}
                >
                  <FiCamera size={20} />
                </button>
              </div>
              <button onClick={handleImageChange} className="btn btn-outline-primary">
                Cambiar foto
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form onSubmit={handleSubmit}>
            <div className="d-flex flex-column gap-4 mt-4">
              {/* Nombre */}
              <div className="mb-3">
                <label htmlFor="nombre" className="form-label fw-medium">Nombre</label>
                <input
                  type="text"
                  className={`form-control form-control-lg ${errors.nombre ? 'is-invalid' : ''}`}
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                />
                {errors.nombre && <div className="invalid-feedback">{errors.nombre}</div>}
              </div>

              {/* Apellido */}
              <div className="mb-3">
                <label htmlFor="apellido" className="form-label fw-medium">Apellido</label>
                <input
                  type="text"
                  className={`form-control form-control-lg ${errors.apellido ? 'is-invalid' : ''}`}
                  id="apellido"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Tu apellido"
                />
                {errors.apellido && <div className="invalid-feedback">{errors.apellido}</div>}
              </div>

              {/* Fecha de nacimiento */}
              <div className="mb-3">
                <label htmlFor="fecha_nacimiento" className="form-label fw-medium">Fecha de nacimiento</label>
                <input
                  type="date"
                  className={`form-control ${errors.fecha_nacimiento ? 'is-invalid' : ''}`}
                  id="fecha_nacimiento"
                  name="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={handleChange}
                />
                {errors.fecha_nacimiento && <div className="invalid-feedback">{errors.fecha_nacimiento}</div>}
              </div>

              {/* Entidad */}
              <div className="mb-3">
                <label htmlFor="nombreEntidad" className="form-label fw-medium">Entidad</label>
                <input
                  type="text"
                  className="form-control"
                  id="nombreEntidad"
                  name="nombreEntidad"
                  value={formData.nombreEntidad}
                  readOnly
                  style={{ cursor: 'not-allowed', backgroundColor: '#e9ecef' }}
                />
              </div>

              {/* Municipio */}
              <div className="mb-3">
                <label htmlFor="claveMunicipio" className="form-label fw-medium">Municipio</label>
                <select
                  id="claveMunicipio"
                  name="claveMunicipio"
                  className={`form-select form-select-lg ${errors.claveMunicipio ? 'is-invalid' : ''}`}
                  value={formData.claveMunicipio}
                  onChange={handleChange}
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
                <label htmlFor="genero" className="form-label fw-medium">Género</label>
                <select id="genero" name="genero" className={`form-select ${errors.genero ? 'is-invalid' : ''}`} value={formData.genero} onChange={handleChange}>
                  <option value="">Seleccionar...</option>
                  <option value="MASCULINO">Masculino</option>
                  <option value="FEMENINO">Femenino</option>
                  <option value="OTRO">Otro</option>
                </select>
                {errors.genero && <div className="invalid-feedback">{errors.genero}</div>}
              </div>

              {/* Contraseña */}
              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-medium">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              {/* 🔹 Confirmar contraseña (solo aparece si se escribe una nueva) */}
              {formData.password && (
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label fw-medium">Confirmar nueva contraseña</label>
                  <input
                    type="password"
                    className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repite tu contraseña"
                  />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Save Button */}
      <div className="bg-white border-top p-4">
        <button onClick={handleSubmit} className="btn btn-primary w-100 py-3 fw-bold" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>

      {/* Modal para cambiar imagen */}
      {user && <CambiarImagenModal usuario={user} show={showModal} onClose={handleCloseModal} onSuccess={handleSuccessImageChange} />}
    </div>
  );
}
