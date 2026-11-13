"use client";

import { useState } from "react";
import { Trash2, ShieldAlert } from "lucide-react";
import { Comment, getMainImageUrl } from "../../_types/comments";
import { formatRelativeTime } from "../../_utils/formatRelativeTime";
import { useAuth } from "../../_context/AuthContext";
import { ImageLightbox } from "./ImageLightbox";

export interface CommentItemProps {
  comment: Comment;
  postAuthorId?: string;
  isNew?: boolean;
  onDeleteRequest?: (comment: Comment) => void;
  isDeleting?: boolean;
  isDeleted?: boolean;
}

export function CommentItem({
  comment,
  postAuthorId,
  isNew,
  onDeleteRequest,
  isDeleted,
}: CommentItemProps) {
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { author } = comment;
  const displayName = author.globalName || author.username;
  const initial = (displayName[0] || "?").toUpperCase();
  const isDev = author.roles?.some((r) => r.name.toLowerCase() === "dev");
  const isAuthor = Boolean(postAuthorId && author.id === postAuthorId);

  // Verificação RBAC: autor original ou usuário com cargo administrativo Dev
  const isOwner = Boolean(user && user.discordId === author.id);
  const isDevUser = Boolean(
    user?.roles?.some((r) => r.toLowerCase() === "dev")
  );
  const canDelete = isOwner || isDevUser;
  const isDevModerating = isDevUser && !isOwner;

  const { relative, full } = formatRelativeTime(comment.createdAt);
  const imageUrl = getMainImageUrl(comment);

  const renderContentWithLinks = (content: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = content.split(urlRegex);

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ohara-blue hover:text-ohara-pink underline underline-offset-2 transition-colors break-all"
          >
            {part}
          </a>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <article
      className={`group p-5 rounded-xl border flex flex-col gap-3 transition-all duration-300 ${
        isDeleted
          ? "opacity-0 scale-95 pointer-events-none"
          : isNew
          ? "border-ohara-pink/60 bg-white/[0.04] shadow-[0_0_20px_rgba(217,70,239,0.25)] ring-1 ring-ohara-pink/50 duration-700"
          : "border-white/10 bg-white/[0.02] hover:border-white/20"
      }`}
    >
      {/* --- CABEÇALHO DO COMENTÁRIO --- */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {author.avatarUrl && !avatarError ? (
            <img
              src={author.avatarUrl}
              alt={displayName}
              onError={() => setAvatarError(true)}
              className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ohara-pink/30 to-ohara-blue/30 border border-white/10 flex items-center justify-center font-bold text-ohara-white shrink-0">
              {initial}
            </div>
          )}

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-ohara-white text-sm md:text-base truncate">
                {displayName}
              </span>

              {isDev && (
                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-ohara-pink to-ohara-orange text-white shadow-sm">
                  Dev
                </span>
              )}

              {isAuthor && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-ohara-blue/20 text-ohara-blue border border-ohara-blue/30">
                  Autor
                </span>
              )}
            </div>

            <time
              dateTime={comment.createdAt}
              title={full}
              className="text-xs text-gray-500 cursor-help transition-colors hover:text-gray-400"
            >
              {relative}
            </time>
          </div>
        </div>

        {/* --- BOTÃO DE EXCLUSÃO / MODERAÇÃO RBAC --- */}
        {canDelete && onDeleteRequest && (
          <button
            type="button"
            onClick={() => onDeleteRequest(comment)}
            title={isDevModerating ? "Moderar comentário" : "Excluir comentário"}
            aria-label={isDevModerating ? "Moderar comentário" : "Excluir comentário"}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:opacity-100 focus-visible:outline-none opacity-90 sm:opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer"
          >
            {isDevModerating ? <ShieldAlert size={16} /> : <Trash2 size={16} />}
          </button>
        )}
      </div>

      {/* --- CORPO DO TEXTO --- */}
      <div className="text-gray-300 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words">
        {renderContentWithLinks(comment.content)}
      </div>

      {/* --- IMAGEM ANEXADA --- */}
      {imageUrl && !imageError && (
        <div className="mt-1">
          <img
            src={imageUrl}
            alt="Mídia anexada ao comentário"
            className="max-h-72 rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-95 transition-opacity"
            onError={() => setImageError(true)}
            onClick={() => setLightboxOpen(true)}
          />
        </div>
      )}

      {/* --- MODAL LIGHTBOX --- */}
      {lightboxOpen && imageUrl && (
        <ImageLightbox src={imageUrl} onClose={() => setLightboxOpen(false)} />
      )}
    </article>
  );
}
