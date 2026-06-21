// ── Women's swimming sessions ─────────────────────────────────────────────────
// Source: CCC recandsport.ccc.govt.nz/womens-sessions/
// Wed 3:00pm–9:30pm  Te Pou Toetoe Linwood Pool
// Thu 3:00pm–9:30pm  Matatiki Hornby Centre

export const WOMENS_SESSIONS = [
  { poolId: 'linwood',  day: 3, startHour: 15,   endHour: 21.5 }, // Wed
  { poolId: 'matatiki', day: 4, startHour: 15,   endHour: 21.5 }, // Thu
]

/**
 * Returns true if the given pool has a women's session active
 * during any part of the given time period on the given date.
 *
 * @param {string} poolId
 * @param {Date}   date
 * @param {{ hourStart: number, hourEnd: number }} period
 */
export function hasWomensSession(poolId, date, period) {
  const dow = date.getDay() // 0=Sun … 6=Sat
  return WOMENS_SESSIONS.some(s =>
    s.poolId === poolId &&
    s.day === dow &&
    s.startHour < period.hourEnd &&
    s.endHour > period.hourStart
  )
}

/**
 * Returns true if a specific timeslot (by hour) falls inside a women's session
 * for the given pool and date.
 *
 * @param {string} poolId
 * @param {Date}   date
 * @param {number} slotHour  — decimal hour, e.g. 15.5 for 3:30pm
 */
export function isWomensSlot(poolId, date, slotHour) {
  const dow = date.getDay()
  return WOMENS_SESSIONS.some(s =>
    s.poolId === poolId &&
    s.day === dow &&
    slotHour >= s.startHour &&
    slotHour < s.endHour
  )
}
