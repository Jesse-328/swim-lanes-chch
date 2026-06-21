// ── Manual fallback alerts ────────────────────────────────────────────────────
// Add entries here when you know about a closure that the scraper might miss.
// Remove them when the pool reopens.
// type: 'closed' | 'reduced'
// until: optional date string e.g. '2026-07-15' — auto-clears after this date

export const MANUAL_ALERTS = [
  // Example (uncomment and edit to use):
  // {
  //   poolId: 'linwood',
  //   type: 'closed',
  //   message: 'Closed for scheduled maintenance.',
  //   until: '2026-07-20',
  // },
]

// Returns active manual alerts for today
export function getActiveManualAlerts() {
  const now = new Date()
  return MANUAL_ALERTS.filter(a => {
    if (!a.until) return true
    return new Date(a.until) >= now
  })
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
