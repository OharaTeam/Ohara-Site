"use client";

import { useState, useRef, useEffect, ChangeEvent, KeyboardEvent, ClipboardEvent } from "react";
import { Send, ImageIcon, X, Loader2 } from "lucide-react";
import { useAuth } from "../../_context/AuthContext";
import { useNotification } from "../../_context/NotificationContext";
import { api } from "../../_hooks/fetcher";
import { Comment, CreateCommentPayload } from "../../_types/comments";
import { CommentFormGuestOverlay } from "./CommentFormGuestOverlay";

export interface CommentFormProps {
  postId: string;
  onSubmitComment: (payload: CreateCommentPayload) => Promise<Comment | null>;
  onCommentCreated?: (comment: Comment) => void;
}

const MAX_CHAR_COUNT = 1000;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function CommentForm({
  onSubmitComment,
  onCommentCreated,
}: CommentFormProps) {
  const { user } = useAuth();
  const { notify } = useNotification();

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpeza de ObjectURL temporário
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Redimensionamento automático da textarea
  const adjustHeight = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 240)}px`;
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    adjustHeight();
  };

  const handleSelectImage = (file: File) => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      notify("Formato de imagem inválido. Use PNG, JPG, WebP ou GIF.", "error");
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      notify("A imagem deve ter no máximo 5MB.", "error");
      return;
    }

    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setImageFile(file);
    setImagePreviewUrl(preview);
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleSelectImage(file);
    }
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const file = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (file) {
        e.preventDefault();
        handleSelectImage(file);
      }
    }
  };

  const handleSubmit = async () => {
    if (!user) return;

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      notify("O comentário não pode ficar vazio.", "error");
      return;
    }

    if (trimmed.length > MAX_CHAR_COUNT) {
      notify(`O comentário excede o limite de ${MAX_CHAR_COUNT} caracteres.`, "error");
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrls: string[] = [];

      if (imageFile) {
        const formData = new FormData();
        formData.append("arquivos", imageFile);

        try {
          const uploadRes = await api.post<{ urls: string[] }>("/postagens/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (uploadRes.data?.urls && uploadRes.data.urls.length > 0) {
            mediaUrls = [uploadRes.data.urls[0]];
          }
        } catch (uploadError) {
          console.error("Erro ao fazer upload da imagem:", uploadError);
          notify("Erro ao enviar a imagem. Seu texto foi preservado.", "error");
          setIsSubmitting(false);
          return;
        }
      }

      const payload: CreateCommentPayload = {
        content: trimmed,
        ...(mediaUrls.length > 0 ? { media: mediaUrls } : {}),
      };

      const created = await onSubmitComment(payload);
      if (created) {
        setContent("");
        handleRemoveImage();
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
        notify("Comentário publicado com sucesso!", "success");
        onCommentCreated?.(created);
      }
    } catch (err) {
      console.error("Erro ao criar comentário:", err);
      notify("Não foi possível publicar seu comentário. Tente novamente.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (!isSubmitting) {
        handleSubmit();
      }
    }
  };

  const charCount = content.length;
  const isOverLimit = charCount > MAX_CHAR_COUNT;
  const isNearLimit = charCount >= MAX_CHAR_COUNT * 0.9;

  return (
    <div className="relative bg-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-sm shadow-lg overflow-hidden transition-all duration-300">
      {/* --- OVERLAY PARA VISITANTES DESLOGADOS --- */}
      {!user && <CommentFormGuestOverlay />}

      {/* --- CABEÇALHO COM IDENTIFICAÇÃO DO AUTOR --- */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">
          <img
            src={
              user?.serverAvatarUrl ||
              user?.avatarUrl ||
              "https://cdn.discordapp.com/embed/avatars/0.png"
            }
            alt="Avatar do usuário"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-ohara-white font-semibold text-sm leading-tight">
            {user
              ? user.serverNickName || user.globalName || user.username
              : "Visitante da Comunidade"}
          </span>
          <span className="text-gray-400 text-xs">
            {user ? "Deixe sua opinião na discussão" : "Conecte-se para interagir"}
          </span>
        </div>
      </div>

      {/* --- CAMPO TEXTAREA --- */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={!user || isSubmitting}
          placeholder="Escreva o que você achou desta publicação... (Enter pula linha, Ctrl+Enter envia)"
          rows={3}
          className="w-full bg-white/[0.03] border border-white/10 focus:border-ohara-pink/50 focus:ring-1 focus:ring-ohara-pink/30 rounded-xl px-4 py-3 text-ohara-white placeholder:text-gray-500 text-sm outline-none resize-none transition-all min-h-[84px] max-h-60 overflow-y-auto disabled:opacity-40 disabled:cursor-not-allowed"
        />

        {/* --- PRÉVIA DA IMAGEM SELECIONADA --- */}
        {imagePreviewUrl && (
          <div className="mt-2.5 inline-block relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
            <img
              src={imagePreviewUrl}
              alt="Prévia do anexo"
              className="max-h-28 sm:max-h-32 object-contain rounded-xl"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={isSubmitting}
              title="Remover anexo"
              className="absolute top-1.5 right-1.5 bg-black/75 hover:bg-red-600 text-white p-1 rounded-full backdrop-blur-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* --- INPUT DE ARQUIVO ESCONDIDO --- */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_MIME_TYPES.join(",")}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* --- RODAPÉ COM AÇÕES E CONTADOR --- */}
      <div className="mt-3.5 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3">
        {/* Botão de anexo */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!user || isSubmitting || !!imageFile}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-ohara-blue disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer py-1.5 px-2.5 rounded-lg hover:bg-white/5"
          >
            <ImageIcon size={16} className={imageFile ? "text-ohara-pink" : ""} />
            <span>{imageFile ? "1 imagem anexada" : "Anexar imagem"}</span>
          </button>
        </div>

        {/* Contador e Botão Enviar */}
        <div className="flex items-center gap-3.5">
          <span
            className={`text-xs font-medium transition-colors ${
              isOverLimit
                ? "text-red-500 font-bold"
                : isNearLimit
                ? "text-amber-400"
                : "text-gray-400"
            }`}
          >
            {charCount}/{MAX_CHAR_COUNT}
          </span>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!user || isSubmitting || content.trim().length === 0 || isOverLimit}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-sm shadow-md transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer hover:scale-105 active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--color-ohara-pink, #d946ef), var(--color-ohara-orange, #fb923c))",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin text-white" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Send size={15} />
                <span>Comentar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
