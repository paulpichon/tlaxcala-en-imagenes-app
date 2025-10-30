// hooks/useCrearPosteo.ts
import { useState, useEffect } from "react";
import { posteoSchema, posteoBaseSchema } from "@/lib/validaciones";
import { ZodError } from "zod";
import { useAuth } from "@/context/AuthContext";
import { Posteo } from "@/types/types";

export function useCrearPosteo(
  onPostCreated?: (newPost?: Posteo) => void,
  onSuccess?: () => void // 👈 nuevo callback
) {
  const { fetchWithAuth } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [loading, setLoading] = useState(false);
  const [posteoPublico, setPosteoPublico] = useState(true);
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  // Detectar móvil
  useEffect(() => {
    const checkMobile = () =>
      /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(navigator.userAgent) ||
      window.innerWidth <= 768;
    setIsMobile(checkMobile());
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setTexto("");
    setPosteoPublico(true);
    setErrors([]);
  };

  const processFile = (f: File | null) => {
    if (!f) return setFile(null), setPreview(null);
    const result = posteoBaseSchema.pick({ file: true }).safeParse({ file: f });
    if (!result.success) {
      setErrors(result.error.errors.map((e) => e.message));
      setFile(null);
      setPreview(null);
      return;
    }
    setErrors([]);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    try {

      posteoSchema.parse({ texto, file, posteo_publico: posteoPublico });
      setErrors([]);
      if (!file) return;

      setLoading(true);

      const formData = new FormData();
      formData.append("img", file);
      formData.append("texto", texto);
      formData.append("posteo_publico", String(posteoPublico));

      const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL_LOCAL_LOCAL}/api/posteos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Error al crear posteo");

      const newPost = await res.json();
      onPostCreated?.(newPost);

      // 👇 Cerramos modal y reseteamos, pero no tocamos el toast
      resetForm();
      onSuccess?.(); // notificar éxito
    } catch (err) {
      if (err instanceof ZodError) {
        setErrors(err.errors.map((e) => e.message));
      } else {
        console.error(err);
        setErrors(["Ocurrió un error al crear la publicación"]);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    file,
    preview,
    texto,
    posteoPublico,
    loading,
    showConfirmDiscard,
    errors,
    isMobile,
    setTexto,
    setPosteoPublico,
    setShowConfirmDiscard,
    processFile,
    handleSubmit,
    resetForm,
  };
}
