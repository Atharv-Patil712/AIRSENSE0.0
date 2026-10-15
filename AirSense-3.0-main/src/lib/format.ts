/**
 * Shared formatting helpers — one voice for timestamps across the product.
 */

export function timeAgo(input: string | number | Date): string {
  const then = new Date(input).getTime();
  if (Number.isNaN(then)) return '—';
  const diffMs = Date.now() - then;
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  if (mins < 1) return diffMs >= 0 ? 'just now' : 'shortly';
  const suffix = diffMs >= 0 ? 'ago' : 'from now';
  if (mins < 60) return `${mins}m ${suffix}`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ${suffix}`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ${suffix}`;
  return `${Math.floor(days / 30)}mo ${suffix}`;
}

export function formatTime(input: string | number | Date): string {
  return new Date(input).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(input: string | number | Date): string {
  return new Date(input).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
