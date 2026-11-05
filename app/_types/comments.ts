export interface CommentRole {
  name: string;
}

export interface CommentAuthor {
  id: string;
  username: string;
  globalName?: string | null;
  avatarUrl?: string | null;
  roles?: CommentRole[];
}

export interface Comment {
  id: string;
  content: string;
  media?: string[] | null;
  postId?: string;
  createdAt: string;
  updatedAt?: string;
  author: CommentAuthor;
}

export interface CreateCommentPayload {
  content: string;
  media?: string[];
}

export interface CommentsResponse {
  data: Comment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DeleteCommentResponse {
  message: string;
}

/**
 * Retorna a URL da imagem principal do comentário, ou null se não houver mídia.
 */
export function getMainImageUrl(comment: Comment): string | null {
  if (comment.media && comment.media.length > 0) {
    return comment.media[0];
  }
  return null;
}
