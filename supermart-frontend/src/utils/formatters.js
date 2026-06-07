export function formatPrice(amount) {
  if (amount === null || amount === undefined) return '₹0.00'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(dateString))
}

export function formatDateTime(dateString) {
  if (!dateString) return '—'
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatOrderStatus(status) {
  return status
    ?.split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || '—'
}

export function truncate(text, length = 100) {
  if (!text) return ''
  return text.length > length ? text.slice(0, length) + '…' : text
}

export function getInitials(name) {
  if (!name) return 'U'
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}