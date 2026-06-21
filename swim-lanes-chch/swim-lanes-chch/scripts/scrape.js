#!/usr/bin/env node
/**
 * scrape.js — CCC Lane Availability Scraper (ES Module)
 * Runs in GitHub Actions via Puppeteer.
 */

import puppeteer from 'puppeteer'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Time slot definitions ─────────────────────────────────────────────────────
const TIME_SLOTS = [
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

function parseDayHeader(header) {
  const m = header.replace(/\n/g,'').match(/^(Mon|Tue|Wed|Thu|Thur|Fri|Sat|Sun)/i)
  if (!m) return null
  const d = m[1].toLowerCase()
  if (d === 'sun') return 0
  if (d === 'mon') return 1
  if (d === 'tue') return 2
  if (d === 'wed') return 3
  if (d === 'thu' || d === 'thur') return 4
  if (d === 'fri') return 5
  if (d === 'sat') return 6
  return null
}

function parseTimeLabel(label) {
  const m = label.replace(/\n/g,'').trim().match(/^(\d+)[\.:](\d+)(am|pm)$/i)
  if (!m) return null
  let h = parseInt(m[1])
  const mins = parseInt(m[2])
  const ampm = m[3].toLowerCase()
  if (ampm === 'pm' && h !== 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  return h + (mins >= 30 ? 0.5 : 0)
}

function parseCell(val) {
  if (!val || val === '-' || val === '') return null
  const cleaned = val.replace(/\*\*/g,'').replace(/&nbsp;/g,'').replace(/[^\d]/g,'').trim()
  if (!cleaned) return null
  const n = parseInt(cleaned)
  return isNaN(n) ? null : n
}

// ── Scrape ────────────────────────────────────────────────────────────────────
async function scrape() {
  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    headless: true,
  })

  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (compatible; SwimLanesChch/1.0)')

  console.log('Loading CCC page...')
  await page.goto('https://recandsport.ccc.govt.nz/swim/lane-availability/', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  })

  console.log('Waiting for tables...')
  await page.waitForSelector('table.js-make-table-scrollable', { timeout: 20000 })
  await new Promise(r => setTimeout(r, 2000))

  // Get pool names and table counts per accordion
  const poolSections = await page.evaluate(() => {
    return [...document.querySelectorAll('.c-accordion-alt')].map(acc => {
      const h = acc.querySelector('[class*="heading"]')
      const name = h ? h.innerText.trim().toLowerCase() : ''
      const tableCount = acc.querySelectorAll('table.js-make-table-scrollable').length
      return { name, tableCount }
    })
  })
  console.log('Pool sections:', poolSections)

  // Extract all table data
  const rawTables = await page.evaluate(() => {
    return [...document.querySelectorAll('table.js-make-table-scrollable')].map(t => {
      return [...t.querySelectorAll('tr')].map(r =>
        [...r.querySelectorAll('td')].map(td =>
          td.innerText.trim() || td.innerHTML.replace(/<[^>]+>/g,'').trim() || ''
        )
      )
    })
  })

  await browser.close()
  console.log(`Got ${rawTables.length} tables across ${poolSections.length} pools`)

  // ── Map tables to pools ───────────────────────────────────────────────────
  const poolTableMap = {}
  let tableIdx = 0

  for (const section of poolSections) {
    const { name, tableCount } = section
    let poolId = null
    if (name.includes('graham')) poolId = 'graham'
    else if (name.includes('jellie')) poolId = 'jellie'
    else if (name.includes('matatiki') || name.includes('hornby')) poolId = 'matatiki'
    else if (name.includes('parakiore')) poolId = 'parakiore'
    else if (name.includes('pioneer')) poolId = 'pioneer'
    else if (name.includes('taiora') || name.includes('qeii')) poolId = 'taiora'
    else if (name.includes('linwood') || name.includes('te pou')) poolId = 'linwood'

    if (poolId && tableCount > 0) {
      poolTableMap[poolId] = rawTables.slice(tableIdx, tableIdx + tableCount)
      console.log(`${poolId}: tables ${tableIdx}–${tableIdx + tableCount - 1}`)
    }
    tableIdx += tableCount
  }

  // ── Parse slot data ───────────────────────────────────────────────────────
  const result = {}

  for (const [poolId, tables] of Object.entries(poolTableMap)) {
    const slotData = []

    for (const table of tables) {
      if (!table.length) continue
      const headerRow = table[0]
      const dayCols = headerRow.slice(1).map(h => parseDayHeader(h))

      for (let r = 1; r < table.length; r++) {
        const row = table[r]
        if (!row.length) continue
        const hour = parseTimeLabel(row[0])
        if (hour === null) continue

        dayCols.forEach((dow, ci) => {
          if (dow === null) return
          const lanes = parseCell(row[ci + 1] || '')
          slotData.push({ hour, dow, lanes })
        })
      }
    }

    // Average per dow per slot
    const dowSlots = {}
    for (let d = 0; d <= 6; d++) dowSlots[d] = {}

    slotData.forEach(({ hour, dow, lanes }) => {
      if (!dowSlots[dow][hour]) dowSlots[dow][hour] = []
      dowSlots[dow][hour].push(lanes)
    })

    const buildArray = (dows) => TIME_SLOTS.map(slot => {
      const vals = []
      dows.forEach(d => {
        const dayVals = dowSlots[d]?.[slot.hour]
        if (dayVals) {
          const nonNull = dayVals.filter(v => v !== null)
          if (nonNull.length) vals.push(Math.round(nonNull.reduce((a,b)=>a+b,0)/nonNull.length))
        }
      })
      if (!vals.length) return null
      return Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
    })

    result[poolId] = {
      wd: buildArray([1,2,3,4,5]),
      we: buildArray([0,6]),
    }
    console.log(`${poolId} wd sample:`, result[poolId].wd.slice(0,6))
  }

  return result
}

// ── Defaults ──────────────────────────────────────────────────────────────────
function getDefault(pool, type) {
  const d = {
    graham:   { wd:[8,7,7,6,6,7,4,5,7,5,6,6,6,6,6,4,5,6,6,5,4,2,2,2,2,3,5,5,5,6,8], we:[null,null,null,8,8,5,4,3,3,4,4,4,5,3,5,5,5,5,5,6,6,6,6,8,8,6,6,8,8,null,null] },
    matatiki: { wd:[8,8,8,8,8,7,7,6,6,8,8,8,8,8,8,8,8,8,8,6,5,5,4,3,3,3,3,5,6,6,7], we:[null,null,null,6,6,6,5,4,5,5,4,4,5,5,5,6,6,6,5,5,4,3,3,3,3,5,6,6,6,null,null] },
    jellie:   { wd:[null,2,2,3,4,null,5,5,6,7,7,6,6,6,6,5,5,6,6,5,4,3,3,3,4,3,2,4,4,null,null], we:[null,null,null,null,3,3,3,4,5,6,5,5,4,4,4,4,4,4,3,3,2,2,null,null,null,null,null,null,null,null,null] },
    pioneer:  { wd:[5,5,5,5,5,5,5,2,2,3,3,3,3,3,3,3,5,5,5,5,3,3,3,3,3,3,4,2,3,5,5], we:[null,null,null,5,5,5,4,4,4,4,4,4,4,4,4,5,5,5,5,5,5,5,5,5,5,5,5,5,5,null,null] },
    taiora:   { wd:[8,8,8,8,10,9,7,7,10,10,10,10,10,10,10,10,10,9,9,8,7,6,6,3,3,3,5,4,4,4,4], we:[null,null,null,8,8,8,8,9,4,4,4,4,4,5,5,5,0,0,5,5,5,3,3,3,3,2,7,7,7,null,null] },
    linwood:  { wd:[6,6,6,6,6,6,5,5,6,6,6,6,5,6,4,4,4,4,6,4,4,4,4,4,4,4,4,5,5,6,6], we:[null,null,null,6,6,5,5,5,5,5,5,5,5,2,2,2,2,2,2,4,4,4,4,6,5,5,5,6,6,null,null] },
  }
  return d[pool]?.[type] || Array(31).fill(null)
}

function getDefaultPar() {
  return {
    1:[8,6,4,4,8,null,20,20,20,20,20,20,20,20,20,20,20,20,20,20,17,6,6,6,9,9,7,12,14,14,17],
    2:[6,4,4,4,8,10,10,10,10,10,10,10,10,10,10,10,null,20,20,20,20,12,9,9,9,7,1,7,7,7,7],
    3:[10,6,6,6,10,null,20,20,20,20,20,20,20,20,20,20,20,20,20,20,17,9,9,9,7,7,3,7,7,7,10],
    4:[4,4,4,4,7,9,9,10,10,10,10,10,10,10,10,10,null,20,20,20,20,12,9,9,9,9,2,10,10,10,10],
    5:[8,4,4,4,10,null,20,20,20,20,20,20,20,20,20,17,20,20,20,20,20,9,9,6,12,2,6,6,6,6,6],
    6:[null,null,null,8,8,6,6,10,10,10,8,8,8,8,8,8,8,8,8,8,6,4,4,4,6,8,6,8,8,null,null],
    0:[null,null,null,null,null,null,8,10,10,10,8,8,8,8,8,8,8,8,8,6,6,4,4,4,6,6,4,6,null,null,null],
  }
}

// ── Generate data.js ──────────────────────────────────────────────────────────
function generateDataJs(scraped, scrapedAt) {
  const par = scraped.parakiore ? {
    0: scraped.parakiore.we || getDefaultPar()[0],
    1: scraped.parakiore.wd || getDefaultPar()[1],
    2: scraped.parakiore.wd || getDefaultPar()[2],
    3: scraped.parakiore.wd || getDefaultPar()[3],
    4: scraped.parakiore.wd || getDefaultPar()[4],
    5: scraped.parakiore.wd || getDefaultPar()[5],
    6: scraped.parakiore.we || getDefaultPar()[6],
  } : getDefaultPar()

  const g = scraped.graham   || {}
  const m = scraped.matatiki || {}
  const p = scraped.pioneer  || {}
  const t = scraped.taiora   || {}
  const l = scraped.linwood  || {}

  return `// AUTO-GENERATED by scripts/scrape.js — do not edit manually
// Last scraped: ${scrapedAt}

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

const PAR = ${JSON.stringify(par, null, 2)}

const LYT_OPEN = {
  1:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  2:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  3:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  4:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  5:[null,null,null,null,null,null,null,null,3,4,4,4,4,4,4,4,3,3,3,3,2,null,null,null,null,null,null,null,null,null,null],
  6:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
  0:[null,null,null,null,null,null,null,null,2,3,3,4,4,4,3,3,3,3,2,2,2,null,null,null,null,null,null,null,null,null,null],
}

const OTHER = {
  graham:   { wd: ${JSON.stringify(g.wd || getDefault('graham','wd'))},   we: ${JSON.stringify(g.we || getDefault('graham','we'))} },
  matatiki: { wd: ${JSON.stringify(m.wd || getDefault('matatiki','wd'))}, we: ${JSON.stringify(m.we || getDefault('matatiki','we'))} },
  jellie:   { wd: ${JSON.stringify(getDefault('jellie','wd'))},            we: ${JSON.stringify(getDefault('jellie','we'))} },
  pioneer:  { wd: ${JSON.stringify(p.wd || getDefault('pioneer','wd'))},  we: ${JSON.stringify(p.we || getDefault('pioneer','we'))} },
  taiora:   { wd: ${JSON.stringify(t.wd || getDefault('taiora','wd'))},   we: ${JSON.stringify(t.we || getDefault('taiora','we'))} },
  linwood:  { wd: ${JSON.stringify(l.wd || getDefault('linwood','wd'))},  we: ${JSON.stringify(l.we || getDefault('linwood','we'))} },
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
`
}

// ── Run ───────────────────────────────────────────────────────────────────────
try {
  const scraped = await scrape()
  const scrapedAt = new Date().toISOString()
  const poolsFound = Object.keys(scraped).length
  console.log(`\nScraped ${poolsFound} pools:`, Object.keys(scraped))

  if (poolsFound === 0) {
    console.error('ERROR: No pools scraped — aborting')
    process.exit(1)
  }

  const dataJs = generateDataJs(scraped, scrapedAt)
  const outPath = join(__dirname, '..', 'src', 'data.js')
  writeFileSync(outPath, dataJs, 'utf8')
  console.log(`✓ Written to ${outPath}`)
  console.log(`✓ Scraped at ${scrapedAt}`)
} catch (err) {
  console.error('Scrape failed:', err)
  process.exit(1)
}
