// Pool metadata + ranking helpers. Hand-maintained — safe to edit.
// Lane numbers live in ./lanes.json, which scripts/scrape.js overwrites weekly.
import LANES from './lanes.json' with { type: 'json' }
import { getClosedPoolIds } from './alerts.js'

export const LANES_UPDATED_AT = LANES.scrapedAt

export const POOLS = [
  { id:'parakiore', name:'Parakiore',          shortName:'Parakiore',   subtitle:'Te Puna o Whakaōho · Nga Puna Wai', maxLanes:20, color:'#7ecac3', url:'https://recandsport.ccc.govt.nz/parakiore/',                        features:['50m pool','25m pool','Hydroslides','Gym'],    tip:'Largest pool in Christchurch. 20 lanes mid-morning on weekdays.' },
  { id:'taiora',    name:'Taiora QEII',        shortName:'Taiora QEII', subtitle:'New Brighton',                       maxLanes:10, color:'#e8836a', url:'https://recandsport.ccc.govt.nz/taiora-qeii/',                      features:['50m pool','Wave pool','Hydroslides','Spa'],   tip:'Great 50m lanes, often less crowded than Parakiore.' },
  { id:'graham',    name:'Graham Condon',       shortName:'Graham C.',   subtitle:'Bishopdale · Harewood Rd',           maxLanes:8,  color:'#a8c5a0', url:'https://recandsport.ccc.govt.nz/graham-condon/',                    features:['25m pool','Spa','Gym'],                        tip:'Community pool. Quieter, great mid-morning lanes.' },
  { id:'matatiki',  name:'Matatiki Hornby',     shortName:'Matatiki',    subtitle:'Hornby · Shands Rd',                 maxLanes:8,  color:'#b8a4c9', url:'https://recandsport.ccc.govt.nz/matatiki-hornby-centre/',           features:['25m pool','Hydrotherapy','Gym'],               tip:'Newer facility, often less crowded than central pools.' },
  { id:'jellie',    name:'Jellie Park',         shortName:'Jellie Park', subtitle:'Fendalton · Ilam Rd',                maxLanes:8,  color:'#c4a882', url:'https://recandsport.ccc.govt.nz/jellie-park/',                     features:['25m pool','Outdoor pool','Hydroslide','Spa'], tip:'Outdoor lanes are a bonus in good weather.' },
  { id:'pioneer',   name:'Pioneer',             shortName:'Pioneer',     subtitle:'Spreydon · Colombo St',              maxLanes:6,  color:'#8fada0', url:'https://recandsport.ccc.govt.nz/pioneer/',                         features:['25m pool','Spa','Sauna'],                      tip:'Small, community feel. Good for quiet early mornings.' },
  { id:'linwood',   name:'Te Pou Toetoe',       shortName:'Linwood',     subtitle:'Linwood · Linwood Ave',              maxLanes:6,  color:'#d4a0b0', url:'https://recandsport.ccc.govt.nz/te-pou-toetoe-linwood-pool/',      features:['25m pool','Learner pool'],                     tip:'Neighbourhood pool, very quiet on weekday afternoons.' },
  { id:'lyttelton', name:'Norman Kirk Memorial', shortName:'Lyttelton',  subtitle:'Lyttelton · Summer pool',            maxLanes:4,  color:'#7eb8d4', url:'https://recandsport.ccc.govt.nz/norman-kirk-memorial-summer-pool/', features:['25m outdoor pool','Harbour views','Summer only'], tip:'Stunning outdoor pool overlooking Lyttelton Harbour. Open November to March only.', seasonal:true, seasonStart:11, seasonEnd:3, closedMessage:'Closed for winter — reopens November', openMessage:'Open now! Summer pool season' },
]

// Pools that appear in the ranked list: not seasonal, not currently closed (see alerts.js)
const CLOSED = getClosedPoolIds()
export const LANE_POOLS = POOLS.filter(p => !p.seasonal && !CLOSED.includes(p.id))

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

// Lyttelton summer pool — hand-maintained (not on the CCC lane page)
const LYT_OPEN = {
  1:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  2:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  3:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  4:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  5:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  6:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
  0:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
}

const EMPTY = TIME_SLOTS.map(() => null)

export function isLytteltonOpen(date) {
  const month = date.getMonth() + 1
  return month >= 11 || month <= 3
}

// Local calendar date → "YYYY-MM-DD" (matches the keys the scraper writes in NZ time)
export function dateKey(date) {
  const p = n => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`
}

// Lanes open to the public for each 30-min slot on the given date, plus where
// the numbers came from: exact = CCC's published column for that date,
// otherwise the typical-week pattern for that day-of-week.
export function getLanesInfo(poolId, date) {
  const dow = date.getDay()
  if (poolId === 'lyttelton') {
    if (!isLytteltonOpen(date)) return { lanes: TIME_SLOTS.map(() => 0), exact: false }
    return { lanes: LYT_OPEN[dow] || EMPTY, exact: false }
  }
  const pool = LANES.pools[poolId]
  if (!pool) return { lanes: EMPTY, exact: false }
  const dated = pool.dates?.[dateKey(date)]
  if (dated) return { lanes: dated, exact: true }
  return { lanes: pool.pattern?.[dow] || EMPTY, exact: false }
}

export function getLanesForPool(poolId, date) {
  return getLanesInfo(poolId, date).lanes
}

// True when every ranked pool has CCC's exact column for this date
export function isExactDate(date) {
  return LANE_POOLS.every(p => getLanesInfo(p.id, date).exact)
}

export function getAvgForPeriod(poolId, date, period) {
  const lanes = getLanesForPool(poolId, date)
  const vals = TIME_SLOTS
    .map((t, i) => t.hour >= period.hourStart && t.hour < period.hourEnd ? lanes[i] : null)
    .filter(v => v !== null && v !== undefined)
  if (!vals.length) return 0
  return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length * 10) / 10
}

export function rankPools(date, period) {
  return LANE_POOLS.map(p => {
    const avg = getAvgForPeriod(p.id, date, period)
    const score = avg / p.maxLanes
    const exact = getLanesInfo(p.id, date).exact
    return { ...p, avg, score, exact }
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
