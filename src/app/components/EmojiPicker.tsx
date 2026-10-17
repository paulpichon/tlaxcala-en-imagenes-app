"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  EMOJI_CATEGORIES,
  getRecientes,
  type EmojiCategory,
} from "@/app/lib/emoji";
import styles from "../ui/EmojiPicker.module.css";

const ICONO_CATEGORIA: Record<string, string> = {
  frecuentes: "⭐",
  gestos: "👍",
  corazones: "❤️",
  animales: "🐶",
  comida: "🍎",
  actividades: "⚽",
  objetos: "💡",
  simbolos: "🏳️",
};

interface EmojiPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({
  open,
  onClose,
  onSelect,
}: EmojiPickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeSlug, setActiveSlug] = useState("frecuentes");
  const [recientes, setRecientes] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setRecientes(getRecientes());
      setActiveSlug((prev) => {
        // Si hay recientes, empezar ahí; si no, en frecuentes
        const rec = getRecientes();
        return rec.length > 0 ? "recientes" : "frecuentes";
      });
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, onClose]);

  const categories: EmojiCategory[] = useMemo(() => {
    const cats = [...EMOJI_CATEGORIES];
    if (recientes.length > 0) {
      cats.unshift({ slug: "recientes", label: "Recientes", emojis: recientes });
    }
    return cats;
  }, [recientes]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeSlug) ?? categories[0],
    [categories, activeSlug]
  );

  if (!open || !activeCategory) return null;

  return (
    <div
      ref={wrapperRef}
      className={styles.panel}
      role="dialog"
      aria-label="Selector de emojis"
    >
      <div className={styles.tabs}>
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className={`${styles.tab} ${
              cat.slug === activeSlug ? styles.tabActive : ""
            }`}
            onClick={() => setActiveSlug(cat.slug)}
            title={cat.label}
            aria-label={cat.label}
            aria-pressed={cat.slug === activeSlug}
          >
            {ICONO_CATEGORIA[cat.slug] ?? cat.emojis[0] ?? "😀"}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {Array.from(new Set(activeCategory.emojis)).map((emoji) => (
          <button
            key={`${activeCategory.slug}-${emoji}`}
            type="button"
            className={styles.emojiBtn}
            onClick={() => onSelect(emoji)}
            aria-label={`Emoji ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
