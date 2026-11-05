"use client";

import { useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';
import { Comment, CreateCommentPayload } from '../../_types/comments';
import { CommentItem } from './CommentItem';
import { CommentSkeleton } from './CommentSkeleton';
import { CommentForm } from './CommentForm';

export interface CommentListProps {
  comments: Comment[];
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  postAuthorId?: string;
  postId?: string;
  onSubmitComment?: (payload: CreateCommentPayload) => Promise<Comment | null>;
}

export function CommentList({
  comments,
  totalCount,
  loading,
  loadingMore,
  hasMore,
  loadMore,
  postAuthorId,
  postId,
  onSubmitComment,
}: CommentListProps) {
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  const handleCommentCreated = (novoComentario: Comment) => {
    setNewlyCreatedId(novoComentario.id);
    setTimeout(() => {
      setNewlyCreatedId(null);
    }, 3000);

    const el = document.getElementById("comentarios");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="w-full">
      {/* --- TÍTULO DA SEÇÃO --- */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-xl md:text-2xl font-bold text-ohara-white flex items-center gap-2.5">
          <span>Comentários</span>
          <span className="text-xs md:text-sm font-semibold text-gray-400 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
            {totalCount}
          </span>
        </h3>
      </div>

      {/* --- FORMULÁRIO DE COMENTÁRIO (ACIMA DA LISTA E DO ESTADO VAZIO) --- */}
      {postId && onSubmitComment && (
        <div className="mb-8">
          <CommentForm
            postId={postId}
            onSubmitComment={onSubmitComment}
            onCommentCreated={handleCommentCreated}
          />
        </div>
      )}

      {/* --- CARGA INICIAL (SKELETON) --- */}
      {loading && comments.length === 0 && <CommentSkeleton />}

      {/* --- ESTADO VAZIO --- */}
      {!loading && comments.length === 0 && (
        <div className="p-10 text-center border border-dashed border-white/10 rounded-xl bg-white/[0.01] flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3 text-gray-500">
            <MessageSquare size={24} />
          </div>
          <h4 className="text-ohara-white font-semibold text-base mb-1">
            Nenhum comentário por enquanto.
          </h4>
          <p className="text-gray-400 text-sm">
            Seja o primeiro a participar da conversa!
          </p>
        </div>
      )}

      {/* --- LISTA DE COMENTÁRIOS --- */}
      {comments.length > 0 && (
        <div className="flex flex-col gap-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postAuthorId={postAuthorId}
              isNew={comment.id === newlyCreatedId}
            />
          ))}
        </div>
      )}

      {/* --- BOTÃO CARREGAR MAIS (PAGINAÇÃO) --- */}
      {hasMore && !loading && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 hover:border-ohara-blue/50 bg-white/[0.03] hover:bg-white/[0.07] text-ohara-white text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingMore ? (
              <>
                <Loader2 size={16} className="animate-spin text-ohara-blue" />
                <span>Carregando comentários...</span>
              </>
            ) : (
              <span>Carregar mais comentários</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
