/**
 * Utilitário para formatação de data relativa em pt-BR com timestamp completo para tooltip.
 */
export function formatRelativeTime(dateInput: string | Date | number): { relative: string; full: string } {
  const date = new Date(dateInput);

  if (isNaN(date.getTime())) {
    return { relative: 'Data inválida', full: '' };
  }

  const now = Date.now();
  const diffInSeconds = Math.floor((now - date.getTime()) / 1000);

  const full = date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  if (diffInSeconds < 60) {
    return { relative: 'agora mesmo', full };
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return { relative: `há ${diffInMinutes} min`, full };
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return { relative: diffInHours === 1 ? 'há 1 hora' : `há ${diffInHours} horas`, full };
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return { relative: 'ontem', full };
  }

  if (diffInDays < 30) {
    return { relative: `há ${diffInDays} dias`, full };
  }

  const relative = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return { relative, full };
}
