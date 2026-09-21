const CAL_HOSTS = new Set(['cal.com', 'www.cal.com', 'app.cal.com'])

function isCalSchedulingUrl(raw: string): boolean {
  let url: URL
  try {
    url = new URL(raw.includes('://') ? raw : `https://${raw}`)
  } catch {
    return false
  }
  if (!CAL_HOSTS.has(url.hostname.toLowerCase())) return false
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2) return false
  const blocked = new Set([
    'booking',
    'bookings',
    'embed',
    'apps',
    'settings',
    'auth',
    'signup',
    'login',
  ])
  if (parts.some((p) => blocked.has(p.toLowerCase()))) return false
  return true
}

/** Returns the Cal.com scheduling URL if this message should go to the scheduler. */
export function extractCalScheduleUrl(message: string): string | null {
  const trimmed = message.trim()
  if (!trimmed) return null
  if (isCalSchedulingUrl(trimmed)) return trimmed

  const match = trimmed.match(/https?:\/\/(?:www\.)?cal\.com\/[^\s]+/i)
  if (!match) return null
  const candidate = match[0].replace(/[),.;]+$/, '')
  return isCalSchedulingUrl(candidate) ? candidate : null
}
