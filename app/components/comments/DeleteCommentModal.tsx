"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { Comment } from "../../_types/comments";

export interface DeleteCommentModalProps {
  isOpen: boolean;
  comment: Comment | null;
  isDeleting: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function DeleteCommentModal({
  isOpen,
  comment,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteCommentModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Foco inicial seguro no botão Cancelar para evitar disparo acidental
      const timer = setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && !isDeleting) {
          onClose();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !comment) {
    return null;
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="delete-comment-title"
      aria-describedby="delete-comment-description"
      onClick={() => {
        if (!isDeleting) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0e0e10] border border-white/10 rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-5 text-left relative animate-in zoom-in-95 duration-200"
      >
        {/* Botão de Fechar no Canto Superior Direito */}
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          aria-label="Fechar modal"
          className="absolute top-5 right-5 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Cabeçalho com Ícone de Alerta */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h3
              id="delete-comment-title"
              className="text-lg font-bold text-ohara-white"
            >
              Excluir comentário?
            </h3>
            <span className="text-xs text-red-400/90 font-medium">
              Ação destrutiva
            </span>
          </div>
        </div>

        {/* Descrição e Aviso de Irreversibilidade */}
        <p
          id="delete-comment-description"
          className="text-sm text-gray-400 leading-relaxed"
        >
          Esta ação é irreversível e o comentário será removido permanentemente.
        </p>

        {/* Ações / Botões */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/20 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Excluindo...</span>
              </>
            ) : (
              <span>Excluir comentário</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
