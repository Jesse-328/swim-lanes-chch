// ── Pool opening hours ────────────────────────────────────────────────────────
// Format: [openHour, closeHour] in 24h, per day [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

export const POOL_HOURS = {
  parakiore: {
    hours: [
      [6, 21],   // Sun
      [5.5, 21], // Mon
      [5.5, 21], // Tue
      [5.5, 21], // Wed
      [5.5, 21], // Thu
      [5.5, 21], // Fri
      [6, 20],   // Sat
    ],
  },
  taiora: {
    hours: [
      [7, 20],   // Sun
      [5.5, 21], // Mon
      [5.5, 21], // Tue
      [5.5, 21], // Wed
      [5.5, 21], // Thu
      [5.5, 21], // Fri
      [7, 20],   // Sat
    ],
  },
  graham: {
    hours: [
      [8, 17],   // Sun
      [6, 21],   // Mon
      [6, 21],   // Tue
      [6, 21],   // Wed
      [6, 21],   // Thu
      [6, 21],   // Fri
      [7, 17],   // Sat
    ],
  },
  matatiki: {
    hours: [
      [8, 17],   // Sun
      [5.5, 21], // Mon
      [5.5, 21], // Tue
      [5.5, 21], // Wed
      [5.5, 21], // Thu
      [5.5, 21], // Fri
      [7, 17],   // Sat
    ],
  },
  jellie: {
    hours: [
      [8, 17],   // Sun
      [6, 21],   // Mon
      [6, 21],   // Tue
      [6, 21],   // Wed
      [6, 21],   // Thu
      [6, 21],   // Fri
      [7, 17],   // Sat
    ],
  },
  pioneer: {
    hours: [
      [8, 17],   // Sun
      [6, 21],   // Mon
      [6, 21],   // Tue
      [6, 21],   // Wed
      [6, 21],   // Thu
      [6, 21],   // Fri
      [7, 17],   // Sat
    ],
  },
  linwood: {
    hours: [
      [8, 17],   // Sun
      [6, 20],   // Mon
      [6, 20],   // Tue
      [6, 20],   // Wed
      [6, 20],   // Thu
      [6, 20],   // Fri
      [7, 17],   // Sat
    ],
  },
}

// Returns a status object for a pool right now
// { status: 'open'|'closed'|'closing', label: string }
export function getPoolStatus(poolId) {
  const poolHours = POOL_HOURS[poolId]
  if (!poolHours) return null

  const now = new Date()
  const dow = now.getDay()
  const [open, close] = poolHours.hours[dow]

  const nowHour = now.getHours() + now.getMinutes() / 60

  if (nowHour < open) {
    // Opens later today
    const minsUntilOpen = Math.round((open - nowHour) * 60)
    if (minsUntilOpen < 60) return { status: 'closed', label: `Opens in ${minsUntilOpen}m` }
    const hrs = Math.floor(minsUntilOpen / 60)
    const mins = minsUntilOpen % 60
    return { status: 'closed', label: mins > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${hrs}h` }
  }

  if (nowHour >= close) {
    // Already closed — find next open time
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowDow = tomorrow.getDay()
    const [tomorrowOpen] = poolHours.hours[tomorrowDow]
    const tomorrowOpenTime = tomorrowOpen < 10
      ? `0${Math.floor(tomorrowOpen)}:${tomorrowOpen % 1 === 0.5 ? '30' : '00'}`
      : `${Math.floor(tomorrowOpen)}:${tomorrowOpen % 1 === 0.5 ? '30' : '00'}`
    return { status: 'closed', label: `Closed · Opens ${tomorrowOpenTime} tomorrow` }
  }

  // Currently open — how long until close?
  const minsUntilClose = Math.round((close - nowHour) * 60)

  if (minsUntilClose <= 30) {
    return { status: 'closing', label: `Closes in ${minsUntilClose}m` }
  }
  if (minsUntilClose <= 60) {
    return { status: 'closing', label: `Closes in ${minsUntilClose}m` }
  }
  if (minsUntilClose <= 90) {
    return { status: 'open', label: `Closes in ${minsUntilClose}m` }
  }

  // More than 90 mins — just show close time
  const closeHour = Math.floor(close)
  const closeMins = close % 1 === 0.5 ? '30' : '00'
  const closeAmPm = closeHour >= 12 ? 'pm' : 'am'
  const closeHour12 = closeHour > 12 ? closeHour - 12 : closeHour
  return { status: 'open', label: `Open · Closes ${closeHour12}:${closeMins}${closeAmPm}` }
}
