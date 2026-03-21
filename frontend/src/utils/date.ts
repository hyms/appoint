const LOCALE = 'es-ES'

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export function formatTime(time: string | Date | null | undefined): string {
  if (!time) return ''
  const d = typeof time === 'string' ? new Date(time) : time
  return d.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateTime(date: string | Date | null | undefined, time?: string | Date): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (time) {
    const t = typeof time === 'string' ? new Date(time) : time
    return `${formatDate(d)} ${formatTime(t)}`
  }
  return d.toLocaleString(LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatLongDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export function fromNow(date: string | Date | null | undefined): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)
  const diffWeek = Math.round(diffDay / 7)
  const diffMonth = Math.round(diffDay / 30)
  const diffYear = Math.round(diffDay / 365)

  if (diffSec < 60) return 'hace unos segundos'
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin === 1 ? '' : 's'}`
  if (diffHour < 24) return `hace ${diffHour} hora${diffHour === 1 ? '' : 's'}`
  if (diffDay < 7) return `hace ${diffDay} día${diffDay === 1 ? '' : 's'}`
  if (diffWeek < 4) return `hace ${diffWeek} semana${diffWeek === 1 ? '' : 's'}`
  if (diffMonth < 12) return `hace ${diffMonth} mes${diffMonth === 1 ? '' : 'es'}`
  return `hace ${diffYear} año${diffYear === 1 ? '' : 's'}`
}
