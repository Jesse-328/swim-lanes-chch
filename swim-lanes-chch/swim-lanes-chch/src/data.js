// ─── POOL DEFINITIONS ────────────────────────────────────────────────────────

export const POOLS = [
  {
    id: 'parakiore',
    name: 'Parakiore',
    shortName: 'Parakiore',
    subtitle: 'Te Puna o Whakaōho',
    location: 'Nga Puna Wai, Christchurch',
    maxLanes: 20,
    color: '#7ecac3',
    colorDark: '#2a6b66',
    url: 'https://recandsport.ccc.govt.nz/parakiore/',
    features: ['50m pool', '25m pool', 'Hydroslides', 'Gym'],
    tip: 'Largest pool in Christchurch. 20 lanes in 25m mode mid-morning.',
  },
  {
    id: 'graham',
    name: 'Graham Condon',
    shortName: 'Graham Condon',
    subtitle: 'Bishopdale',
    location: 'Harewood Rd, Bishopdale',
    maxLanes: 8,
    color: '#a8c5a0',
    colorDark: '#3d6b38',
    url: 'https://recandsport.ccc.govt.nz/graham-condon/',
    features: ['25m pool', 'Spa', 'Gym'],
    tip: 'Quieter community pool. Great mid-morning lanes.',
  },
  {
    id: 'jellie',
    name: 'Jellie Park',
    shortName: 'Jellie Park',
    subtitle: 'Fendalton',
    location: 'Ilam Rd, Fendalton',
    maxLanes: 8,
    color: '#c4a882',
    colorDark: '#7a5c30',
    url: 'https://recandsport.ccc.govt.nz/jellie-park/',
    features: ['25m pool', 'Outdoor pool', 'Hydroslide', 'Spa'],
    tip: 'Popular but outdoor lanes are a bonus in good weather.',
  },
  {
    id: 'matatiki',
    name: 'Matatiki Hornby',
    shortName: 'Matatiki',
    subtitle: 'Hornby',
    location: 'Shands Rd, Hornby',
    maxLanes: 8,
    color: '#b8a4c9',
    colorDark: '#5c3d7a',
    url: 'https://recandsport.ccc.govt.nz/matatiki-hornby-centre/',
    features: ['25m pool', 'Hydrotherapy', 'Gym'],
    tip: 'Newer facility, often less crowded than central pools.',
  },
  {
    id: 'taiora',
    name: 'Taiora QEII',
    shortName: 'Taiora',
    subtitle: 'New Brighton',
    location: 'Travis Rd, New Brighton',
    maxLanes: 10,
    color: '#e8836a',
    colorDark: '#8a3820',
    url: 'https://recandsport.ccc.govt.nz/taiora-qeii/',
    features: ['50m pool', 'Wave pool', 'Hydroslides', 'Spa'],
    tip: 'Great 50m lanes. Tends to be less crowded than Parakiore.',
  },
  {
    id: 'pioneer',
    name: 'Pioneer',
    shortName: 'Pioneer',
    subtitle: 'Spreydon',
    location: 'Colombo St, Spreydon',
    maxLanes: 6,
    color: '#8fada0',
    colorDark: '#2d5a50',
    url: 'https://recandsport.ccc.govt.nz/pioneer/',
    features: ['25m pool', 'Spa', 'Sauna'],
    tip: 'Small, community feel. Good for a quiet early morning swim.',
  },
  {
    id: 'linwood',
    name: 'Te Pou Toetoe',
    shortName: 'Linwood',
    subtitle: 'Linwood',
    location: 'Linwood Ave, Linwood',
    maxLanes: 6,
    color: '#d4a0b0',
    colorDark: '#7a3050',
    url: 'https://recandsport.ccc.govt.nz/te-pou-toetoe-linwood-pool/',
    features: ['25m pool', 'Learner pool'],
    tip: 'Neighbourhood pool, often very quiet on weekday afternoons.',
  },
]

// ─── TIME SLOTS ───────────────────────────────────────────────────────────────

export const TIME_SLOTS = [
  { label: '5:30am', hour: 5.5 },
  { label: '6:00am', hour: 6 },
  { label: '6:30am', hour: 6.5 },
  { label: '7:00am', hour: 7 },
  { label: '7:30am', hour: 7.5 },
  { label: '8:00am', hour: 8 },
  { label: '8:30am', hour: 8.5 },
  { label: '9:00am', hour: 9 },
  { label: '9:30am', hour: 9.5 },
  { label: '10:00am', hour: 10 },
  { label: '10:30am', hour: 10.5 },
  { label: '11:00am', hour: 11 },
  { label: '11:30am', hour: 11.5 },
  { label: '12:00pm', hour: 12 },
  { label: '12:30pm', hour: 12.5 },
  { label: '1:00pm', hour: 13 },
  { label: '1:30pm', hour: 13.5 },
  { label: '2:00pm', hour: 14 },
  { label: '2:30pm', hour: 14.5 },
  { label: '3:00pm', hour: 15 },
  { label: '3:30pm', hour: 15.5 },
  { label: '4:00pm', hour: 16 },
  { label: '4:30pm', hour: 16.5 },
  { label: '5:00pm', hour: 17 },
  { label: '5:30pm', hour: 17.5 },
  { label: '6:00pm', hour: 18 },
  { label: '6:30pm', hour: 18.5 },
  { label: '7:00pm', hour: 19 },
  { label: '7:30pm', hour: 19.5 },
  { label: '8:00pm', hour: 20 },
  { label: '8:30pm', hour: 20.5 },
]

export const TIME_PERIODS = [
  { id: 'early', label: 'Early bird', sublabel: '5:30 – 8am', icon: '🌅', hourStart: 5, hourEnd: 8 },
  { id: 'morning', label: 'Morning', sublabel: '8am – 12pm', icon: '☀️', hourStart: 8, hourEnd: 12 },
  { id: 'afternoon', label: 'Afternoon', sublabel: '12pm – 4pm', icon: '🌤️', hourStart: 12, hourEnd: 16 },
  { id: 'evening', label: 'Evening', sublabel: '4pm – 8:30pm', icon: '🌙', hourStart: 16, hourEnd: 21 },
]

// ─── PARAKIORE ACTUAL DATA (scraped) ─────────────────────────────────────────
// Index matches TIME_SLOTS order. null = transition/closed, 0 = event/full

export const PARAKIORE_WEEKLY = {
  // day of week: 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  // Pattern derived from actual June 2026 data
  1: [8,6,4,4,8,null,20,20,20,20,20,20,20, 20,20,20,20,20,20,20,17,6,6, 6,9,9,7,12,14,14,17],   // Mon
  2: [6,4,4,4,8,10,10,10,10,10,10,10,10,   10,10,10,null,20,20,20,20,12,9, 9,9,7,1,7,7,7,7],    // Tue
  3: [10,6,6,6,10,null,20,20,20,20,20,20,20, 20,20,20,20,20,20,20,17,9,9, 9,7,7,3,7,7,7,10],    // Wed
  4: [4,4,4,4,7,9,9,10,10,10,10,10,10,     10,10,10,null,20,20,20,20,12,9, 9,9,9,2,10,10,10,10], // Thu
  5: [8,4,4,4,10,null,20,20,20,20,20,20,20, 20,20,17,20,20,20,20,20,9,9, 6,12,2,6,6,6,6,6],     // Fri
  6: [null,null,null,6,6,5,5,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,0,0, 0,0,0,0,0,null,null,null],    // Sat (event pattern)
  0: [null,null,null,0,0,0,0,0,0,0,0,0,0,   0,0,0,0,0,0,0,0,0,0, 0,0,0,10,10,null,null,null],  // Sun (event pattern)
}

// Typical (non-event) weekend pattern for Parakiore
export const PARAKIORE_WEEKEND_TYPICAL = {
  6: [null,null,null,8,8,6,6,10,10,10,8,8,8, 8,8,8,8,8,8,8,6,4,4, 4,6,8,6,8,8,null,null],
  0: [null,null,null,null,null,null,8,10,10,10,8,8,8, 8,8,8,8,8,8,6,6,4,4, 4,6,6,4,6,null,null,null],
}

// ─── OTHER POOL PATTERNS (estimated from CCC typical schedules) ───────────────
// Scaled to each pool's max lanes. Based on observed CCC patterns.

export const OTHER_POOL_PATTERNS = {
  graham: {
    // 8 lanes max, community pool, quieter
    weekday: [null,null,2,3,4,5,5,6,6,7,7,7,7, 7,7,6,5,6,6,6,5,3,3, 3,4,4,2,4,4,null,null],
    weekend: [null,null,null,null,4,4,4,5,5,6,6,5,5, 4,4,4,4,4,3,3,2,2,null, null,null,null,null,null,null,null,null],
  },
  jellie: {
    weekday: [null,2,2,3,4,null,5,6,6,7,7,7,6, 6,6,6,5,6,6,5,4,3,3, 3,4,3,2,4,4,null,null],
    weekend: [null,null,null,null,3,3,3,4,5,6,5,5,4, 4,4,4,3,4,4,3,3,2,null, null,null,null,null,null,null,null,null],
  },
  matatiki: {
    weekday: [null,null,2,3,4,5,5,6,7,7,7,7,7, 7,7,6,5,6,6,6,5,3,3, 3,4,4,2,5,5,5,null],
    weekend: [null,null,null,null,3,3,3,5,5,6,6,5,5, 5,4,4,4,4,4,3,3,2,null, null,null,null,null,null,null,null,null],
  },
  taiora: {
    // 10 lanes
    weekday: [null,2,3,4,5,null,7,8,8,9,9,9,8, 8,8,8,6,8,8,7,6,4,4, 4,5,5,3,6,6,6,null],
    weekend: [null,null,null,null,5,5,5,6,7,8,8,7,7, 6,6,6,5,6,6,5,4,3,null, null,null,null,null,null,null,null,null],
  },
  pioneer: {
    weekday: [null,null,2,2,3,4,4,5,5,5,5,5,4, 4,4,4,4,4,4,4,3,2,2, 2,3,3,2,3,3,null,null],
    weekend: [null,null,null,null,null,2,2,3,4,4,4,4,3, 3,3,3,3,3,2,2,2,null,null, null,null,null,null,null,null,null,null],
  },
  linwood: {
    weekday: [null,null,null,2,3,3,3,4,4,5,5,5,4, 4,4,4,3,4,4,4,3,2,2, 2,2,3,2,3,3,null,null],
    weekend: [null,null,null,null,null,2,2,3,3,4,4,3,3, 3,3,2,2,3,3,2,2,null,null, null,null,null,null,null,null,null,null],
  },
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

export function getLanesForPool(poolId, date) {
  const dow = date.getDay()
  const isWeekend = dow === 0 || dow === 6

  if (poolId === 'parakiore') {
    return PARAKIORE_WEEKLY[dow] || PARAKIORE_WEEKLY[1]
  }

  const pattern = OTHER_POOL_PATTERNS[poolId]
  if (!pattern) return TIME_SLOTS.map(() => null)
  return isWeekend ? pattern.weekend : pattern.weekday
}

export function getAvgLanesForPeriod(poolId, date, period) {
  const lanes = getLanesForPool(poolId, date)
  const slots = TIME_SLOTS.filter(t => t.hour >= period.hourStart && t.hour < period.hourEnd)
  const vals = slots.map((_, i) => {
    const idx = TIME_SLOTS.findIndex(t => t.hour >= period.hourStart) + i
    return lanes[idx]
  }).filter(v => v !== null && v !== undefined)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10
}

export function getQuietScore(poolId, date, period) {
  const pool = POOLS.find(p => p.id === poolId)
  if (!pool) return 0
  const avg = getAvgLanesForPeriod(poolId, date, period)
  // Score = % of max lanes free, weighted by max (bigger pool = more absolute lanes)
  return avg / pool.maxLanes
}

export function rankPoolsForDateTime(date, period) {
  return POOLS
    .map(pool => ({
      ...pool,
      avg: getAvgLanesForPeriod(pool.id, date, period),
      score: getQuietScore(pool.id, date, period),
      lanes: getLanesForPool(pool.id, date),
    }))
    .sort((a, b) => b.score - a.score)
}

export function formatDate(date) {
  return date.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function isToday(date) {
  const now = new Date()
  return date.toDateString() === now.toDateString()
}

// Generate dates for the next 12 months
export function generateCalendarDates() {
  const dates = []
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d)
  }
  return dates
}
