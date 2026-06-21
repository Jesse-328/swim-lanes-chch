export const POOLS = [
  { id:'parakiore', name:'Parakiore',          shortName:'Parakiore',   subtitle:'Te Puna o Whakaōho · Nga Puna Wai', maxLanes:20, color:'#7ecac3', url:'https://recandsport.ccc.govt.nz/parakiore/',                        features:['50m pool','25m pool','Hydroslides','Gym'],    tip:'Largest pool in Christchurch. 20 lanes mid-morning on weekdays.' },
  { id:'taiora',    name:'Taiora QEII',        shortName:'Taiora QEII', subtitle:'New Brighton',                       maxLanes:10, color:'#e8836a', url:'https://recandsport.ccc.govt.nz/taiora-qeii/',                      features:['50m pool','Wave pool','Hydroslides','Spa'],   tip:'Great 50m lanes, often less crowded than Parakiore.' },
  { id:'graham',    name:'Graham Condon',       shortName:'Graham C.',   subtitle:'Bishopdale · Harewood Rd',           maxLanes:8,  color:'#a8c5a0', url:'https://recandsport.ccc.govt.nz/graham-condon/',                    features:['25m pool','Spa','Gym'],                        tip:'Community pool. Quieter, great mid-morning lanes.' },
  { id:'matatiki',  name:'Matatiki Hornby',     shortName:'Matatiki',    subtitle:'Hornby · Shands Rd',                 maxLanes:8,  color:'#b8a4c9', url:'https://recandsport.ccc.govt.nz/matatiki-hornby-centre/',           features:['25m pool','Hydrotherapy','Gym'],               tip:'Newer facility, often less crowded than central pools.' },
  { id:'jellie',    name:'Jellie Park',         shortName:'Jellie Park', subtitle:'Fendalton · Ilam Rd',                maxLanes:8,  color:'#c4a882', url:'https://recandsport.ccc.govt.nz/jellie-park/',                     features:['25m pool','Outdoor pool','Hydroslide','Spa'], tip:'Outdoor lanes are a bonus in good weather.' },
  { id:'pioneer',   name:'Pioneer',             shortName:'Pioneer',     subtitle:'Spreydon · Colombo St',              maxLanes:6,  color:'#8fada0', url:'https://recandsport.ccc.govt.nz/pioneer/',                         features:['25m pool','Spa','Sauna'],                      tip:'Small, community feel. Good for quiet early mornings.' },
  { id:'linwood',   name:'Te Pou Toetoe',       shortName:'Linwood',     subtitle:'Linwood · Linwood Ave',              maxLanes:6,  color:'#d4a0b0', url:'https://recandsport.ccc.govt.nz/te-pou-toetoe-linwood-pool/',      features:['25m pool','Learner pool'],                     tip:'Neighbourhood pool, very quiet on weekday afternoons.' },
  {
    id:'lyttelton',
    name:'Norman Kirk Memorial',
    shortName:'Lyttelton',
    subtitle:'Lyttelton · Summer pool',
    maxLanes:4,
    color:'#7eb8d4',
    url:'https://recandsport.ccc.govt.nz/norman-kirk-memorial-summer-pool/',
    features:['25m outdoor pool','Harbour views','Summer only'],
    tip:'Stunning outdoor pool overlooking Lyttelton Harbour. Open November to March only.',
    seasonal: true,
    seasonStart: 11,
    seasonEnd: 3,
    closedMessage: 'Closed for winter — reopens November',
    openMessage: 'Open now! Summer pool season',
  },
]

export const LANE_POOLS = POOLS.filter(p => !p.seasonal)

export const TIME_PERIODS = [
  { id:'early',     label:'Early bird', sublabel:'5:30–8am',   icon:'🌅', hourStart:5,  hourEnd:8  },
  { id:'morning',   label:'Morning',    sublabel:'8am–12pm',   icon:'☀️', hourStart:8,  hourEnd:12 },
  { id:'afternoon', label:'Afternoon',  sublabel:'12–4pm',     icon:'🌤️', hourStart:12, hourEnd:16 },
  { id:'evening',   label:'Evening',    sublabel:'4–8:30pm',   icon:'🌙', hourStart:16, hourEnd:21 },
]

export const TIME_SLOTS = [
  {label:'5:30am',hour:5.5},{label:'6:00am',hour:6},{label:'6:30am',hour:6.5},
  {label:'7:00am',hour:7},{label:'7:30am',hour:7.5},{label:'8:00am',hour:8},
  {label:'8:30am',hour:8.5},{label:'9:00am',hour:9},{label:'9:30am',hour:9.5},
  {label:'10:00am',hour:10},{label:'10:30am',hour:10.5},{label:'11:00am',hour:11},{label:'11:30am',hour:11.5},
  {label:'12:00pm',hour:12},{label:'12:30pm',hour:12.5},{label:'1:00pm',hour:13},{label:'1:30pm',hour:13.5},
  {label:'2:00pm',hour:14},{label:'2:30pm',hour:14.5},{label:'3:00pm',hour:15},{label:'3:30pm',hour:15.5},
  {label:'4:00pm',hour:16},{label:'4:30pm',hour:16.5},{label:'5:00pm',hour:17},{label:'5:30pm',hour:17.5},
  {label:'6:00pm',hour:18},{label:'6:30pm',hour:18.5},{label:'7:00pm',hour:19},
  {label:'7:30pm',hour:19.5},{label:'8:00pm',hour:20},{label:'8:30pm',hour:20.5},
]
// 31 slots total, indices 0–30

// ── Parakiore: scraped per day-of-week (0=Sun) ────────────────────────────────
const PAR = {
  1:[8,6,4,4,8,null,20,20,20,20,20,20,20,20,20,20,20,20,20,20,17,6,6,6,9,9,7,12,14,14,17],
  2:[6,4,4,4,8,10,10,10,10,10,10,10,10,10,10,10,null,20,20,20,20,12,9,9,9,7,1,7,7,7,7],
  3:[10,6,6,6,10,null,20,20,20,20,20,20,20,20,20,20,20,20,20,20,17,9,9,9,7,7,3,7,7,7,10],
  4:[4,4,4,4,7,9,9,10,10,10,10,10,10,10,10,10,null,20,20,20,20,12,9,9,9,9,2,10,10,10,10],
  5:[8,4,4,4,10,null,20,20,20,20,20,20,20,20,20,17,20,20,20,20,20,9,9,6,12,2,6,6,6,6,6],
  6:[null,null,null,8,8,6,6,10,10,10,8,8,8,8,8,8,8,8,8,8,6,4,4,4,6,8,6,8,8,null,null],
  0:[null,null,null,null,null,null,8,10,10,10,8,8,8,8,8,8,8,8,8,6,6,4,4,4,6,6,4,6,null,null,null],
}

// ── Lyttelton summer pattern ──────────────────────────────────────────────────
const LYT_OPEN = {
  1:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  2:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  3:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  4:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  5:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  6:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
  0:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
}

// ── Real scraped data (CCC June 2025, averaged across two weeks) ──────────────
// Weekday = Mon–Fri average | Weekend = Sat–Sun average
// null = pool closed at that slot | 0 = no lanes available (learn-to-swim etc)
const OTHER = {
  graham: {
    wd: [8,7,7,6,6,7,4,5,7,5,6,6,6, 6,6,4,5,6,6,5,4,2,2, 2,2,3,5,5,5,6,8],
    we: [null,null,null,8,8,5,4,3,3,4,4,4,5, 3,5,5,5,5,5,6,6,6,6, 8,8,6,6,8,8,null,null],
  },
  matatiki: {
    wd: [8,8,8,8,8,7,7,6,6,8,8,8,8, 8,8,8,8,8,8,6,5,5,4, 3,3,3,3,5,6,6,7],
    we: [null,null,null,6,6,6,5,4,5,5,4,4,5, 5,5,6,6,6,5,5,4,3,3, 3,3,5,6,6,6,null,null],
  },
  jellie: {
    // Jellie had no published data this week — using conservative estimates
    wd: [null,2,2,3,4,null,5,5,6,7,7,6,6, 6,6,5,5,6,6,5,4,3,3, 3,4,3,2,4,4,null,null],
    we: [null,null,null,null,3,3,3,4,5,6,5,5,4, 4,4,4,4,4,3,3,2,2,null, null,null,null,null,null,null,null,null],
  },
  pioneer: {
    wd: [5,5,5,5,5,5,5,2,2,3,3,3,3, 3,3,3,5,5,5,5,3,3,3, 3,3,3,4,2,3,5,5],
    we: [null,null,null,5,5,5,4,4,4,4,4,4,4, 4,4,5,5,5,5,5,5,5,5, 5,5,5,5,5,5,null,null],
  },
  taiora: {
    wd: [8,8,8,8,10,9,7,7,10,10,10,10,10, 10,10,10,10,9,9,8,7,6,6, 3,3,3,5,4,4,4,4],
    we: [null,null,null,8,8,8,8,9,4,4,4,4,4, 5,5,5,0,0,5,5,5,3,3, 3,3,2,7,7,7,null,null],
  },
  linwood: {
    wd: [6,6,6,6,6,6,5,5,6,6,6,6,5, 6,4,4,4,4,6,4,4,4,4, 4,4,4,4,5,5,6,6],
    we: [null,null,null,6,6,5,5,5,5,5,5,5,5, 2,2,2,2,2,2,4,4,4,4, 6,5,5,5,6,6,null,null],
  },
}

export function isLytteltonOpen(date) {
  const month = date.getMonth() + 1
  return month >= 11 || month <= 3
}

export function getLanesForPool(poolId, date) {
  const dow = date.getDay()
  const isWE = dow === 0 || dow === 6
  if (poolId === 'parakiore') return PAR[dow] || PAR[1]
  if (poolId === 'lyttelton') {
    if (!isLytteltonOpen(date)) return TIME_SLOTS.map(() => 0)
    return LYT_OPEN[dow] || LYT_OPEN[1]
  }
  const p = OTHER[poolId]
  if (!p) return TIME_SLOTS.map(() => null)
  return isWE ? p.we : p.wd
}

export function getAvgForPeriod(poolId, date, period) {
  const lanes = getLanesForPool(poolId, date)
  const vals = TIME_SLOTS
    .map((t, i) => t.hour >= period.hourStart && t.hour < period.hourEnd ? lanes[i] : null)
    .filter(v => v !== null && v !== undefined && v > 0)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length * 10) / 10
}

export function rankPools(date, period) {
  return LANE_POOLS.map(p => {
    const avg = getAvgForPeriod(p.id, date, period)
    const score = avg / p.maxLanes
    return { ...p, avg, score }
  }).sort((a,b) => b.score - a.score)
}

export function isToday(date) {
  return date.toDateString() === new Date().toDateString()
}

export function isTomorrow(date) {
  const t = new Date(); t.setDate(t.getDate()+1)
  return date.toDateString() === t.toDateString()
}

export function friendlyDate(date) {
  if (isToday(date)) return 'Today'
  if (isTomorrow(date)) return 'Tomorrow'
  return date.toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short'})
}

export function next365() {
  const out=[]; const s=new Date(); s.setHours(0,0,0,0)
  for(let i=0;i<365;i++){const d=new Date(s);d.setDate(s.getDate()+i);out.push(d)}
  return out
}
