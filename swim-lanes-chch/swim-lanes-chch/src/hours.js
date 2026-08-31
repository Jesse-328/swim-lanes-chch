// ── Pool opening hours ────────────────────────────────────────────────────────
// Format: [openHour, closeHour] in 24h, per day [Sun, Mon, Tue, Wed, Thu, Fri, Sat]
// Parakiore Sat/Sun opening inferred from CCC lane table (first lanes at 7am).

export const POOL_HOURS = {
  parakiore: { hours: [[7, 21], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [7, 20]] },
  taiora:    { hours: [[7, 20], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [7, 20]] },
  graham:    { hours: [[8, 17], [6, 21],   [6, 21],   [6, 21],   [6, 21],   [6, 21],   [7, 17]] },
  matatiki:  { hours: [[8, 17], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [5.5, 21], [7, 17]] },
  jellie:    { hours: [[8, 17], [6, 21],   [6, 21],   [6, 21],   [6, 21],   [6, 21],   [7, 17]] },
  pioneer:   { hours: [[8, 17], [6, 21],   [6, 21],   [6, 21],   [6, 21],   [6, 21],   [7, 17]] },
  linwood:   { hours: [[8, 17], [6, 20],   [6, 20],   [6, 20],   [6, 20],   [6, 20],   [7, 17]] },
}

// 5.5 → "5:30am", 21 → "9pm"
export function fmtHour(h) {
  const hh = Math.floor(h), mm = h % 1 ? ':30' : ''
  const ampm = hh >= 12 ? 'pm' : 'am'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}${mm}${ampm}`
}

const fmtMins = mins => {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60), m = mins % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

const isSameDay = (a, b) => a.toDateString() === b.toDateString()

// Status for a pool on the selected date.
//   Today       → live: { status: 'open'|'closing'|'closed', label }
//   Another day → that day's hours: { status: 'hours', label: 'Sat · 7am–5pm' }
export function getPoolStatus(poolId, date = new Date()) {
  const poolHours = POOL_HOURS[poolId]
  if (!poolHours) return null

  const now = new Date()
  const dow = date.getDay()
  const [open, close] = poolHours.hours[dow]

  if (!isSameDay(date, now)) {
    const day = date.toLocaleDateString('en-NZ', { weekday: 'short' })
    return { status: 'hours', label: `${day} · ${fmtHour(open)}–${fmtHour(close)}` }
  }

  const nowHour = now.getHours() + now.getMinutes() / 60

  if (nowHour < open) {
    return { status: 'closed', label: `Opens in ${fmtMins(Math.round((open - nowHour) * 60))}` }
  }
  if (nowHour >= close) {
    const tomorrow = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1)
    const [tomorrowOpen] = poolHours.hours[tomorrow.getDay()]
    return { status: 'closed', label: `Closed · Opens ${fmtHour(tomorrowOpen)} tomorrow` }
  }

  const minsUntilClose = Math.round((close - nowHour) * 60)
  if (minsUntilClose <= 60) return { status: 'closing', label: `Closes in ${fmtMins(minsUntilClose)}` }
  if (minsUntilClose <= 90) return { status: 'open', label: `Closes in ${fmtMins(minsUntilClose)}` }
  return { status: 'open', label: `Open · Closes ${fmtHour(close)}` }
}
