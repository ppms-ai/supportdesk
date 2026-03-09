import { format, formatDistanceToNow } from 'date-fns'

/**
 * Converts a business name to a URL-safe slug.
 * e.g. "Glamour Salon & Spa" → "glamour-salon-spa"
 */
export function generateSlug(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Format a date string as "Mar 9, 2026"
 */
export function formatDate(dateStr) {
  return format(new Date(dateStr), 'MMM d, yyyy')
}

/**
 * Format a date string as "2 hours ago"
 */
export function timeAgo(dateStr) {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
}

/**
 * Map a ticket status value to its display label and colour classes.
 */
export const STATUS_CONFIG = {
  open: {
    label: 'Open',
    classes: 'bg-amber-100 text-amber-800',
  },
  in_progress: {
    label: 'In Progress',
    classes: 'bg-sky-100 text-sky-700',
  },
  resolved: {
    label: 'Resolved',
    classes: 'bg-emerald-100 text-emerald-700',
  },
}
