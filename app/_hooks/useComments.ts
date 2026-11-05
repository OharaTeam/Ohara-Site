import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { api } from './fetcher';
import {
  Comment,
  CreateCommentPayload,
  CommentsResponse,
  DeleteCommentResponse,
} from '../_types/comments';

export interface UseCommentsReturn {
  comments: Comment[];
  totalCount: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  createComment: (payload: CreateCommentPayload) => Promise<Comment>;
  deleteComment: (commentId: string) => Promise<void>;
  refresh: () => void;
}

export function useComments(postId: string | null | undefined): UseCommentsReturn {
  const [comments, setComments] = useState<Comment[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setPage(1);
    setRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!postId) {
      setComments([]);
      setTotalCount(0);
      setLoading(false);
      setLoadingMore(false);
      setError(null);
      setPage(1);
      setHasMore(false);
      return;
    }

    const controller = new AbortController();

    const fetchInitial = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<CommentsResponse>(
          `/postagens/${postId}/comentarios?page=1&limit=5&order=asc`,
          { signal: controller.signal }
        );

        const resData = response.data;
        const items = Array.isArray(resData?.data) ? resData.data : [];

        setComments(items);
        setTotalCount(resData?.total ?? items.length);
        setPage(1);

        const hasMoreFirst =
          resData?.totalPages !== undefined
            ? 1 < resData.totalPages
            : items.length < (resData?.total ?? 0) || items.length === 5;
        setHasMore(hasMoreFirst);
      } catch (err: unknown) {
        if (
          axios.isAxiosError(err) &&
          (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')
        ) {
          return;
        }
        const message =
          err instanceof Error ? err.message : 'Falha ao carregar comentários';
        setError(message);
        setComments([]);
        setTotalCount(0);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchInitial();

    return () => {
      controller.abort();
    };
  }, [postId, refreshKey]);

  const loadMore = useCallback(async () => {
    if (!postId || loading || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    setError(null);
    const nextPage = page + 1;

    try {
      const response = await api.get<CommentsResponse>(
        `/postagens/${postId}/comentarios?page=${nextPage}&limit=5&order=asc`
      );

      const resData = response.data;
      const newItems = Array.isArray(resData?.data) ? resData.data : [];

      setComments((prev) => {
        const merged = [
          ...prev,
          ...newItems.filter((item) => !prev.some((p) => p.id === item.id)),
        ];

        const hasMoreAfter =
          resData?.totalPages !== undefined
            ? nextPage < resData.totalPages
            : merged.length < (resData?.total ?? 0) || newItems.length === 5;

        setHasMore(hasMoreAfter);
        return merged;
      });

      setPage(nextPage);
      if (resData?.total !== undefined) {
        setTotalCount(resData.total);
      }
    } catch (err: unknown) {
      if (
        axios.isAxiosError(err) &&
        (err.name === 'CanceledError' || err.code === 'ERR_CANCELED')
      ) {
        return;
      }
      const message =
        err instanceof Error ? err.message : 'Falha ao carregar mais comentários';
      setError(message);
    } finally {
      setLoadingMore(false);
    }
  }, [postId, loading, loadingMore, hasMore, page]);

  const createComment = useCallback(
    async (payload: CreateCommentPayload): Promise<Comment> => {
      if (!postId) {
        throw new Error('ID da publicação não fornecido.');
      }

      const response = await api.post<Comment>(
        `/postagens/${postId}/comentarios`,
        {
          content: payload.content,
          media: payload.media,
        }
      );

      const newComment = response.data;
      setComments((prev) => [newComment, ...prev]);
      setTotalCount((prev) => prev + 1);
      return newComment;
    },
    [postId]
  );

  const deleteComment = useCallback(
    async (commentId: string): Promise<void> => {
      if (!postId) {
        throw new Error('ID da publicação não fornecido.');
      }

      await api.delete<DeleteCommentResponse>(
        `/postagens/${postId}/comentarios/${commentId}`
      );

      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    },
    [postId]
  );

  return {
    comments,
    totalCount,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    createComment,
    deleteComment,
    refresh,
  };
}
