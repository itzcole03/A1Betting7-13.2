/**
 * Time formatting utilities for relative timestamps
 */

/**
 * Formats a timestamp as relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(timestamp: string | number | Date): string {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() :
               typeof timestamp === 'number' ? timestamp :
               timestamp.getTime();
  
  const diff = now - time;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds} seconds ago`;
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  return `${days} ${days === 1 ? 'day' : 'days'} ago`;
}

/**
 * Formats a timestamp as a readable date/time string
 */
export function formatDateTime(timestamp: string | number | Date): string {
  const date = typeof timestamp === 'string' ? new Date(timestamp) :
               typeof timestamp === 'number' ? new Date(timestamp) :
               timestamp;
  
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}