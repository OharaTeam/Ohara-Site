"use client";

import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt = "Imagem anexada", onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 transition-all"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar visualização"
        className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
      >
        <X size={20} />
      </button>

      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl border border-white/10"
        />
      </div>
    </div>
  );
}
