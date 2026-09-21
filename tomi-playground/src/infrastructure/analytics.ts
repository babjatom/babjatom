import mixpanel from 'mixpanel-browser'

export type AnalyticsEventMap = {
  'Page Viewed': { path: string }
  'Nav Clicked': {
    to: string
    source: 'sidebar' | 'home' | 'brand' | 'ask_tomi_composer'
  }
  'Theme Selected': {
    theme_id: string
    source: 'preset' | 'random'
  }
  'Font Selected': {
    font_id: string
  }
  'Ask Tomi Message Sent': {
    source: 'starter' | 'typed'
    starter_id?: string
    turn_index: number
    is_follow_up: boolean
  }
  'Ask Tomi Action': {
    action: 'stop' | 'regenerate' | 'clear' | 'copy' | 'schedule_nudge'
  }
  'Ask Tomi Result': {
    status: 'complete' | 'error' | 'cancelled'
    latency_ms: number
    error_kind?: 'network' | 'http' | 'unknown'
    kind?: 'chat' | 'schedule'
  }
  'Visits Table Interacted': {
    action: 'sort' | 'select' | 'reorder' | 'row_action'
  }
  'Showcase Control Used': {
    control: 'button' | 'select' | 'switch' | 'dialog' | 'input'
    value?: string
  }
}

export type AnalyticsEvent = keyof AnalyticsEventMap

let enabled = false

export function initMixpanel(): void {
  const token = import.meta.env.VITE_MIXPANEL_TOKEN?.trim()
  if (!token) {
    enabled = false
    return
  }

  mixpanel.init(token, {
    track_pageview: false,
    persistence: 'localStorage',
    // Project is hosted in the EU (eu.mixpanel.com).
    api_host: 'https://api-eu.mixpanel.com',
  })
  enabled = true
}

export function track<E extends AnalyticsEvent>(
  event: E,
  properties: AnalyticsEventMap[E],
): void {
  if (!enabled) return
  mixpanel.track(event, properties)
}

/** Test helper — reset module state between cases. */
export function __resetAnalyticsForTests(options?: {
  enabled?: boolean
}): void {
  enabled = options?.enabled ?? false
}
