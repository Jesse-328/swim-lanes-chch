// ── Manual alerts ─────────────────────────────────────────────────────────────
// Add entries here for closures the scraper can't see. Remove when the pool reopens.
// type: 'closed' | 'reduced'
// until: optional 'YYYY-MM-DD' — the alert auto-clears after this date
//
// A 'closed' alert also removes the pool from the ranked list and the pool filter.

export const MANUAL_ALERTS = [
  {
    poolId: 'jellie',
    type: 'closed',
    message: 'Closed for maintenance and strengthening. Outdoor pools reopen November 2026, indoor pools early 2027.',
    until: '2027-03-31',
  },
]

// Returns active manual alerts for today
export function getActiveManualAlerts() {
  const now = new Date()
  return MANUAL_ALERTS.filter(a => {
    if (!a.until) return true
    return new Date(a.until) >= now
  })
}

// Pool ids with an active 'closed' alert
export function getClosedPoolIds() {
  return getActiveManualAlerts().filter(a => a.type === 'closed').map(a => a.poolId)
}

// Merge live (scraped) alerts with manual fallbacks.
// Live alerts take priority — no duplicates for same pool.
export function mergeAlerts(liveAlerts = [], manualAlerts = []) {
  const merged = [...liveAlerts]
  for (const manual of manualAlerts) {
    if (!merged.find(a => a.poolId === manual.poolId)) {
      merged.push({ ...manual, source: 'manual' })
    }
  }
  return merged
}
